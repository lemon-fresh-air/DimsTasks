const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const task = createTask({ title: "Термін сьогодні", dueDate: localDateValue() });
      await taskDb.put(task);
      await refresh();
    });
    await page.click("#nav-today");
    await page.getByText("Термін сьогодні", { exact: true }).waitFor();
    await page.evaluate(async () => {
      const task = tasks.find(item => item.title === "Термін сьогодні");
      await changeTodayLayout((layout, visible, date) =>
        createTodayGroup(layout, visible, date, "#3A7BD5", [task.id], "test-group"));
      renderCurrentTasks();
    });
    await page.locator(".today-group-add").click();
    await page.fill("#quick-task-title", "Без терміну");
    await page.click("#quick-task-form button[type=submit]");
    await page.locator("#quick-task-backdrop").waitFor({ state: "hidden" });
    await page.getByText("Без терміну", { exact: true }).waitFor();
    const first = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Без терміну"));
    assert.equal(first.dueDate, null);
    assert.equal(first.addedToTodayDate, await page.evaluate(() => localDateValue()));
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.getByText("Без терміну", { exact: true }).waitFor();
    await page.getByText("Термін сьогодні", { exact: true }).waitFor();
    assert.equal(await page.locator(".today-group [data-id]").count(), 2);
    await page.evaluate(() => openSettings());
    await page.locator("#today-task-creation-select").selectOption("date");
    await page.locator("#today-task-creation-select").waitFor();
    await page.waitForFunction(() => todayTaskCreationMode === "date");
    await page.click("#settings-close");
    await page.locator(".today-group-add").click();
    await page.fill("#quick-task-title", "З терміном");
    await page.click("#quick-task-form button[type=submit]");
    await page.locator("#quick-task-backdrop").waitFor({ state: "hidden" });
    const second = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "З терміном"));
    assert.equal(second.dueDate, await page.evaluate(() => localDateValue()));
    assert.equal(second.addedToTodayDate, null);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => openSettings());
    assert.equal(await page.locator("#today-task-creation-select").inputValue(), "date");
    assert.deepEqual(errors, []);
    console.log("group today defaults e2e passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
