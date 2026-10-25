const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const date = localDateValue();
      const seeded = ["a", "b", "c", "d"].map((letter, index) => createTask({
        id: `outer-${letter}`, title: `Зовнішня ${letter}`, dueDate: date,
        todayPosition: index, position: index, createdAt: new Date(Date.now() + index).toISOString()
      }));
      await taskDb.putMany(seeded);
      await refresh();
      await changeTodayLayout((layout, visible, today) => createTodayGroup(layout, visible, today, "#3A7BD5", new Set(["outer-a", "outer-b"]), "blue"));
      await changeTodayLayout((layout, visible, today) => createTodayGroup(layout, visible, today, "#E05A3A", new Set(["outer-d"]), "orange"));
      await changeTodayLayout((layout, visible, today) => setTodayGroupCollapsed(layout, visible, today, "blue", true));
      await changeTodayLayout((layout, visible, today) => setTodayGroupCollapsed(layout, visible, today, "orange", true));
      renderCurrentTasks();
    });
    await page.click("#nav-today");
    const blue = page.locator('.today-group[data-group-id="blue"] .today-group-toggle');
    await blue.waitFor();
    const source = await blue.boundingBox();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => selectedTodayGroupId === "blue");
    assert.equal(await page.locator("#delete-selected-group").isDisabled(), true);
    assert.equal(await page.locator("#recolor-selected-group").isDisabled(), true);
    const orange = await page.locator('.today-group[data-group-id="orange"]').boundingBox();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height + 10, { steps: 2 });
    await page.mouse.move(source.x + source.width / 2, orange.y + orange.height - 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).items.at(-1)?.id === "blue");
    let layout = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.deepEqual(layout.items.map(item => item.id), ["outer-c", "orange", "blue"]);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await blue.waitFor();
    assert.deepEqual((await page.evaluate(() => appDb.get("settings", "today-layout"))).items.map(item => item.id), ["outer-c", "orange", "blue"]);

    await page.evaluate(() => selectTask("outer-c"));
    const taskSource = await page.locator('.swipe-row[data-id="outer-c"] .task-card').boundingBox();
    const blueTarget = await page.locator('.today-group[data-group-id="blue"]').boundingBox();
    await page.mouse.move(taskSource.x + taskSource.width / 2, taskSource.y + taskSource.height / 2);
    await page.mouse.down();
    await page.mouse.move(taskSource.x + taskSource.width / 2, taskSource.y + taskSource.height + 12, { steps: 2 });
    await page.mouse.move(taskSource.x + taskSource.width / 2, blueTarget.y + 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).items[0]?.id === "orange");
    assert.deepEqual((await page.evaluate(() => appDb.get("settings", "today-layout"))).items.map(item => item.id), ["orange", "outer-c", "blue"]);

    await page.evaluate(() => selectTodayGroup("blue"));
    await page.click("#rename-selected-group");
    await page.fill("#today-group-rename-input", "Спробна назва");
    await page.click("#today-group-rename-cancel");
    assert.equal((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups.find(group => group.id === "blue").title, null);
    await page.click("#rename-selected-group");
    await page.fill("#today-group-rename-input", "Мої справи");
    await page.locator("#today-group-rename-form button[type=submit]").click();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups.find(group => group.id === "blue")?.title === "Мої справи");
    assert.match(await page.locator('.today-group[data-group-id="blue"] .today-group-heading').innerText(), /Мої справи/);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    assert.match(await page.locator('.today-group[data-group-id="blue"] .today-group-heading').innerText(), /Мої справи/);
    await page.evaluate(() => selectTodayGroup("blue"));
    await page.click("#complete-selected-group");
    await page.waitForFunction(async () => (await appDb.get("tasks", "outer-a")).status === "completed" && (await appDb.get("tasks", "outer-b")).status === "completed");
    assert.equal(await page.locator("#toast-action").isVisible(), true);
    await page.click("#toast-action");
    await page.waitForFunction(async () => (await appDb.get("tasks", "outer-a")).status === "active" && (await appDb.get("tasks", "outer-b")).status === "active");
    layout = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.deepEqual(layout.items.map(item => item.id), ["orange", "outer-c", "blue"]);
    assert.deepEqual(layout.groups.find(group => group.id === "blue").taskIds, ["outer-a", "outer-b"]);
    assert.deepEqual(errors, []);
    console.log("Today collapsed group reorder and undo scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
