const diagnostics = (() => {
  const preferenceKey = "dims-tasks-diagnostics-v1";
  const windows = [0, 1, 24, 72, 168];
  const maxEvents = 2000;
  const maxBytes = 512 * 1024;
  const metadataBytes = 384;
  const encoder = new TextEncoder();
  const uuid = () => [...crypto.getRandomValues(new Uint8Array(16))]
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
  const session = uuid();
  let sequence = 0;
  let operation = 0;
  let currentOperation = null;
  let memoryOnly = false;
  let preferenceUnavailable = false;
  let connection;
  let timer;
  let queue = Promise.resolve();
  let pending = empty();
  let fallback = empty();
  let preference = { hours: 24, epoch: uuid(), salt: uuid(), cutoff: 0 };

  function empty() { return { events: [], dropped: 0, coalesced: 0 }; }

  let pendingBytes = 0;

  function syncPreference() {
    if (preferenceUnavailable) return;
    try {
      const raw = localStorage.getItem(preferenceKey);
      if (!raw) localStorage.setItem(preferenceKey, JSON.stringify(preference));
      else {
        const next = JSON.parse(raw);
        if (windows.includes(next.hours) && /^[a-f0-9]{32}$/.test(next.epoch) && /^[a-f0-9]{32}$/.test(next.salt)) {
          if (preference.epoch !== next.epoch) { pending = empty(); pendingBytes = 0; fallback = empty(); }
          preference = { ...next, cutoff: Number.isSafeInteger(next.cutoff) ? next.cutoff : 0 };
        }
      }
    } catch {
      preferenceUnavailable = true;
      memoryOnly = true;
    }
  }

  function alias(kind, id) {
    if (typeof id !== "string" || !id || id.length > 4096) return null;
    const input = preference.salt + ":" + kind + ":" + id;
    let first = 0x811c9dc5;
    let second = 0x9e3779b9;
    for (let index = 0; index < input.length; index++) {
      const code = input.charCodeAt(index);
      first = Math.imul(first ^ code, 0x01000193);
      second = Math.imul(second ^ code, 0x85ebca77);
    }
    for (let index = preference.salt.length - 1; index >= 0; index--) {
      const code = preference.salt.charCodeAt(index);
      first = Math.imul((first ^ first >>> 16) + (second ^ code), 0x7feb352d);
      second = Math.imul((second ^ second >>> 15) + (first ^ code), 0x846ca68b);
    }
    return kind + "-" + (first >>> 0).toString(16).padStart(8, "0") + (second >>> 0).toString(16).padStart(8, "0");
  }

  function prune(state, hours, now = Date.now(), count = maxEvents, bytes = maxBytes) {
    if (!hours) return empty();
    const cutoff = now - hours * 3600000;
    const sorted = state.events.sort((a, b) => a.time - b.time || a.session.localeCompare(b.session) || a.seq - b.seq);
    const recent = sorted.filter(event => (event.lastTime ?? event.time) >= cutoff);
    for (const event of recent) {
      if (event.time < cutoff) {
        event.time = event.lastTime;
        event.seq = event.lastSeq;
        delete event.firstTime;
      }
    }
    recent.sort((a, b) => a.time - b.time || a.session.localeCompare(b.session) || a.seq - b.seq);
    let first = Math.max(0, recent.length - count);
    const sizes = recent.slice(first).map(event => encoder.encode(JSON.stringify(event)).length + 1);
    // Reserve space for snapshot metadata, including the epoch and counters.
    let size = sizes.reduce((sum, item) => sum + item, metadataBytes);
    for (const item of sizes) {
      if (size <= bytes) break;
      size -= item;
      first++;
    }
    return { events: recent.slice(first), dropped: state.dropped + sorted.length - recent.length + first,
      coalesced: state.coalesced };
  }

  function add(state, event) {
    const previous = state.events.at(-1);
    if (event.event === "error" && previous?.event === "error" &&
      previous.session === event.session && previous.op === event.op && previous.action === event.action &&
      previous.screen === event.screen && JSON.stringify(previous.details) === JSON.stringify(event.details)) {
      previous.firstTime ??= previous.time;
      previous.lastTime = event.lastTime ?? event.time;
      previous.lastSeq = event.lastSeq ?? event.seq;
      previous.count = (previous.count || 1) + (event.count || 1);
      state.coalesced++;
      return true;
    }
    state.events.push(event);
    return false;
  }

  function pruneCurrent(state) {
    const now = Math.max(Date.now(), preference.cutoff + preference.hours * 3600000);
    return prune(state, preference.hours, now);
  }

  function open() {
    if (!connection) connection = new Promise((resolve, reject) => {
      const request = indexedDB.open("dims-tasks-diagnostics", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("journal");
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error());
      request.onsuccess = () => {
        if (memoryOnly) { request.result.close(); reject(new Error()); return; }
        request.result.onversionchange = () => { request.result.close(); connection = null; };
        resolve(request.result);
      };
    });
    return connection;
  }

  async function snapshot() {
    syncPreference();
    if (!memoryOnly) {
      let batch;
      let epoch;
      try {
        const db = await open();
        return await new Promise((resolve, reject) => {
          const tx = db.transaction("journal", "readwrite");
          const store = tx.objectStore("journal");
          let state;
          tx.onabort = () => reject(tx.error);
          tx.oncomplete = () => resolve(state);
          store.get("history").onsuccess = event => {
            try {
              syncPreference();
              epoch = preference.epoch;
              batch = pending;
              pending = empty(); pendingBytes = 0;
              const saved = event.target.result;
              state = saved?.epoch === epoch ? saved.state : empty();
              for (const entry of batch.events) add(state, entry);
              state.dropped += batch.dropped;
              state.coalesced += batch.coalesced;
              state = pruneCurrent(state);
              if (preference.hours) store.put({ epoch, state }, "history");
              else store.delete("history");
            } catch { tx.abort(); }
          };
        });
      } catch {
        memoryOnly = true;
        syncPreference();
        if (epoch === preference.epoch && batch) {
          for (const entry of batch.events) add(fallback, entry);
          fallback.dropped += batch.dropped;
          fallback.coalesced += batch.coalesced;
        }
      }
    }
    for (const entry of pending.events) add(fallback, entry);
    fallback.dropped += pending.dropped;
    fallback.coalesced += pending.coalesced;
    pending = empty(); pendingBytes = 0;
    fallback = pruneCurrent(fallback);
    return fallback;
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    queue = queue.then(snapshot, snapshot);
    return queue;
  }

  function screen() {
    if (document.body.classList.contains("settings-open")) return "settings";
    if (document.body.classList.contains("main-menu-open")) return "main_menu";
    for (const [id, name] of [["global-search", "search"], ["completed-tasks-screen", "completed"],
      ["project-screen", "project"], ["projects-overview", "projects"], ["upcoming-screen", "upcoming"],
      ["task-editor", "task_editor"]]) {
      const element = document.getElementById(id);
      if (element && !element.hidden && (element.tagName !== "DIALOG" || element.open)) return name;
    }
    return "list";
  }

  function details(fields = {}) {
    const result = {};
    for (const [field, kind] of Object.entries({ task: "task", from: "list", to: "list",
      list: "list", project: "project", section: "section", group: "group", beforeTask: "task", beforeList: "list", beforeProject: "project", beforeGroup: "group" })) {
      if (Object.hasOwn(fields, field)) result[field] = alias(kind, fields[field]);
    }
    for (const field of ["count", "position", "previousPosition", "nextPosition", "width", "height"]) {
      if (Number.isSafeInteger(fields[field])) result[field] = fields[field];
    }
    for (const field of ["present", "filterActive", "standalone", "reload", "active", "completed", "lists", "projects", "settings"]) {
      if (typeof fields[field] === "boolean") result[field] = fields[field];
    }
    if (["all", "task", "project", "list"].includes(fields.filter)) result.filter = fields.filter;
    if (["merge", "replace", "keyboard", "drag"].includes(fields.method)) result.method = fields.method;
    if (Number.isSafeInteger(fields.parent)) result.parent = fields.parent;
    if (Array.isArray(fields.stores)) result.stores = fields.stores.filter(name =>
      ["tasks", "lists", "sections", "projects", "settings"].includes(name)).slice(0, 5);
    if (Array.isArray(fields.sample)) result.sample = fields.sample.slice(0, 4).map(item => ({
      task: alias("task", item.id), from: alias("list", item.listId)
    }));
    const classes = ["AbortError", "ConstraintError", "DataError", "DataCloneError", "Error",
      "InvalidStateError", "NotAllowedError", "NotFoundError", "QuotaExceededError", "RangeError",
      "ReferenceError", "SecurityError", "SyntaxError", "TransactionInactiveError", "TypeError", "UnknownError", "VersionError"];
    if (Object.hasOwn(fields, "error")) result.error = classes.includes(fields.error) ? fields.error : "UnknownError";
    if (["callback", "uncaught", "rejection", "render", "transaction", "validation"].includes(fields.phase)) {
      result.phase = fields.phase;
    }
    if (Array.isArray(fields.frames)) result.frames = fields.frames.filter(frame => Number.isSafeInteger(frame)).slice(0, 4);
    return result;
  }

  function capture(event, op, fields) {
    try {
      syncPreference();
      if (!preference.hours || (op && op.epoch !== preference.epoch) ||
        (!op && event !== "error" && event !== "session.started")) return;
      const entry = { time: Date.now(), seq: ++sequence, session, event, op: op?.id ?? null,
        action: op?.action ?? null, screen: screen(), details: details(fields) };
      const sizeOf = item => encoder.encode(JSON.stringify(item)).length + 1;
      const size = sizeOf(entry);
      if (size > 1536) { pending.dropped++; return; }
      const previous = pending.events.at(-1);
      const previousSize = previous?.event === "error" && event === "error" ? sizeOf(previous) : 0;
      pendingBytes += add(pending, entry) ? sizeOf(previous) - previousSize : size;
      // Capture is bounded even when IndexedDB is temporarily slow.
      while (pending.events.length > maxEvents || pendingBytes > maxBytes - metadataBytes) {
        pendingBytes -= sizeOf(pending.events.shift());
        pending.dropped++;
      }
      if (!timer) timer = setTimeout(flush, 35);
    } catch { /* Diagnostics must not affect the action. */ }
  }

  function start(action, fields) {
    syncPreference();
    if (!preference.hours) return null;
    const op = { id: ++operation, action, epoch: preference.epoch };
    capture("operation.started", op, fields);
    return op;
  }

  function error(op, cause, phase = "callback") {
    try {
      // Inline application coordinates are accepted only from this document.
      // Neither exception text nor raw stack lines are retained.
      const frames = [];
      if (cause instanceof Error && typeof cause.stack === "string") {
        const source = location.href.split("#")[0];
        for (const line of cause.stack.split("\n").slice(1, 12)) {
          const index = line.lastIndexOf(source + ":");
          const match = index < 0 ? null : /^:(\d+):\d+\)?$/.exec(line.slice(index + source.length));
          if (match) frames.push(Number(match[1]));
        }
      }
      capture("error", op, { error: cause instanceof Error || cause instanceof DOMException ? cause.name : null, phase, frames });
    } catch { /* Error reporting never replaces the original failure. */ }
  }

  function bind(op, callback) {
    return (...args) => {
      const previous = currentOperation;
      currentOperation = op;
      try { return callback(...args); }
      finally { currentOperation = previous; }
    };
  }

  function transaction(stores) {
    const op = currentOperation || start("database.write", { stores });
    if (op) capture("write.started", op, { stores });
    return op;
  }

  function observe(op, render) {
    try { return render(); }
    catch (cause) {
      error(op, cause, "render");
      throw cause;
    }
  }

  function order(op, kind, previous, changed, selectedIds, positionOf = item => item.position) {
    if (!op) return;
    capture("order.planned", op, { count: changed.length });
    const sample = [];
    let checked = 0;
    for (const id of selectedIds) {
      if (checked++ === 4) break;
      const item = changed.find(record => record.id === id);
      if (item) sample.push(item);
      if (sample.length === 3) break;
    }
    for (const item of changed.slice(0, 4)) {
      if (!sample.includes(item)) sample.push(item);
      if (sample.length === 4) break;
    }
    for (const item of sample) {
      const original = previous.find(record => record.id === item.id);
      capture("order.position", op, { [kind]: item.id,
        previousPosition: original && positionOf(original), nextPosition: positionOf(item) });
    }
  }

  async function report() {
    const epoch = preference.epoch;
    const result = await flush();
    syncPreference();
    const state = epoch === preference.epoch ? result : await flush();
    const now = new Date();
    const events = preference.hours ? state.events : [];
    const first = events[0]?.time;
    const last = events.reduce((end, entry) => Math.max(end, entry.lastTime ?? entry.time), 0);
    const iso = time => time === undefined ? "none" : new Date(time).toISOString();
    const build = document.querySelector('meta[name="dimstasks-build"]')?.content;
    const header = [
      "DimsTasks diagnostic report / schema 1",
      "Generated " + now.toISOString() + " | UTC offset in minutes " + -now.getTimezoneOffset(),
      "Build " + (/^[a-f0-9]{12}$/.test(build) ? build : "unknown") + " | Database " + DB_VERSION,
      "Retention hours " + preference.hours + " | Events " + events.length + " | Coverage " + iso(first) + " .. " + iso(last || undefined),
      "Dropped events " + state.dropped + " | Coalesced duplicates " + state.coalesced + " | Evidence " + (memoryOnly ? "in-memory only" : "persistent"),
      "Legend: time is Unix ms; seq, op and parent are scoped to session (one page load); entity aliases are local. write.committed means IndexedDB completed; write.aborted means it rolled back; view.observed means the rendered result set. Missing stages can indicate a partial trace. Error frames are built index.html line numbers."
    ];
    return { text: header.concat(events.map(entry => JSON.stringify(entry))).join("\n"), count: events.length, first, last };
  }

  async function setRetention(hours) {
    if (!windows.includes(hours)) return;
    syncPreference();
    const cutoff = hours && hours < preference.hours
      ? Math.max(preference.cutoff, Date.now() - hours * 3600000) : preference.cutoff;
    preference = { hours, cutoff: hours ? cutoff : 0, epoch: hours ? preference.epoch : uuid(),
      salt: hours ? preference.salt : uuid() };
    if (!hours) { pending = empty(); pendingBytes = 0; fallback = empty(); }
    try { localStorage.setItem(preferenceKey, JSON.stringify(preference)); }
    catch { preferenceUnavailable = true; }
    await flush();
  }

  syncPreference();
  window.addEventListener("storage", event => {
    if (event.key !== preferenceKey) return;
    syncPreference();
    const output = document.querySelector("#diagnostics-report");
    if (output) { output.hidden = true; output.value = ""; }
    flush();
  });
  window.addEventListener("pagehide", () => { if (pending.events.length) flush(); });
  window.addEventListener("error", event => error(null, event.error, "uncaught"));
  window.addEventListener("unhandledrejection", event => error(null, event.reason, "rejection"));
  capture("session.started", null, { width: window.innerWidth, height: window.innerHeight,
    standalone: matchMedia("(display-mode: standalone)").matches,
    reload: performance.getEntriesByType("navigation")[0]?.type === "reload" });
  flush();
  return { start, capture, bind, transaction, error, report, setRetention, observe, order,
    context: () => currentOperation,
    hours: () => preference.hours, memoryOnly: () => memoryOnly };
})();

