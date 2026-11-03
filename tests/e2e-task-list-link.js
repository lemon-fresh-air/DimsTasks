const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const list = await addList("Робота", { fromMainMenu: false });
      await taskDb.put(createTask({ title: "Перейти до списку", listId: list.id, dueDate: localDateValue() }));
      await refresh();
      openList(TODAY_LIST_ID);
    });
    await page.locator("#task-list .task-open").first().click();
    await page.locator("#task-list-trigger").click();
    assert.equal(await page.locator("#task-list-options").isVisible(), true);
    await page.locator("#task-list-trigger").click();
    await page.locator("#task-list-link").click();
    await page.waitForFunction(() => document.body.classList.contains("task-editor-open") === false);
    assert.equal(await page.locator("#current-list-heading").textContent(), "Робота");
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Перейти до списку").listId), await page.evaluate(() => lists.find(list => list.title === "Робота").id));
    assert.deepEqual(errors, []);
    process.stdout.write("Task list link: OK\n");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
