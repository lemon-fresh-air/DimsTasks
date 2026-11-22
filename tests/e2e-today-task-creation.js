const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const [today, tomorrow] = await page.evaluate(() => [localDateValue(), nextLocalDate()]);
    const select = page.locator("#today-task-creation-select");
    const findTask = title => page.evaluate(async title => (await taskDb.all()).find(task => task.title === title), title);
    async function openNewTask(title) {
      await page.click("#add-task-btn");
      await page.fill("#task-title", title);
    }
    async function saveTask(title, dueDate, addedToTodayDate) {
      await page.click("#task-editor-back");
      await page.locator("#task-editor").waitFor({ state: "hidden" });
      const task = await findTask(title);
      assert.equal(task.dueDate, dueDate);
      assert.equal(task.addedToTodayDate, addedToTodayDate);
      assert.equal(task.dueTime, null);
    }
    async function setMode(mode) {
      await page.click("#main-menu-open");
      await page.click("#settings-open");
      await select.selectOption(mode);
      await page.waitForFunction(mode => todayTaskCreationMode === mode, mode);
      await page.click("#settings-close");
      await page.click("#main-menu-close");
      await page.click("#nav-today");
    }
    await page.click("#nav-today");
    await openNewTask("Сонечко");
    assert.equal(await page.locator("#date-label").textContent(), "Без дати");
    await saveTask("Сонечко", null, today);
    await page.locator("#task-list .task-text", { hasText: "Сонечко" }).waitFor();

    await openNewTask("Явно обрана дата");
    await page.click("#date-picker-open");
    await page.click('[data-date-shortcut="tomorrow"]');
    await page.click("#date-picker-save");
    await saveTask("Явно обрана дата", tomorrow, today);

    await setMode("date");
    await openNewTask("Лише дата");
    await saveTask("Лише дата", today, null);

    await setMode("both");
    await page.reload();
    await page.waitForFunction(() => todayTaskCreationMode === "both");
    await page.click("#nav-today");
    await openNewTask("Дата й сонечко");
    await saveTask("Дата й сонечко", today, today);

    await page.evaluate(() => openList(TOMORROW_LIST_ID));
    await openNewTask("Завдання на завтра");
    await saveTask("Завдання на завтра", tomorrow, null);

    await page.click("#nav-today");
    await page.click("#nav-upcoming");
    await openNewTask("Завдання з календаря");
    await saveTask("Завдання з календаря", today, null);
    assert.deepEqual(errors, []);
    console.log("Today task creation modes passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
