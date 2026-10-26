const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const date = localDateValue();
      const records = ["a", "b", "c"].map((id, position) => createTask({
        id: `delete-group-${id}`, title: `Група ${id}`, dueDate: date, position, todayPosition: position
      }));
      await taskDb.putMany(records);
      await refresh();
      const visible = visibleTodayLayoutTasks(date);
      let layout = createTodayGroup(null, visible, date, "#3A7BD5", [records[0].id], "blue");
      layout = createTodayGroup(layout, visible, date, "#E05A3A", [records[1].id], "orange");
      await settingsDb.saveTodayLayout(layout, date);
      await refresh();
    });
    await page.click("#nav-today");
    await page.locator('.today-group[data-group-id="blue"]').waitFor();
    await page.evaluate(async () => selectTodayGroup("blue"));
    await page.click("#delete-selected-group");
    assert.equal(await page.locator("#today-group-delete-keep-tasks").isChecked(), true);
    await page.click("#today-group-delete-no");
    assert.equal(await page.locator('.today-group[data-group-id="blue"]').count(), 1);
    await page.click("#delete-selected-group");
    await page.click("#today-group-delete-yes");
    await page.waitForFunction(() => !todayLayout.groups.some(group => group.id === "blue"));
    assert.equal(await page.evaluate(async () => Boolean(await taskDb.all().then(rows => rows.find(task => task.id === "delete-group-a")))), true);
    assert.equal(await page.locator('.swipe-row[data-id="delete-group-a"]').count(), 1);
    await page.click("#toast-action");
    await page.waitForFunction(() => todayLayout.groups.some(group => group.id === "blue"));
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator('.today-group[data-group-id="blue"]').waitFor();
    await page.evaluate(async () => selectTodayGroup("blue"));
    await page.click("#delete-selected-group");
    await page.locator("#today-group-delete-keep-tasks").uncheck();
    await page.click("#today-group-delete-yes");
    await page.waitForFunction(() => !todayLayout.groups.some(group => group.id === "blue"));
    assert.equal(await page.evaluate(async () => (await taskDb.all()).some(task => task.id === "delete-group-a")), false);
    assert.equal(await page.locator('.today-group[data-group-id="orange"]').count(), 1);
    await page.click("#toast-action");
    await page.waitForFunction(() => todayLayout.groups.some(group => group.id === "blue"));
    assert.equal(await page.evaluate(async () => (await taskDb.all()).some(task => task.id === "delete-group-a")), true);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator('.today-group[data-group-id="blue"]').waitFor();
    assert.deepEqual(errors, []);
    console.log("Today group deletion scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
