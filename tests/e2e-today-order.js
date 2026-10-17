const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const today = await page.evaluate(() => localDateValue());
    await page.evaluate(async today => {
      const stamp = new Date().toISOString();
      const records = [
        { id: "a", title: "Перше", listId: "system-list-inbox", position: 0, createdAt: "2026-10-15T09:00:00.000Z" },
        { id: "b", title: "Друге", listId: "other", position: 0, createdAt: "2026-10-15T08:00:00.000Z" },
        { id: "c", title: "Третє", listId: "system-list-inbox", position: 1, createdAt: "2026-10-15T07:00:00.000Z" }
      ];
      await listDb.put(createList({ id: "other", title: "Інший", position: 1 }));
      await taskDb.putMany(records.map(item => createTask({ ...item, dueDate: today, updatedAt: stamp })));
    }, today);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-today").click();
    const ids = () => page.locator("#task-list .swipe-row").evaluateAll(rows => rows.map(row => row.dataset.id));
    assert.deepEqual(await ids(), ["a", "b", "c"]);

    await page.evaluate(() => selectTask("c"));
    const source = await page.locator('[data-id="c"] .task-card').boundingBox();
    const target = await page.locator('[data-id="a"] .task-card').boundingBox();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2 - 12);
    await page.mouse.move(target.x + target.width / 2, target.y + 5, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector("#task-list .swipe-row")?.dataset.id === "c");
    assert.deepEqual(await ids(), ["c", "a", "b"]);

    const positions = await page.evaluate(async () => {
      const records = await taskDb.all();
      return Object.fromEntries(records.filter(task => ["a", "b", "c"].includes(task.id)).map(task => [task.id, [task.todayPosition, task.position, task.listId]]));
    });
    assert.deepEqual(positions, {
      a: [1, 0, "system-list-inbox"], b: [2, 0, "other"], c: [0, 1, "system-list-inbox"]
    });

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-today").click();
    assert.deepEqual(await ids(), ["c", "a", "b"]);
    await page.locator("#nav-inbox").click();
    assert.deepEqual(await ids(), ["a", "c"]);
    assert.deepEqual(errors, []);
    console.log("today order passed: drag, cross-list position, reload, original list order");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
