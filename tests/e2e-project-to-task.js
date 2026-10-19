const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Старий проєкт");
    await page.click("#project-create-form button[type=submit]");
    const firstProjectId = await page.evaluate(() => activeProjectId);
    await page.fill("#project-step-title", "Крок у списку");
    await page.click("#project-step-form button");
    const stepId = await page.locator("#project-task-list .swipe-row").first().getAttribute("data-id");
    const workListId = await page.evaluate(async () => (await addList("Зелений список", { fromMainMenu: false })).id);
    await page.locator(`#project-task-list [data-id="${stepId}"] .task-open`).click();
    await page.click("#task-list-trigger");
    await page.locator(`#task-list-options [data-list-id="${workListId}"]`).click();
    await page.waitForFunction(id => tasks.find(task => task.id === id)?.listId === document.querySelector("#task-list-select").value, stepId);
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });

    await page.click("#project-edit-open");
    await page.fill("#project-title", "Нове завдання з проєкту");
    await page.fill("#project-description", "Незбережений опис");
    await page.click("#project-convert-task");
    assert.equal(await page.locator("#project-convert-keep-steps").isChecked(), true);
    await page.click("#project-convert-cancel");
    assert.equal(await page.locator("#project-title").inputValue(), "Нове завдання з проєкту");
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);

    await page.evaluate(id => {
      window.originalTaskFromProject = taskFromProject;
      taskFromProject = (...args) => ({ ...window.originalTaskFromProject(...args), id });
    }, stepId);
    await page.click("#project-convert-task");
    await page.click("#project-convert-confirm");
    await page.locator("#toast .toast-message").filter({ hasText: "Не вдалося перетворити проєкт" }).waitFor();
    assert.equal(await page.locator("#project-editor").isVisible(), true);
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);
    assert.equal((await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id)?.projectId, stepId)), firstProjectId);
    await page.evaluate(() => { taskFromProject = window.originalTaskFromProject; });

    await page.click("#project-convert-task");
    await page.click("#project-convert-confirm");
    await page.waitForFunction(() => document.querySelector("#task-title").value === "Нове завдання з проєкту");
    const kept = await page.evaluate(async () => ({ projects: await projectDb.all(), tasks: await taskDb.all() }));
    assert.equal(kept.projects.some(project => project.id === firstProjectId), false);
    const converted = kept.tasks.find(task => task.title === "Нове завдання з проєкту");
    assert.equal(converted.listId, "system-list-inbox");
    assert.equal(converted.description, "Незбережений опис");
    assert.equal(converted.position, 0);
    const keptStep = kept.tasks.find(task => task.id === stepId);
    assert.equal(keptStep.listId, workListId);
    assert.equal(keptStep.projectId, null);
    assert.equal(keptStep.projectPosition, null);
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });

    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Проєкт без кроків");
    await page.click("#project-create-form button[type=submit]");
    const secondProjectId = await page.evaluate(() => activeProjectId);
    await page.fill("#project-step-title", "Крок для видалення");
    await page.click("#project-step-form button");
    const deletedStepId = await page.locator("#project-task-list .swipe-row").first().getAttribute("data-id");
    await page.click("#project-edit-open");
    await page.click("#project-convert-task");
    await page.locator("#project-convert-keep-steps").uncheck();
    await page.click("#project-convert-confirm");
    await page.waitForFunction(() => document.querySelector("#task-title").value === "Проєкт без кроків");
    const removed = await page.evaluate(async () => ({ projects: await projectDb.all(), tasks: await taskDb.all() }));
    assert.equal(removed.projects.some(project => project.id === secondProjectId), false);
    assert.equal(removed.tasks.some(task => task.id === deletedStepId), false);
    assert.equal(removed.tasks.some(task => task.title === "Проєкт без кроків"), true);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 0);
    assert.equal((await page.evaluate(async () => taskDb.all())).some(task => task.id === deletedStepId), false);
    assert.deepEqual(errors, []);
    console.log("project to task e2e passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
