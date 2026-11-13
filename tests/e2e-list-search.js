const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const first = createList({ title: "Альфа" });
      const second = createList({ title: "Бета" });
      await listDb.putMany([first, second]);
      lists.push(first, second);
      const task = createTask({ title: "Пошук списку", listId: first.id });
      await taskDb.put(task);
      tasks.push(task);
      openList(first.id);
      selectedTaskIds = new Set([task.id]);
      renderCurrentTasks();
    });
    await page.locator("#selection-toolbar").waitFor({ state: "visible" });
    await page.keyboard.press("v");
    const search = page.locator("#selected-list-options .list-dropdown-search");
    await search.waitFor({ state: "visible" });
    await page.waitForFunction(() => document.activeElement === document.querySelector("#selected-list-options .list-dropdown-search"));
    await page.keyboard.type("Б");
    assert.equal(await page.locator("#selected-list-options").evaluate(element => element.classList.contains("list-dropdown-keyboard")), true);
    await page.waitForFunction(() => [...document.querySelectorAll("#selected-list-options [data-list-id]")].filter(option => !option.hidden).length === 1);
    await search.fill("Бе");
    assert.equal(await page.locator("#selected-list-options [data-list-id]:visible").count(), 1);
    await search.fill("Немає");
    await page.locator("#selected-list-options .list-dropdown-empty").waitFor({ state: "visible" });
    await search.fill("");
    assert.equal(await page.locator("#selected-list-options [data-list-id]:visible").count() >= 3, true);
    assert.equal(await page.locator("#selected-list-options .is-selected").count(), 1);
    await page.click("#selected-list-options .list-dropdown-search-close");
    await page.locator("#selected-list-options").waitFor({ state: "hidden" });
    await page.click("#list-selected");
    assert.equal(await page.locator("#selected-list-options .list-dropdown-search").inputValue(), "");
    await search.fill("Бета");
    await page.keyboard.press("ArrowUp");
    assert.equal(await page.locator("#selected-list-options .list-dropdown-keyboard-active").count(), 1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Пошук списку")?.listId === lists.find(list => list.title === "Бета")?.id), true);
    assert.deepEqual(errors, []);
    console.log("List search: PASS");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
