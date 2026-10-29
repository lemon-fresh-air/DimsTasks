const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Наявне в Нові");
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    await page.locator(".task-open").first().click();
    assert.equal(await page.locator("#task-detach-project").isHidden(), true);
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });

    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Проєкт від’єднання");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Перший крок");
    await page.click("#project-step-form button");
    await page.fill("#project-step-title", "Другий крок");
    await page.click("#project-step-form button");
    const greenListId = await page.evaluate(async () => (await addList("Зелений список", { fromMainMenu: false })).id);
    const stepId = await page.locator("#project-task-list .swipe-row").first().getAttribute("data-id");
    const projectId = await page.evaluate(() => activeProjectId);
    const originalInboxPosition = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Наявне в Нові").position);
    await page.locator(`#project-task-list [data-id="${stepId}"] .task-open`).click();
    assert.equal(await page.locator("#task-detach-project").isVisible(), true);
    await page.click("#task-list-trigger");
    await page.locator(`#task-list-options [data-list-id="${greenListId}"]`).click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.listId === document.querySelector("#task-list-select").value, stepId);
    assert.equal(await page.locator("#task-list-value").textContent(), "Зелений список");

    await page.fill("#task-title", "   ");
    await page.click("#task-detach-project");
    await page.click("#task-detach-confirm");
    assert.equal(await page.locator("#toast .toast-message").textContent(), "Введіть назву завдання");
    await page.fill("#task-title", "Самостійний крок");
    await page.fill("#task-description", "Введений опис");
    await page.evaluate(() => {
      window.originalPutMany = taskDb.putMany;
      taskDb.putMany = async () => { throw new Error("test write failure"); };
    });
    await page.click("#task-detach-project");
    await page.click("#task-detach-confirm");
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.equal(await page.locator("#task-description").evaluate(node => node.value), "Введений опис");
    const failedRecord = await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id), stepId);
    assert.equal(failedRecord.projectId, projectId);
    assert.notEqual(failedRecord.title, "Самостійний крок");
    await page.evaluate(() => { taskDb.putMany = window.originalPutMany; });

    await page.click("#task-detach-project");
    await page.click("#task-detach-confirm");
    await page.waitForFunction(id => {
      const editor = document.querySelector("#task-editor");
      return editor.dataset.taskId === id && document.querySelector("#task-detach-project").hidden;
    }, stepId);
    await page.locator("#toast-action").click();
    await page.waitForFunction(id => document.querySelector("#task-editor").dataset.taskId === id
      && !document.querySelector("#task-detach-project").hidden, stepId);
    assert.equal((await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id)?.projectId, stepId)), projectId);
    await page.click("#task-detach-project");
    await page.click("#task-detach-confirm");
    await page.waitForFunction(id => document.querySelector("#task-editor").dataset.taskId === id
      && document.querySelector("#task-detach-project").hidden, stepId);
    assert.equal(await page.locator("#task-title").inputValue(), "Самостійний крок");
    assert.equal(await page.locator("#task-project-link").isHidden(), true);
    const saved = await page.evaluate(async id => ({ tasks: await taskDb.all(), project: (await projectDb.all()).find(p => p.id === id) }), projectId);
    const detached = saved.tasks.find(task => task.id === stepId);
    assert.equal(detached.listId, greenListId);
    assert.equal(detached.sectionId, null);
    assert.equal(detached.projectId, null);
    assert.equal(detached.projectPosition, null);
    assert.equal(detached.position, 0);
    assert.equal(detached.description, "Введений опис");
    assert.equal(saved.tasks.find(task => task.title === "Наявне в Нові").position, originalInboxPosition);
    assert.equal(saved.tasks.filter(task => task.projectId === projectId).length, 1);
    assert.equal(saved.project.title, "Проєкт від’єднання");
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#task-list .task-text").first().textContent(), "Самостійний крок");

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.locator(`#main-menu-lists [data-list-id="${greenListId}"]`).click();
    assert.equal(await page.locator("#task-list .task-text").first().textContent(), "Самостійний крок");
    await page.click("#nav-projects");
    await page.locator(`[data-project-id="${projectId}"]`).click();
    assert.equal(await page.locator("#project-task-list .swipe-row").count(), 1);
    assert.deepEqual(errors, []);
    console.log("detach project task e2e passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
