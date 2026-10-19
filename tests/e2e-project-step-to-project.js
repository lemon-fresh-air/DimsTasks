const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Початковий проєкт");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Перший крок");
    await page.click("#project-step-form button");
    await page.fill("#project-step-title", "Поточний крок");
    await page.click("#project-step-form button");
    const sourceId = await page.evaluate(() => activeProjectId);
    const currentId = await page.evaluate(() => currentProjectTask(tasks, activeProjectId).id);
    await page.locator(`#project-task-list [data-id="${currentId}"] .task-open`).click();
    await page.fill("#task-title", "Новий самостійний проєкт");
    await page.fill("#task-description", "Опис із редактора");

    await page.click("#task-detach-project");
    await page.locator('#task-detach-dialog input[value="project"]').check();
    await page.click("#task-detach-cancel");
    assert.equal(await page.locator("#task-title").inputValue(), "Новий самостійний проєкт");
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);

    await page.evaluate(() => {
      window.originalProjectFromTask = projectFromTask;
      projectFromTask = (...args) => ({ ...window.originalProjectFromTask(...args), id: activeProjectId });
    });
    await page.click("#task-detach-project");
    await page.locator('#task-detach-dialog input[value="project"]').check();
    await page.click("#task-detach-confirm");
    await page.locator("#toast .toast-message").filter({ hasText: "Не вдалося створити проєкт" }).waitFor();
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);
    assert.equal((await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id)?.projectId, currentId)), sourceId);
    await page.evaluate(() => { projectFromTask = window.originalProjectFromTask; });

    await page.click("#task-detach-project");
    await page.locator('#task-detach-dialog input[value="project"]').check();
    await page.click("#task-detach-confirm");
    await page.locator("#project-screen-title").filter({ hasText: "Новий самостійний проєкт" }).waitFor();
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 2);
    await page.locator("#toast-action").click();
    await page.waitForFunction(id => document.querySelector("#task-editor").dataset.taskId === id, currentId);
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);
    assert.equal((await page.evaluate(async id => (await taskDb.all()).find(task => task.id === id)?.projectId, currentId)), sourceId);
    assert.equal(await page.locator("#task-title").inputValue(), "Новий самостійний проєкт");

    await page.click("#task-detach-project");
    await page.locator('#task-detach-dialog input[value="project"]').check();
    await page.click("#task-detach-confirm");
    await page.locator("#project-screen-title").filter({ hasText: "Новий самостійний проєкт" }).waitFor();
    const state = await page.evaluate(async id => ({ projects: await projectDb.all(), tasks: await taskDb.all(), sourceId: id }), sourceId);
    const created = state.projects.find(project => project.id !== sourceId);
    assert.equal(created.title, "Новий самостійний проєкт");
    assert.equal(created.description, "Опис із редактора");
    assert.equal(created.status, "active");
    assert.equal(created.position, 1);
    assert.equal(state.tasks.some(task => task.id === currentId), false);
    assert.equal(state.tasks.filter(task => task.projectId === created.id).length, 0);
    assert.equal(state.tasks.filter(task => task.projectId === sourceId).length, 1);
    assert.equal(state.projects.find(project => project.id === sourceId).title, "Початковий проєкт");
    assert.equal(await page.evaluate(id => currentProjectTask(tasks, id)?.title, sourceId), "Перший крок");

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator(`[data-project-id="${created.id}"]`).click();
    assert.equal(await page.locator("#project-screen-title").textContent(), "Новий самостійний проєкт");
    assert.equal(await page.locator("#project-task-list .swipe-row").count(), 0);
    assert.deepEqual(errors, []);
    console.log("project step to project e2e passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
