const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = readFileSync(join(__dirname, "../src/js/diagnostics.js"), "utf8");

const databaseSource = readFileSync(join(__dirname, "../src/js/db.js"), "utf8");

function journal({ persistent = false, withDomain = false, clipboard = {}, clipboardItem } = {}) {
  let now = Date.UTC(2026, 0, 1);
  const values = new Map();
  const handlers = new Map();
  const controls = new Map();
  let stored;
  let domainTx;
  const journalConnection = {
    transaction() {
      const tx = {
        abort() { queueMicrotask(() => tx.onabort()); },
        objectStore() {
          return {
            get() {
              const request = {};
              queueMicrotask(() => request.onsuccess({ target: { result: structuredClone(stored) } }));
              return request;
            },
            put(value) {
              stored = structuredClone(value);
              queueMicrotask(() => tx.oncomplete());
            },
            delete() {
              stored = undefined;
              queueMicrotask(() => tx.oncomplete());
            }
          };
        }
      };
      return tx;
    }
  };
  const context = vm.createContext({
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now; }
    },
    TextEncoder, crypto: webcrypto, DB_VERSION: 3, DOMException,
    indexedDB: { open() {
      if (!persistent) throw new DOMException("private path", "SecurityError");
      const request = { result: journalConnection };
      queueMicrotask(() => request.onsuccess());
      return request;
    } },
    localStorage: { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) },
    Blob, ClipboardItem: clipboardItem, navigator: { clipboard },
    window: { addEventListener() {}, innerWidth: 390, innerHeight: 844, ClipboardItem: clipboardItem },
    document: {
      querySelector(selector) {
        if (!controls.has(selector)) controls.set(selector, {
          addEventListener: (name, handler) => handlers.set(selector + ":" + name, handler)
        });
        return controls.get(selector);
      },
      getElementById: () => null,
      body: { classList: { contains: () => false } }
    },
    matchMedia: () => ({ matches: false }),
    performance: { getEntriesByType: () => [] },
    location: { href: "file:///secret/path/dist/index.html" },
    setTimeout: () => 1, clearTimeout() {}
  });
  const api = vm.runInContext(source + (withDomain ? "\n" + databaseSource : "") + "\n;diagnostics", context);
  if (withDomain) {
    context.domainConnection = {
      transaction() {
        domainTx = { objectStore: () => ({ put() {} }) };
        return domainTx;
      },
      close() {}
    };
    vm.runInContext("openDatabase = async () => domainConnection;", context);
  }
  return {
    api, click: selector => handlers.get(selector + ":click")(),
    stored: () => stored, domainTx: () => domainTx,
    put: op => {
      context.op = op;
      return vm.runInContext('diagnostics.bind(op, taskDb.put)({ id: "raw-task-id", title: "title-secret" })', context);
    },
    advance: hours => { now += hours * 3600000; },
    error: message => vm.runInContext("new TypeError(" + JSON.stringify(message) + ")", context)
  };
}

function events(report) {
  return report.text.split("\n").filter(line => line.startsWith("{")).map(JSON.parse);
}

test("age eviction is rolling, shortening prunes, and disabling discards old operations", async () => {
  const { api, advance } = journal();
  const original = api.start("task.create");
  advance(2);
  api.start("task.edit");
  assert.equal((await api.report()).count, 3);
  await api.setRetention(1);
  assert.deepEqual(events(await api.report()).map(row => row.action), ["task.edit"]);
  advance(2);
  assert.equal((await api.report()).count, 0);
  await api.setRetention(0);
  assert.equal(api.start("task.delete"), null);
  assert.equal((await api.report()).count, 0);
  await api.setRetention(168);
  api.capture("write.committed", original);
  assert.equal((await api.report()).count, 0);
});

test("count and UTF-8 byte limits independently evict the oldest events", async () => {
  const { api } = journal();
  for (let index = 0; index < 2015; index++) api.start("task.edit");
  let report = await api.report();
  let rows = events(report);
  assert.equal(rows.length, 2000);
  assert.equal(rows.at(-1).seq, 2016);
  assert.ok(rows[0].seq > 1);
  const sample = Array.from({ length: 20 }, (_, id) => ({ id: String(id), listId: "list" }));
  for (let index = 0; index < 2000; index++) api.start("task.bulk_delete", { sample, count: 20 });
  report = await api.report();
  rows = events(report);
  assert.ok(rows.length < 2000);
  assert.ok(Buffer.byteLength(JSON.stringify(rows)) <= 512 * 1024);
  assert.equal(rows.at(-1).details.sample.length, 4);
  assert.match(report.text, /Dropped events [1-9]/);
});

