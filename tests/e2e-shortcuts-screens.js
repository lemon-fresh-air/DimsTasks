const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const go = async key => {
      await page.evaluate(() => document.activeElement.blur());
      await page.keyboard.press("g");
      await page.keyboard.press(key);
    };
    await page.evaluate(() => openMainMenu());
    await page.locator("#main-menu").waitFor({ state: "visible" });
    await go("t");
    await page.waitForFunction(() => activeListId === TODAY_LIST_ID && els.mainMenu.hidden);

    await page.evaluate(() => openSettings());
    await page.locator("#settings-screen").waitFor({ state: "visible" });
    await go("i");
    await page.waitForFunction(() => activeListId === INBOX_LIST_ID && els.settingsScreen.hidden);

    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Хоткей з КП");
    await page.click("#project-create-form button[type=submit]");
    await page.locator("#project-screen").waitFor({ state: "visible" });
    await go("t");
    await page.waitForFunction(() => activeListId === TODAY_LIST_ID && projectEls.screen.hidden && projectEls.overview.hidden);

    await page.evaluate(() => {
      const list = createList({ title: "Швидкий список", position: 0 });
      lists.push(list);
      listDb.put(list);
      renderListMenu();
    });
    await go("1");
    await page.waitForFunction(() => activeList()?.title === "Швидкий список");

    await page.evaluate(() => openListEditor());
    await page.locator("#list-editor").waitFor({ state: "visible" });
    await go("p");
    await page.waitForFunction(() => !projectEls.overview.hidden && els.listEditor.hidden);
    await page.locator(".project-card").first().click();
    await page.click("#project-edit-open");
    await page.locator("#project-editor").waitFor({ state: "visible" });
    await go("i");
    await page.waitForFunction(() => activeListId === INBOX_LIST_ID && projectEls.screen.hidden);

    await page.evaluate(() => { openSettings(); openCompletedTasks(); });
    await page.locator("#completed-tasks-screen").waitFor({ state: "visible" });
    await go("1");
    await page.waitForFunction(() => activeList()?.title === "Швидкий список" && els.completedTasksScreen.hidden && els.settingsScreen.hidden);

    await page.keyboard.press("q");
    await page.locator("#task-editor").waitFor({ state: "visible" });
    await page.fill("#task-title", "Збережене завдання");
    await page.keyboard.press("g");
    await page.keyboard.press("t");
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.equal(await page.locator("#task-title").inputValue(), "Збережене завданняgt");
    await page.locator("#task-editor-back").focus();
    await go("t");
    await page.waitForFunction(() => activeListId === TODAY_LIST_ID && els.editor.hidden);
    assert.equal(await page.evaluate(() => tasks.some(task => task.title === "Збережене завданняgt")), true);

    await page.keyboard.press("?");
    await page.locator("#keyboard-shortcuts-dialog").waitFor({ state: "visible" });
    await page.keyboard.press("g");
    await page.keyboard.press("i");
    assert.equal(await page.evaluate(() => activeListId), await page.evaluate(() => TODAY_LIST_ID));
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    console.log("navigation shortcuts from menu, settings, completed, project, list and task editors, and modal passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
