const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const date = localDateValue();
      const records = ["a", "b", "c"].map((id, position) => createTask({
        id: `merge-${id}`, title: `Злиття ${id}`, dueDate: date, position, todayPosition: position
      }));
      await taskDb.putMany(records);
      await refresh();
      const visible = visibleTodayLayoutTasks(date);
      let layout = createTodayGroup(null, visible, date, "#2D9E6B", [records[0].id], "green");
      layout = setTodayGroupTitle(layout, visible, date, "green", "Моя зелена");
      layout = createTodayGroup(layout, visible, date, "#D4A017", [records[1].id], "yellow");
      await settingsDb.saveTodayLayout(layout, date);
      await refresh();
    });
    await page.click("#nav-today");
    await page.locator('.today-group[data-group-id="green"]').waitFor();
    await page.evaluate(() => selectTodayGroup("green"));
    await page.click("#recolor-selected-group");
    await page.locator('#today-group-recolor-options button[data-color="#D4A017"]').click();
    await page.locator('#today-group-merge-options button[data-keep-id="green"]').waitFor();
    await page.click("#today-group-merge-cancel");
    assert.equal(await page.locator(".today-group").count(), 2);
    await page.click("#recolor-selected-group");
    await page.locator('#today-group-recolor-options button[data-color="#D4A017"]').click();
    await page.click('#today-group-merge-options button[data-keep-id="green"]');
    await page.waitForFunction(() => todayLayout.groups.length === 1);
    assert.deepEqual(await page.evaluate(() => todayLayout.groups.map(group => ({ id: group.id, color: group.color, title: group.title, taskIds: group.taskIds }))),
      [{ id: "green", color: "#D4A017", title: "Моя зелена", taskIds: ["merge-a", "merge-b"] }]);
    await page.click("#toast-action");
    await page.waitForFunction(() => todayLayout.groups.length === 2);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator('.today-group[data-group-id="green"]').waitFor();
    await page.evaluate(() => selectTodayGroup("green"));
    await page.click("#recolor-selected-group");
    await page.locator('#today-group-recolor-options button[data-color="#D4A017"]').click();
    await page.click('#today-group-merge-options button[data-keep-id="yellow"]');
    await page.waitForFunction(() => todayLayout.groups.length === 1);
    assert.deepEqual(await page.evaluate(() => todayLayout.groups.map(group => ({ id: group.id, title: group.title, taskIds: group.taskIds }))),
      [{ id: "yellow", title: "Жовта", taskIds: ["merge-b", "merge-a"] }]);
    assert.equal(await page.evaluate(async () => (await taskDb.all()).filter(task => task.id.startsWith("merge-")).length), 3);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator('.today-group[data-group-id="yellow"]').waitFor();
    assert.equal(await page.locator(".today-group").count(), 1);
    await page.evaluate(() => selectTodayGroup("yellow"));
    await page.click("#recolor-selected-group");
    await page.locator('#today-group-recolor-options button[data-color="#3A7BD5"]').click();
    await page.waitForFunction(() => todayLayout.groups[0].color === "#3A7BD5");
    assert.equal(await page.evaluate(() => todayLayout.groups[0].title), "Жовта");
    assert.equal(await page.locator("#toast").evaluate(element => element.style.getPropertyValue("--toast-duration")), "3000ms");
    assert.deepEqual(errors, []);
    console.log("Today group merge scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