test("fallback preserves order, correlation and coalesced sanitized errors", async () => {
  const { api, error, advance } = journal();
  const secret = "synthetic-private-title-query-file";
  const op = api.start("task.move_editor", { task: secret, title: secret, description: secret, query: secret, filename: secret });
  api.capture("write.started", op, { task: secret, stores: ["tasks", secret] });
  api.error(op, error(secret));
  advance(0.01);
  api.error(op, error(secret));
  const report = await api.report();
  const rows = events(report).slice(1);
  assert.match(report.text, /Evidence in-memory only/);
  assert.match(report.text, /Coalesced duplicates 1/);
  assert.ok(!report.text.includes(secret));
  assert.ok(!report.text.includes("private path"));
  assert.deepEqual(rows.map(row => row.event), ["operation.started", "write.started", "error"]);
  assert.ok(rows.every(row => row.op === rows[0].op));
  assert.ok(rows[0].seq < rows[1].seq && rows[1].seq < rows[2].seq);
  assert.equal(rows[1].details.task, rows[0].details.task);
  assert.deepEqual(rows[1].details.stores, ["tasks"]);
  assert.equal(rows[2].details.error, "TypeError");
  assert.equal(rows[2].count, 2);
  assert.ok(rows[2].lastTime > rows[2].firstTime);
});


test("persistent trace keeps write and view outcomes under one operation and preserves only allowed fields", async t => {
  const { api, stored, domainTx, put, advance, error } = journal({ persistent: true, withDomain: true });
  const secrets = ["raw-task-id", "source-list-secret", "target-list-secret", "title-secret",
    "clipboard-text-secret", "filename-secret", "query-secret", "exception-secret"];
  const [task, from, to, title, clipboard, filename, query, message] = secrets;
  const op = api.start("task.move_editor", { to });
  api.capture("move.planned", op, { task, from, to, title, clipboard, filename, query });
  advance(0.01);
  const write = put(op);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(!events(await api.report()).some(event => event.event === "write.committed"));
  domainTx().oncomplete();
  await write;
  advance(0.01);
  api.capture("view.observed", op, { task, list: from, present: false, count: 0 });
  api.error(op, error(message), "render");
  const report = await api.report();
  assert.match(report.text, /Evidence persistent/);
  const trace = events(report).filter(row => row.op === op.id);
  assert.deepEqual(trace.map(row => row.event), [
    "operation.started", "move.planned", "write.started", "write.committed", "view.observed", "error"
  ]);
  assert.equal(trace[1].details.task, trace[4].details.task);
  assert.equal(trace[1].details.from, trace[4].details.list);
  assert.equal(trace[4].details.present, false);
  for (const secret of secrets) {
    assert.ok(!JSON.stringify(stored()).includes(secret));
    assert.ok(!report.text.includes(secret));
  }
  t.diagnostic(report.text.split("\n")[0]);
  for (const row of [trace[1], trace[3], trace[4]]) t.diagnostic(JSON.stringify(row));

  const abortedOp = api.start("task.move_editor", { to });
  const aborted = put(abortedOp);
  const failure = assert.rejects(aborted);
  await new Promise(resolve => setImmediate(resolve));
  domainTx().onabort();
  await failure;
  const outcomes = events(await api.report()).filter(row => row.op === abortedOp.id).map(row => row.event);
  assert.ok(outcomes.includes("write.aborted"));
  assert.ok(!outcomes.includes("write.committed"));
  await api.setRetention(0);
  assert.equal(stored(), undefined);
});

test("copy passes the report verbatim as plain text on both clipboard API paths", async () => {
  for (const useItem of [false, true]) {
    let copied;
    const clipboardItem = useItem ? class {
      constructor(parts) { this.parts = parts; }
    } : undefined;
    const clipboard = useItem ? {
      async write([item]) {
        assert.deepEqual(Object.keys(item.parts), ["text/plain"]);
        const blob = await item.parts["text/plain"];
        assert.equal(blob.type, "text/plain");
        copied = await blob.text();
      }
    } : { async writeText(text) { copied = text; } };
    const { api, click } = journal({ clipboard, clipboardItem });
    const op = api.start("navigation.list");
    api.capture("view.observed", op, { count: 1 });
    await click("#diagnostics-copy");
    assert.equal(copied, (await api.report()).text);
    assert.match(copied, /"event":"view\.observed"/);
    assert.ok(!copied.includes("\\"));
    assert.equal(events({ text: copied }).length, 3);
  }
});
