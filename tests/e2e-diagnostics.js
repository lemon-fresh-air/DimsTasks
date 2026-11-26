const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { openTestApp } = require("./e2e-helper");

const title = "ПРИВАТНЕ_SYNTH_TASK_7049";
const listTitle = "ПРИВАТНЕ_SYNTH_LIST_3915";

async function readStoredJournal(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open("dims-tasks-diagnostics", 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const database = open.result;
      const read = database.transaction("journal").objectStore("journal").get("history");
      read.onsuccess = () => { database.close(); resolve(read.result); };
      read.onerror = () => { database.close(); reject(read.error); };
    };
  }));
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.context().addInitScript(() => {
      const deny = () => Promise.reject(new DOMException("Synthetic clipboard denial", "NotAllowedError"));
      Object.defineProperty(navigator, "clipboard", { value: { write: deny, writeText: deny } });
    });
    await page.click("#main-menu-open");
    await page.click("#new-list-open");
    await page.fill("#new-list-title", listTitle);
    await page.locator("#new-list-title").press("Enter");
    await page.waitForFunction(title => lists.some(list => list.title === title), listTitle);
    await page.click("#main-menu-close");
    await page.click("#add-task-btn");
    await page.fill("#task-title", title);
    await page.click("#task-editor-back");
    const row = page.locator("#task-list").getByRole("button", { name: "Відкрити деталі: " + title });
    await row.click();
    const listId = await page.evaluate(title => lists.find(list => list.title === title).id, listTitle);
    await page.click("#task-list-trigger");
    await page.locator('#task-list-options [data-list-id]').filter({ hasText: listTitle }).click();
    const moved = await page.evaluate(async title => (await taskDb.all()).find(task => task.title === title), title);
    assert.equal(moved.listId, listId);
    assert.equal(await row.count(), 0);
    await page.waitForFunction(() => document.querySelector("#task-list-options").hidden);
    await page.waitForFunction(async () => {
      const stored = await new Promise((resolve, reject) => {
        const request = indexedDB.open("dims-tasks-diagnostics", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const read = database.transaction("journal").objectStore("journal").get("history");
          read.onsuccess = () => { database.close(); resolve(read.result); };
        };
      });
      return stored?.state.events.some(row => row.action === "task.move_editor" && row.event === "view.observed" && row.details.present === false);
    });
    await page.reload();
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.locator("#diagnostics-settings summary").click();
    await page.locator("#diagnostics-coverage").filter({ hasText: "Подій:" }).waitFor();
    await page.click("#diagnostics-copy");
    const output = page.locator("#diagnostics-report");
    await output.waitFor({ state: "visible" });
    const report = await output.inputValue();
    assert.match(report, /Build [a-f0-9]{12} \| Database 3/);
    assert.ok(!report.includes(title) && !report.includes(listTitle));
    assert.ok(!report.includes(moved.id) && !report.includes(listId));
    const rows = report.split("\n").filter(line => line.startsWith("{")).map(JSON.parse);
    const prepared = rows.find(row => row.event === "task.prepared" && row.action === "task.create");
    const start = rows.find(row => row.event === "operation.started" && row.action === "task.move_editor");
    const trace = rows.filter(row => row.session === start.session && row.op === start.op);
    const plan = trace.find(row => row.event === "move.planned");
    const commit = trace.find(row => row.event === "write.committed");
    const view = trace.find(row => row.event === "view.observed");
    assert.equal(prepared.details.task, plan.details.task);
    assert.equal(prepared.details.list, plan.details.from);
    assert.equal(plan.details.to, start.details.to);
    assert.deepEqual(commit.details.stores, ["tasks"]);
    assert.equal(view.details.present, false);
    assert.equal(view.details.list, plan.details.from);
    assert.ok(plan.seq < commit.seq && commit.seq < view.seq);
    assert.ok(rows.some(row => row.event === "session.started" && row.details.reload && row.session !== start.session));
    const backup = await page.evaluate(async () => JSON.parse(await (await prepareBackup()).blob.text()));
    assert.ok(backup.data.tasks.some(task => task.title === title && task.listId === listId));
    assert.ok(!JSON.stringify(backup).includes(start.session));
    assert.deepEqual(Object.keys(backup.data).sort(), ["lists", "projects", "sections", "settings", "tasks"]);
    const stored = JSON.stringify(await readStoredJournal(page));
    assert.ok(stored.includes('"move.planned"'));
    assert.ok(![title, listTitle, moved.id, listId].some(value => stored.includes(value)));
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#diagnostics-download")]);
    assert.equal(download.suggestedFilename(), "DimsTasks-diagnostics.txt");
    const fileReport = await readFile(await download.path(), "utf8");
    assert.deepEqual(fileReport.split("\n").slice(6), report.split("\n").slice(6));
    assert.deepEqual(errors, []);
    process.stdout.write(report.split("\n").slice(0, 5).join("\n") + "\n");
    for (const entry of [plan, commit, view]) process.stdout.write(JSON.stringify(entry) + "\n");

    const other = await page.context().newPage();
    await other.goto(page.url());
    await other.waitForFunction(() => typeof diagnostics === "object");
    await page.selectOption("#diagnostics-retention", "0");
    await page.locator("#diagnostics-coverage").filter({ hasText: "Журнал вимкнено" }).waitFor();
    await other.waitForFunction(async () => {
      diagnostics.start("task.synthetic");
      const report = await diagnostics.report();
      return diagnostics.hours() === 0 && report.count === 0;
    });
    assert.equal(await readStoredJournal(page), undefined);
    assert.equal(await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id).listId, moved.id), listId);
    await page.reload();
    assert.equal(await page.evaluate(() => diagnostics.hours()), 0);
    await other.close();
    process.stdout.write("Diagnostic move, reload, clipboard fallback, backup isolation and disable: OK\n");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
