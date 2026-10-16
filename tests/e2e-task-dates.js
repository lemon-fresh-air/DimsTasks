const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

function localDate(offset = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  const stamp = new Date().toISOString();
  const record = (id, extra = {}) => ({ id, entityVersion: 1, customFields: {}, createdAt: stamp, updatedAt: stamp, ...extra });
  const task = (id, extra = {}) => record(id, { listId: "system-list-inbox", sectionId: null, projectId: null, title: id, description: "", status: "active", completedAt: null, dueDate: null, dueTime: null, position: 0, projectPosition: null, returnedToInboxAt: null, ...extra });

  await page.evaluate(async ({ stamp, yesterday, today, tomorrow }) => {
    const request = indexedDB.open("dims-tasks-db");
    const db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(["projects", "tasks"], "readwrite");
    tx.objectStore("projects").put({ id: "project-dates", entityVersion: 1, customFields: {}, createdAt: stamp, updatedAt: stamp, title: "Проєкт дат", goal: "", description: "", status: "active", dueDate: null, dueTime: null, showCountdown: false, completedAt: null, position: 0 });
    const base = { entityVersion: 1, customFields: {}, updatedAt: stamp, listId: "system-list-inbox", sectionId: null, description: "", status: "active", completedAt: null, dueTime: null, projectPosition: null, returnedToInboxAt: null };
    tx.objectStore("tasks").put({ ...base, id: "without-date", title: "Без дати", createdAt: `${yesterday}T09:00:00.000Z`, dueDate: null, position: 0, projectId: "project-dates", projectPosition: 0 });
    tx.objectStore("tasks").put({ ...base, id: "overdue", title: "Прострочене", createdAt: stamp, dueDate: yesterday, position: 1, projectId: null });
    tx.objectStore("tasks").put({ ...base, id: "today", title: "Сьогодні", createdAt: stamp, dueDate: today, position: 2, projectId: null });
    tx.objectStore("tasks").put({ ...base, id: "tomorrow", title: "Завтра", createdAt: stamp, dueDate: tomorrow, position: 3, projectId: null });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, { stamp, yesterday: localDate(-1), today: localDate(), tomorrow: localDate(1) });
  await page.reload({ waitUntil: "networkidle" });

  const dateFor = id => page.locator(`[data-id="${id}"] .task-date`);
  assert.equal(await dateFor("without-date").isHidden(), true, "createdAt must not appear as a task deadline");
  assert.equal(await dateFor("overdue").getAttribute("data-date-tone"), "overdue");
  assert.equal(await dateFor("today").getAttribute("data-date-tone"), "today");
  assert.equal(await dateFor("tomorrow").getAttribute("data-date-tone"), "tomorrow");

  await page.locator('[data-id="overdue"] .task-open').click();
  await page.locator("#date-picker-open").click();
  await page.locator('[data-date-shortcut="none"]').click();
  await page.locator("#date-picker-save").click();
  await page.locator("#task-editor-back").click();
  await page.locator("#task-editor").waitFor({ state: "hidden" });
  assert.equal(await dateFor("overdue").isHidden(), true, "clearing a deadline must remove it from the card");

  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await dateFor("overdue").isHidden(), true, "cleared deadline must stay absent after reload");
  const storedDueDate = await page.evaluate(async () => {
    const request = indexedDB.open("dims-tasks-db");
    const db = await new Promise(resolve => { request.onsuccess = () => resolve(request.result); });
    const get = db.transaction("tasks", "readonly").objectStore("tasks").get("overdue");
    const value = await new Promise(resolve => { get.onsuccess = () => resolve(get.result); });
    db.close();
    return value.dueDate;
  });
  assert.equal(storedDueDate, null);

  await page.locator("#nav-projects").click();
  await page.locator('[data-project-id="project-dates"]').click();
  assert.equal(await page.locator('#project-task-list [data-id="without-date"] .task-date').isHidden(), true, "project task cards must also hide an absent deadline");

  assert.deepEqual(errors, []);
  await browser.close();
  console.log("E2E task date rendering passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
