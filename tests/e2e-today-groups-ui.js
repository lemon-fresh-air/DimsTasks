const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const date = localDateValue();
      await taskDb.putMany(["a", "b", "c", "d"].map((letter, index) => createTask({
        id: `group-ui-${letter}`, title: `Група тест ${letter}`, dueDate: date,
        todayPosition: index, position: index, createdAt: new Date(Date.now() + index).toISOString()
      })));
      await refresh();
    });
    await page.click("#nav-today");
    await page.locator('.swipe-row[data-id="group-ui-a"]').waitFor();
    await page.evaluate(() => selectTask("group-ui-a"));
    await page.click("#group-selected");
    await page.locator("#today-group-dialog").waitFor();
    const initial = await page.evaluate(() => appDb.get("settings", "today-layout"));
    await page.click("#today-group-cancel");
    assert.deepEqual(await page.evaluate(() => appDb.get("settings", "today-layout")), initial);

    await page.click("#group-selected");
    await page.click('[data-color="#3A7BD5"]');
    await page.locator(".today-group").waitFor();
    assert.match(await page.locator(".today-group-heading").first().innerText(), /Синя · 1/);
    assert.deepEqual(await page.locator("#task-list > li").evaluateAll(items => items.map(item => item.className.includes("today-group") ? "group" : item.dataset.id)), ["group", "group-ui-b", "group-ui-c", "group-ui-d"]);
    assert.equal(await page.locator("#today-order-hint").isVisible(), false);
    const groupToggle = page.locator(".today-group-toggle").first();
    await groupToggle.click();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups[0].collapsed === true);
    assert.equal(await groupToggle.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('.today-group-tasks .swipe-row[data-id="group-ui-a"]').isVisible(), false);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator(".today-group-toggle").first().waitFor();
    assert.equal(await page.locator(".today-group-toggle").first().getAttribute("aria-expanded"), "false");
    await page.locator(".today-group-toggle").first().click();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups[0].collapsed === false);
    assert.equal(await page.locator('.today-group-tasks .swipe-row[data-id="group-ui-a"]').isVisible(), true);

    await page.evaluate(() => selectTask("group-ui-b"));
    await page.locator('.swipe-row[data-id="group-ui-c"]').click();
    assert.deepEqual(await page.evaluate(() => [...selectedTaskIds].sort()), ["group-ui-b", "group-ui-c"]);
    await page.click("#group-selected");
    await page.click('[data-color="#3A7BD5"]');
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups[0].taskIds.length === 3);
    let layout = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.deepEqual(layout.groups[0].taskIds, ["group-ui-a", "group-ui-b", "group-ui-c"]);
    assert.equal(await page.locator(".today-group-heading").first().innerText(), "Синя · 3");

    await page.evaluate(() => selectTask("group-ui-b"));
    await page.locator('.today-group-tasks .swipe-row[data-id="group-ui-c"]').click();
    const source = await page.locator('.today-group-tasks .swipe-row[data-id="group-ui-b"] .task-card').boundingBox();
    const destination = await page.locator('.today-group-tasks .swipe-row[data-id="group-ui-a"]').boundingBox();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(source.x + source.width / 2, source.y - 12, { steps: 2 });
    await page.mouse.move(source.x + source.width / 2, destination.y + 4, { steps: 3 });
    assert.equal(await page.locator(".drag-count").innerText(), "2");
    await page.mouse.up();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups[0].taskIds[0] === "group-ui-b");
    assert.deepEqual((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].taskIds, ["group-ui-b", "group-ui-c", "group-ui-a"]);

    await page.evaluate(() => selectTask("group-ui-b"));
    assert.equal(await page.locator("#today-order-hint").isVisible(), true);
    await page.click("#group-selected");
    await page.click('[data-color="#3A7BD5"]');
    assert.deepEqual((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].taskIds, ["group-ui-b", "group-ui-c", "group-ui-a"]);

    await page.evaluate(() => selectTask("group-ui-b"));
    await page.click("#group-selected");
    await page.click('[data-color="#E05E87"]');
    await page.locator(".today-group").nth(1).waitFor();
    layout = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.deepEqual(layout.groups.map(group => group.taskIds), [["group-ui-c", "group-ui-a"], ["group-ui-b"]]);
    assert.equal(await page.locator(".today-group").count(), 2);

    await page.evaluate(() => selectTask("group-ui-b"));
    await page.click("#group-selected");
    await page.click('[data-color="none"]');
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups.length === 1);
    layout = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.equal(layout.groups.length, 1);
    assert.equal(await page.locator(".today-group").count(), 1);

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.locator(".today-group").first().waitFor();
    assert.equal(await page.locator(".today-group").count(), 1);
    await page.evaluate(async () => {
      const saved = await settingsDb.todayLayout();
      await settingsDb.saveTodayLayout({ date: saved.date,
        groups: [...saved.groups, { id: "old-empty-pink", color: "#E05E87", collapsed: false, taskIds: [] }],
        items: [{ type: "group", id: "old-empty-pink" }, ...saved.items] }, saved.date);
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-today");
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups.length === 1);
    assert.equal(await page.locator(".today-group").count(), 1);
    await page.locator('.swipe-row[data-id="group-ui-a"] .task-open').click();
    await page.locator("#task-editor").waitFor({ state: "visible" });
    await page.click("#task-editor-back");
    await page.locator('.swipe-row[data-id="group-ui-c"] .toggle').click();
    await page.waitForFunction(async () => (await appDb.get("settings", "today-layout")).groups[0].taskIds.length === 1);
    await page.click("#nav-inbox");
    await page.locator('.swipe-row[data-id="group-ui-a"]').waitFor();
    assert.equal(await page.locator(".today-group").count(), 0);
    assert.equal(await page.locator("#group-selected").isVisible(), false);
    await page.evaluate(() => selectTask("group-ui-a"));
    const inboxSource = await page.locator('#task-list > .swipe-row[data-id="group-ui-a"] .task-card').boundingBox();
    const inboxLast = await page.locator('#task-list > .swipe-row[data-id="group-ui-d"]').boundingBox();
    await page.mouse.move(inboxSource.x + inboxSource.width / 2, inboxSource.y + inboxSource.height / 2);
    await page.mouse.down();
    await page.mouse.move(inboxSource.x + inboxSource.width / 2, inboxSource.y + inboxSource.height + 12, { steps: 2 });
    await page.mouse.move(inboxSource.x + inboxSource.width / 2, inboxLast.y + inboxLast.height - 2, { steps: 3 });
    await page.mouse.up();
    await page.waitForFunction(() => [...document.querySelectorAll("#task-list > .swipe-row")].at(-1)?.dataset.id === "group-ui-a");
    assert.deepEqual(errors, []);
    console.log("Today group UI scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