function setupDiagnosticsSettings() {
  const panel = document.querySelector("#diagnostics-settings");
  const retention = document.querySelector("#diagnostics-retention");
  const coverage = document.querySelector("#diagnostics-coverage");
  const copy = document.querySelector("#diagnostics-copy");
  const download = document.querySelector("#diagnostics-download");
  const output = document.querySelector("#diagnostics-report");
  const status = document.querySelector("#diagnostics-status");
  const date = value => new Date(value).toLocaleString("uk-UA");
  let generation = 0;

  function clearCopy() {
    status.textContent = "";
    output.hidden = true;
    output.value = "";
  }

  function showCoverage(report) {
    const hours = diagnostics.hours();
    retention.value = String(hours);
    copy.disabled = download.disabled = !hours;
    coverage.textContent = hours
      ? report.count ? `Подій: ${report.count}. Період: ${date(report.first)} — ${date(report.last)}.`
        : "У журналі поки немає подій."
      : "Журнал вимкнено.";
    if (hours && diagnostics.memoryOnly()) coverage.textContent += " Доступні лише події в пам’яті цієї вкладки.";
  }

  async function refreshCoverage() {
    const version = ++generation;
    const report = await diagnostics.report();
    if (version === generation) showCoverage(report);
  }

  panel.addEventListener("toggle", () => { if (panel.open) refreshCoverage(); });
  retention.addEventListener("change", async () => {
    const version = ++generation;
    const hours = Number(retention.value);
    clearCopy();
    copy.disabled = download.disabled = true;
    await diagnostics.setRetention(hours);
    if (version === generation) await refreshCoverage();
  });
  window.addEventListener("storage", () => {
    if (!panel.open) return;
    clearCopy();
    refreshCoverage();
  });
  download.addEventListener("click", async () => {
    const version = ++generation;
    clearCopy();
    const report = await diagnostics.report();
    if (version !== generation || !diagnostics.hours()) return;
    showCoverage(report);
    const file = new Blob([report.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "DimsTasks-diagnostics.txt";
    document.body.append(link);
    try { link.click(); }
    finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  });
  copy.addEventListener("click", async () => {
    const version = ++generation;
    clearCopy();
    const reportPromise = diagnostics.report();
    let clipboardWrite;
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        // Start the clipboard request while Safari still has user activation.
        clipboardWrite = navigator.clipboard.write([new ClipboardItem({
          "text/plain": reportPromise.then(report => {
            if (version !== generation || !diagnostics.hours()) throw new Error();
            return new Blob([report.text], { type: "text/plain" });
          })
        })]).then(() => true, () => false);
      }
    } catch { /* Fall back to the text clipboard or the selectable report. */ }
    const report = await reportPromise;
    if (version !== generation || !diagnostics.hours()) return;
    showCoverage(report);
    try {
      if (clipboardWrite) {
        if (!await clipboardWrite) throw new Error();
      } else await navigator.clipboard.writeText(report.text);
      if (version === generation) status.textContent = "Звіт скопійовано.";
    } catch {
      if (version !== generation) return;
      output.value = report.text;
      output.hidden = false;
      status.textContent = "Виділіть і скопіюйте текст звіту вручну.";
      output.focus();
      output.select();
    }
  });
}
setupDiagnosticsSettings();
