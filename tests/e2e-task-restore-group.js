const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    for (const [screen, offset] of [["today", 0], ["tomorrow", 1]]) {
      await page.evaluate(async ({ offset }) => {
        const date = offset ? nextLocalDate() : localDateValue();
        const records = ["a", "b"].map((suffix, position) => createTask({
          id: `restore-${offset}-${suffix}`, title: `Повернення ${offset} ${suffix}`, dueDate: date, position
        }));
        await taskDb.putMany(records);
        await refresh();
        const visible = visibleProjectTasks(tasks, projects).filter(task => isTaskDueToday(task, date));
        const layout = createTodayGroup(null, visible, date, "#3A7BD5", records.map(task => task.id), `restore-group-${offset}`);
        await settingsDb.saveTodayLayout(layout, date);
      }, { offset });
      await page.evaluate(screen => openList(screen === "today" ? TODAY_LIST_ID : TOMORROW_LIST_ID), screen);
      await page.locator(`[data-group-id="restore-group-${offset}"]`).waitFor();
      await page.evaluate(id => deleteTask(id), `restore-${offset}-a`);
      await page.click("#toast-action");
      await page.locator("#task-restore-group-backdrop").waitFor({ state: "visible" });
      await page.click("#task-restore-to-group");
      await page.waitForFunction(id => todayLayout?.groups.some(group => group.taskIds.includes(id)), `restore-${offset}-a`);
      await page.reload({ waitUntil: "networkidle" });
      await page.evaluate(screen => openList(screen === "today" ? TODAY_LIST_ID : TOMORROW_LIST_ID), screen);
      assert.equal(await page.locator(`[data-group-id="restore-group-${offset}"] [data-id="restore-${offset}-a"]`).count(), 1);
      await page.evaluate(id => { selectedTaskIds = new Set([id]); return deleteSelectedTasks(); }, `restore-${offset}-a`);
      await page.click("#toast-action");
      await page.locator("#task-restore-group-backdrop").waitFor({ state: "visible" });
      await page.click("#task-restore-without-group");
      await page.waitForFunction(id => tasks.some(task => task.id === id), `restore-${offset}-a`);
      assert.equal(await page.locator(`[data-group-id="restore-group-${offset}"] [data-id="restore-${offset}-a"]`).count(), 0);
      assert.equal(await page.locator(`[data-group-id="restore-group-${offset}"] [data-id="restore-${offset}-b"]`).count(), 1);
      await page.reload({ waitUntil: "networkidle" });
      await page.evaluate(screen => openList(screen === "today" ? TODAY_LIST_ID : TOMORROW_LIST_ID), screen);
      assert.equal(await page.locator(`[data-group-id="restore-group-${offset}"] [data-id="restore-${offset}-a"]`).count(), 0);
      assert.equal(await page.locator(`[data-id="restore-${offset}-a"]`).count(), 1);
    }
    assert.deepEqual(errors, []);
    console.log("Task restore group scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
