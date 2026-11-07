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
    assert.deepEqual(await page.locator("#quick-checklist-task option").allTextContents(), ["Покупки"]);
    await page.locator("#quick-checklist-cancel").click();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#task-editor").isVisible(), false);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "visible" });
    await page.mouse.up();
    await page.locator("#quick-checklist-title").fill("Молоко");
    await page.locator("#quick-checklist-save").click();
    await page.locator("#quick-checklist-backdrop").waitFor({ state: "hidden" });
    await page.reload();
    const description = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Покупки").description);
    assert.equal(description, "- [ ] Хліб\n- [ ] Молоко");
    await add.click();
    await page.locator("#task-editor").waitFor({ state: "visible" });
    assert.deepEqual(errors, []);
    console.log("Quick checklist scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
