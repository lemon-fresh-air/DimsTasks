const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      await listDb.put(createList({ id: "work", title: "Робота" }));
      await projectDb.put(createProject({ id: "project", title: "Проєкт" }));
      await taskDb.put(createTask({ id: "active", title: "Активне", listId: "work", projectId: "project" }));
      await taskDb.put(createTask({ id: "done", title: "Завершене", status: "completed", completedAt: new Date().toISOString() }));
      await settingsDb.setTheme("dark");
      await refresh();
    });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.click("#clear-data-open");
    assert.equal(await page.locator("#clear-completed").isChecked(), true);
    assert.equal(await page.locator("#clear-settings").isChecked(), false);
    await page.click("#clear-data-cancel");
    assert.equal((await page.evaluate(() => taskDb.all())).length, 2);

    await page.click("#clear-data-open");
    await page.fill("#clear-data-phrase", "ТАК, ВИДАЛИТИ");
    await page.click("#clear-data-confirm");
    await page.locator("#toast.show.undoable").waitFor({ state: "visible" });
    assert.equal(await page.locator("#toast .toast-message").textContent(), "Історію видалено");
    assert.deepEqual((await page.evaluate(() => taskDb.all())).map(task => task.id), ["active"]);
    assert.equal(await page.locator("#toast").evaluate(element => element.style.getPropertyValue("--toast-duration")), "3000ms");
    await page.click("#toast-action");
    await page.waitForFunction(async () => (await taskDb.all()).length === 2);

    await page.click("#clear-data-open");
    await page.uncheck("#clear-completed");
    await page.check("#clear-lists");
    await page.check("#clear-projects");
    await page.fill("#clear-data-phrase", "так, видалити");
    await page.click("#clear-data-confirm");
    await page.waitForFunction(async () => (await listDb.all()).length === 1 && (await projectDb.all()).length === 0);
    const detached = await page.evaluate(async () => ({ tasks: await taskDb.all(), theme: await settingsDb.theme() }));
    assert.equal(detached.tasks.length, 2);
    assert.equal(detached.tasks.find(task => task.id === "active").listId, "system-list-inbox");
    assert.equal(detached.tasks.find(task => task.id === "active").projectId, null);
    assert.equal(detached.theme, "dark");
    await page.click("#toast-action");
    await page.waitForFunction(async () => (await projectDb.all()).length === 1);

    await page.click("#clear-data-open");
    for (const id of ["#clear-active", "#clear-lists", "#clear-projects", "#clear-settings"]) await page.check(id);
    for (const id of ["#clear-active", "#clear-completed", "#clear-lists", "#clear-projects", "#clear-settings"]) await page.uncheck(id);
    await page.fill("#clear-data-phrase", "так, видалити");
    assert.equal(await page.locator("#clear-data-confirm").isEnabled(), false);
    for (const id of ["#clear-active", "#clear-completed", "#clear-lists", "#clear-projects", "#clear-settings"]) await page.check(id);
    await page.fill("#clear-data-phrase", "невірна фраза");
    assert.equal(await page.locator("#clear-data-confirm").isEnabled(), false);
    await page.fill("#clear-data-phrase", "так, видалити");
    await page.click("#clear-data-confirm");
    await page.waitForFunction(async () => (await taskDb.all()).length === 0 && !document.querySelector("#clear-data-dialog").open);
    const empty = await page.evaluate(async () => ({ lists: await listDb.all(), projects: await projectDb.all(), theme: await settingsDb.theme() }));
    assert.deepEqual(empty.lists.map(item => item.id), ["system-list-inbox"]);
    assert.equal(empty.projects.length, 0);
    assert.equal(empty.theme, "light");
    await page.reload();
    assert.equal((await page.evaluate(() => taskDb.all())).length, 0);
    assert.deepEqual(errors, []);
    console.log("Clear data scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
