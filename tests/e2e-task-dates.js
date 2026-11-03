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

  await page.locator('#project-task-list [data-id="without-date"] .task-open').click();
  await page.locator("#date-picker-open").click();
  await page.locator(`#calendar-grid button[data-date="${localDate()}"]`).click();
  assert.equal(await page.locator("#time-dialog-backdrop").isHidden(), true, "short tap must only select a date");
  const longPressedDay = page.locator(`#calendar-grid button[data-date="${localDate(1)}"]`);
  await longPressedDay.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true, clientX: 100, clientY: 100 });
  await page.locator("#time-dialog-backdrop").waitFor({ state: "visible" });
  await longPressedDay.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true, clientX: 100, clientY: 100 });
  assert.equal(await page.evaluate(() => pendingDateValue), localDate(1), "long press must select its day");
  assert.equal(await page.locator("#time-display-hour").evaluate(node => document.activeElement === node), true, "hour input must be ready for typing");
  await page.locator("#time-display-hour").fill("14");
  await page.locator("#time-display-minute").fill("20");
  await page.locator("#time-display-minute").press("Enter");
  await page.locator("#time-dialog-backdrop").waitFor({ state: "hidden" });
  assert.equal(await page.locator("#date-picker-backdrop").isHidden(), true, "saving time must also close the date picker");
  assert.equal(await page.locator("#task-date").inputValue(), localDate(1));
  assert.equal(await page.locator("#task-time").inputValue(), "14:20");
  await page.locator("#task-editor-back").click();
  assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.id === "without-date")?.dueDate), localDate(1));
  assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.id === "without-date")?.dueTime), "14:20");

  await page.locator('#project-task-list [data-id="without-date"] .task-open').click();
  await page.locator("#date-picker-open").click();
  await page.locator("#time-picker-open").click();
  assert.equal(await page.locator("#time-display-hour").evaluate(node => document.activeElement === node), true, "time button must also focus the hour");
  await page.locator("#time-dialog-cancel").click();
  assert.equal(await page.locator("#date-picker-backdrop").isVisible(), true, "cancel must return to date selection");
  await page.locator("#date-picker-close").click();

  assert.deepEqual(errors, []);
  await browser.close();
  console.log("E2E task date rendering passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
