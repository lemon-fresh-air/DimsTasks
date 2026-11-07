const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      await taskDb.put(createTask({ title: "Покупки", description: "- [ ] Хліб" }));
      await taskDb.put(createTask({ title: "Без чекліста" }));
      await taskDb.put(createTask({ title: "Завершені покупки", status: "completed", description: "- [ ] Сир" }));
      await refresh();
    });
    const add = page.locator("#add-task-btn");
    const box = await add.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "visible" });
    await page.mouse.up();
    assert.deepEqual(await page.locator("#quick-checklist-tasks button").allTextContents(), ["Покупки"]);
    await page.locator("#quick-checklist-cancel").click();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#task-editor").isVisible(), false);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "visible" });
    await page.mouse.up();
    await page.locator("#quick-checklist-title").fill("Молоко");
    await page.locator("#quick-checklist-search").fill("Покуп");
    await page.locator("#quick-checklist-tasks button").click();
    await page.locator("#quick-checklist-save").click();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "hidden" });
    await page.reload();
    const description = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Покупки").description);
    assert.equal(description, "- [ ] Хліб\n- [ ] Молоко");
    await add.click();
    await page.locator("#task-editor").waitFor({ state: "visible" });
    await page.locator("#task-editor-back").click();
    await page.locator(".swipe-row").filter({ hasText: "Покупки" }).first().locator(".task-open").click();
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-merge-checklist").click();
    await page.locator("#task-merge-search").fill("Без чекліста");
    assert.deepEqual(await page.locator("#task-merge-results button").allTextContents(), ["Без чекліста"]);
    await page.locator("#task-merge-cancel").click();
    await page.locator("#task-actions-trigger").click();
    await page.locator("#task-merge-checklist").click();
    await page.locator("#task-merge-search").fill("Без чекліста");
    await page.locator("#task-merge-results button").click();
    await page.locator("#task-merge-backdrop").waitFor({ state: "hidden" });
    await page.reload();
    const merged = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Без чекліста").description);
    assert.equal(merged, "- [ ] Хліб\n- [ ] Молоко");
    assert.deepEqual(errors, []);
    console.log("Quick checklist scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
