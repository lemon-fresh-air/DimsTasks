const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const python = "C:/Users/38066/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const server = spawn(python, ["-m", "http.server", "8000", "--bind", "127.0.0.1", "--directory", "dist"], {
  stdio: "ignore",
  env: { ...process.env, NO_PROXY: "127.0.0.1,localhost,::1", no_proxy: "127.0.0.1,localhost,::1" }
});

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function dbOperation(page, operation, payload) {
  return page.evaluate(async ({ operation, payload }) => {
    const request = indexedDB.open("dims-tasks-db", 3);
    const db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const names = operation === "seed" ? ["lists", "tasks", "settings"] : [payload];
    const tx = db.transaction(names, operation === "read" ? "readonly" : "readwrite");
    if (operation === "seed") {
      for (const name of names) tx.objectStore(name).clear();
      for (const list of payload.lists) tx.objectStore("lists").put(list);
      for (const task of payload.tasks) tx.objectStore("tasks").put(task);
      for (const setting of payload.settings) tx.objectStore("settings").put(setting);
    }
    const result = operation === "read"
      ? await new Promise((resolve, reject) => {
        const get = tx.objectStore(payload).getAll();
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      })
      : null;
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return result;
  }, { operation, payload });
}

(async () => {
  await pause(500);
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-proxy-server", "--proxy-bypass-list=<-loopback>", "--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("requestfailed", request => failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto(process.env.DIMS_TEST_URL || "http://127.0.0.1:8000", { waitUntil: "networkidle" });

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const yesterdayDate = new Date(now); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;
  const stamp = "2026-10-01T00:00:00.000Z";
  const record = (id, extra = {}) => ({ id, entityVersion: 1, customFields: {}, createdAt: stamp, updatedAt: stamp, ...extra });
  const task = (id, extra = {}) => record(id, { listId: "work", sectionId: null, projectId: null, title: id, description: "", status: "active", completedAt: null, dueDate: yesterday, dueTime: null, position: 0, projectPosition: null, ...extra });
  const lists = [record("system-list-inbox", { title: "Інбокс", description: "", kind: "inbox", position: 0 }), record("work", { title: "Робота", description: "", kind: "regular", position: 1 })];
  const oldTasks = Array.from({ length: 5 }, (_, index) => task(`old-${index + 1}`, { listId: "system-list-inbox", dueDate: null, position: index }));
  const overdue = [task("late-b", { createdAt: "2026-10-02T00:00:00.000Z" }), task("late-a", { dueDate: "2026-01-01", createdAt: "2026-10-03T00:00:00.000Z" })];
  const timed = task("timed", { dueDate: today, dueTime: currentTime });
  const completed = task("completed", { status: "completed", completedAt: stamp });
  await dbOperation(page, "seed", { lists, tasks: [...oldTasks, ...overdue, timed, completed], settings: [] });
  await page.reload({ waitUntil: "networkidle" });

  let stored = await dbOperation(page, "read", "tasks");
  assert.equal(stored.find(item => item.id === "late-a").listId, "work", "default-off must preserve the original list");
  assert.equal(stored.find(item => item.id === "late-a").dueDate, "2026-01-01", "default-off must preserve the deadline");
  await page.click("#nav-today");
  assert.equal(await page.locator('[data-id="timed"]').count(), 0, "elapsed timed task must disappear from Today");

  stored = stored.filter(item => item.id !== "timed");
  await dbOperation(page, "seed", { lists, tasks: stored, settings: [] });
  await page.reload({ waitUntil: "networkidle" });
  await page.click("#main-menu-open");
  await page.click("#settings-open");
  await page.locator("#return-overdue-toggle").check();
  await page.waitForFunction(async () => {
    const request = indexedDB.open("dims-tasks-db", 3);
    const db = await new Promise(resolve => { request.onsuccess = () => resolve(request.result); });
    const get = db.transaction("tasks", "readonly").objectStore("tasks").get("late-a");
    const value = await new Promise(resolve => { get.onsuccess = () => resolve(get.result); });
    db.close();
    return value?.listId === "system-list-inbox";
  });
  stored = (await dbOperation(page, "read", "tasks")).filter(item => item.listId === "system-list-inbox" && item.status === "active").sort((a, b) => a.position - b.position);
  assert.deepEqual(stored.map(item => item.id), ["late-a", "late-b", "old-1", "old-2", "old-3", "old-4", "old-5"]);
  assert.equal((await dbOperation(page, "read", "tasks")).find(item => item.id === "completed").listId, "work", "completed task must not move");

  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#return-overdue-toggle").isChecked(), true, "setting must persist");
  const repeat = (await dbOperation(page, "read", "tasks")).filter(item => item.listId === "system-list-inbox" && item.status === "active").sort((a, b) => a.position - b.position);
  assert.deepEqual(repeat.map(item => `${item.id}:${item.position}`), stored.map(item => `${item.id}:${item.position}`), "reload must not raise tasks again");

  await page.click("#main-menu-open"); await page.click("#settings-open");
  await page.locator("#return-overdue-toggle").uncheck();
  await page.locator("#return-overdue-toggle").check();
  const toggled = (await dbOperation(page, "read", "tasks")).filter(item => item.listId === "system-list-inbox" && item.status === "active").sort((a, b) => a.position - b.position);
  assert.deepEqual(toggled.map(item => `${item.id}:${item.position}`), repeat.map(item => `${item.id}:${item.position}`), "toggle cycle must not raise tasks again");

  await page.reload({ waitUntil: "networkidle" });
  await page.click("#add-task-btn");
  await page.fill("#task-title", "new-eighth");
  await page.click("#task-editor-back");
  await page.waitForSelector("#task-editor", { state: "hidden" });
  const afterCreate = (await dbOperation(page, "read", "tasks")).filter(item => item.listId === "system-list-inbox" && item.status === "active").sort((a, b) => a.position - b.position);
  assert.deepEqual(afterCreate.map(item => item.title), ["new-eighth", "late-a", "late-b", "old-1", "old-2", "old-3", "old-4", "old-5"]);

  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(failedRequests, []);
  await browser.close();
  console.log("E2E overdue workflow passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  server.kill();
  setTimeout(() => process.exit(process.exitCode || 0), 250);
});
