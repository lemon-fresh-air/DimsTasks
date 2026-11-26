const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const original = await page.evaluate(async () => {
      const list = await addList("Список оригіналу", { fromMainMenu: false });
      const section = createSection({ listId: list.id, title: "Секція" });
      await sectionDb.put(section);
      sections.push(section);
      const task = createTask({ title: "Зробити копію", description: "- [x] Готовий пункт",
        listId: list.id, sectionId: section.id });
      await taskDb.put(task);
      await refresh();
      openList(list.id);
      return task;
    });
    const copies = () => page.evaluate(async id => (await taskDb.all()).filter(task => task.id !== id), original.id);
    const dialog = page.locator("#duplicate-task-dialog");
    await page.evaluate(id => selectTask(id), original.id);
    await page.click("#task-selection-more-trigger");
    await page.click("#duplicate-selected-task");
    await dialog.waitFor({ state: "visible" });
    assert.equal(await page.locator("#duplicate-task-list").inputValue(), original.listId);
    await page.click("#duplicate-task-cancel");
    await dialog.waitFor({ state: "hidden" });
    assert.deepEqual(await copies(), []);

    await page.click("#task-selection-more-trigger");
    await page.click("#duplicate-selected-task");
    await page.click("#duplicate-task-save");
    await page.waitForFunction(() => document.querySelectorAll("#task-list .swipe-row").length === 2);
    const [sameListCopy] = await copies();
    assert.equal(sameListCopy.sectionId, original.sectionId);
    assert.equal(sameListCopy.description, original.description);
    assert.ok(sameListCopy.position > original.position);

    await page.click("#selection-close");
    await page.locator(`[data-id="${original.id}"] .task-open`).click();
    await page.fill("#task-title", "Назва копії з редактора");
    await page.click("#task-actions-trigger");
    await page.locator("#task-copy-description").waitFor();
    await page.click("#duplicate-open-task");
    await page.selectOption("#duplicate-task-list", "system-list-inbox");
    await page.click("#duplicate-task-save");
    await dialog.waitFor({ state: "hidden" });
    await page.reload();
    const inboxCopy = (await copies()).find(task => task.listId === "system-list-inbox");
    assert.equal(inboxCopy.title, "Назва копії з редактора");
    assert.equal(inboxCopy.description, original.description);
    assert.equal(inboxCopy.sectionId, null);
    assert.equal(await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id).title, original.id), original.title);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
