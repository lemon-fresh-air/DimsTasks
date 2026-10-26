const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const dates = await page.evaluate(async () => {
      const today = localDateValue();
      const tomorrow = nextLocalDate();
      await taskDb.putMany([
        createTask({ id: "day-today", title: "Лише сьогодні", dueDate: today }),
        createTask({ id: "day-a", title: "Завтра А", dueDate: tomorrow }),
        createTask({ id: "day-b", title: "Завтра Б", dueDate: tomorrow })
      ]);
      await refresh();
      return { today, tomorrow };
    });
    await page.click("#nav-today");
    await page.getByText("Лише сьогодні", { exact: true }).waitFor();
    await page.click("#day-switch");
    await page.getByText("Завтра А", { exact: true }).waitFor();
    assert.equal(await page.getByText("Лише сьогодні", { exact: true }).count(), 0);

    await page.click("#add-task-btn");
    await page.locator("#task-editor").waitFor({ state: "visible" });
    await page.click("#task-editor-back");
    assert.equal(await page.evaluate(() => tasks.length), 3);
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Збережено на завтра");
    await page.click("#task-editor-back");
    await page.getByText("Збережено на завтра", { exact: true }).waitFor();
    assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Збережено на завтра").dueDate), dates.tomorrow);

    await page.evaluate(async () => {
      selectedTaskIds = new Set(["day-a"]);
      await reorderSelectedTasks({ beforeId: "day-b" });
      clearTaskSelection();
    });
    const tomorrowPlan = await page.evaluate(() => appDb.get("settings", dayPlanId(activePlanDate())));
    assert.equal(tomorrowPlan.date, dates.tomorrow);
    assert.equal(tomorrowPlan.groups.length, 0);
    await page.waitForFunction(() => history.state?.view?.listId === TOMORROW_LIST_ID);
    await page.click("#day-switch");
    await page.waitForFunction(() => activeListId === TODAY_LIST_ID);
    assert.equal(await page.evaluate(() => appDb.get("settings", dayPlanId(activePlanDate()))), undefined);
    await page.click("#day-switch");
    await page.evaluate(() => selectTask("day-a"));
    await page.click("#group-selected");
    await page.click('[data-color="#3A7BD5"]');
    await page.locator(".today-group").waitFor();
    const grouped = await page.evaluate(() => appDb.get("settings", dayPlanId(activePlanDate())));
    assert.equal(grouped.groups[0].taskIds[0], "day-a");
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.click("#day-switch");
    await page.locator(".today-group").waitFor();

    await page.clock.setFixedTime(new Date(`${dates.tomorrow}T12:00:00`));
    await page.evaluate(() => checkForDateChange());
    await page.locator("#day-change-backdrop").waitFor({ state: "visible" });
    assert.match(await page.locator("#day-change-title").innerText(), /Настала нова доба/);
    const rejected = await page.evaluate(async () => {
      try { await changeTodayLayout(() => ({ date: activePlanDate(), groups: [], items: [] })); return false; }
      catch (_error) { return true; }
    });
    assert.equal(rejected, true);
    await page.click("#day-change-confirm");
    await page.locator("#day-change-backdrop").waitFor({ state: "hidden" });
    await page.click("#nav-today");
    await page.locator(".today-group").waitFor();
    assert.equal(await page.evaluate(() => activePlanDate()), dates.tomorrow);
    assert.equal(await page.getByText("Лише сьогодні", { exact: true }).count(), 0);
    const rolled = await page.evaluate(() => appDb.get("settings", dayPlanId(activePlanDate())));
    assert.deepEqual(rolled.items, grouped.items);
    assert.deepEqual(rolled.groups, grouped.groups);
    await page.click("#day-switch");
    assert.equal(await page.locator(".today-group").count(), 0);
    assert.deepEqual(errors, []);
    console.log("day plans e2e passed: tomorrow, save, cancel, order, groups, reload, rollover");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
