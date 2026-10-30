const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const list = createList({ id: "work", title: "Робота", kind: "regular", position: 0 });
      await listDb.put(list);
      await sectionDb.putMany([
        createSection({ id: "one", listId: "work", title: "Одна", position: 0 }),
        createSection({ id: "two", listId: "work", title: "Друга", position: 1 })
      ]);
      await taskDb.putMany([
        createTask({ id: "root", listId: "work", title: "Без секції", position: 0 }),
        createTask({ id: "a", listId: "work", sectionId: "one", title: "А", position: 0 }),
        createTask({ id: "b", listId: "work", sectionId: "one", title: "Б", position: 1 }),
        createTask({ id: "c", listId: "work", sectionId: "two", title: "В", position: 0 })
      ]);
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => openList("work"));
    const drag = async (sourceId, targetSelector, selectedIds = [sourceId]) => {
      await page.evaluate(ids => { selectedTaskIds = new Set(ids); renderCurrentTasks(); }, selectedIds);
      const source = await page.locator(`[data-id="${sourceId}"] .task-card`).boundingBox();
      const target = await page.locator(targetSelector).boundingBox();
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
      await page.mouse.down();
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2 - 12, { steps: 2 });
      await page.mouse.move(target.x + target.width / 2, target.y + 5, { steps: 8 });
      await page.mouse.up();
    };
    const scope = async id => page.evaluate(async id => (await taskDb.all()).find(task => task.id === id)?.sectionId, id);
    await drag("b", '.list-section[data-section-id="one"] [data-id="a"]');
    await page.waitForFunction(async () => (await taskDb.all()).find(task => task.id === "b")?.position === 0);
    await drag("b", '.list-section[data-section-id="two"] [data-id="c"]');
    await page.waitForFunction(async () => (await taskDb.all()).find(task => task.id === "b")?.sectionId === "two");
    assert.equal(await scope("b"), "two");
    await drag("root", '.list-section[data-section-id="one"] .list-section-heading');
    await page.waitForFunction(async () => (await taskDb.all()).find(task => task.id === "root")?.sectionId === "one");
    await drag("b", '.list-section[data-section-id="one"] [data-id="a"]');
    await page.waitForFunction(async () => (await taskDb.all()).find(task => task.id === "b")?.sectionId === "one");
    await drag("b", "#task-list");
    await page.waitForFunction(async () => (await taskDb.all()).find(task => task.id === "b")?.sectionId === null);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => openList("work"));
    assert.equal(await page.locator('#task-list > [data-id="b"]').count(), 1);
    await drag("b", '.list-section[data-section-id="two"] .list-section-heading', ["b", "a"]);
    await page.waitForFunction(async () => (await taskDb.all()).filter(task => ["a", "b"].includes(task.id)).every(task => task.sectionId === "two"));
    assert.deepEqual(await page.locator('.list-section[data-section-id="two"] .task-text').allTextContents(), ["Б", "А", "В"]);
    assert.deepEqual(errors, []);
    console.log("section reorder scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
