const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#add-task-btn");
    assert.equal(await page.locator("#task-convert-project").isHidden(), true);
    await page.fill("#task-title", "Початкове завдання");
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    await page.locator(".task-open").first().click();
    assert.equal(await page.locator("#task-convert-project").isVisible(), true);
    await page.fill("#task-title", "   ");
    await page.click("#task-convert-project");
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.equal(await page.locator("#toast .toast-message").textContent(), "Введіть назву завдання");

    await page.fill("#task-title", "Нова назва проєкту");
    await page.fill("#task-description", "Новий опис");
    await page.evaluate(() => {
      const existing = createProject({ title: "Колізія", position: 0 });
      window.testCollisionProject = existing;
      window.testOriginalProjectFromTask = projectFromTask;
      projectFromTask = (...args) => ({ ...window.testOriginalProjectFromTask(...args), id: existing.id });
    });
    await page.evaluate(async () => {
      await projectDb.put(window.testCollisionProject);
      projects.push(window.testCollisionProject);
      renderProjects();
    });
    await page.click("#task-convert-project");
    await page.locator("#toast .toast-message").filter({ hasText: "Не вдалося створити проєкт" }).waitFor();
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    const afterFailure = await page.evaluate(async () => ({ tasks: await taskDb.all(), projects: await projectDb.all() }));
    assert.equal(afterFailure.tasks.length, 1);
    assert.equal(afterFailure.tasks[0].title, "Початкове завдання");
    assert.equal(afterFailure.projects.length, 1);
    assert.equal(await page.locator("#task-title").inputValue(), "Нова назва проєкту");
    await page.evaluate(() => { projectFromTask = window.testOriginalProjectFromTask; });

    await page.click("#task-convert-project");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    await page.locator("#project-screen").waitFor({ state: "visible" });
    assert.equal(await page.locator("#project-screen-title").textContent(), "Нова назва проєкту");
    const converted = await page.evaluate(async () => ({ tasks: await taskDb.all(), projects: await projectDb.all() }));
    assert.equal(converted.tasks.length, 0);
    assert.equal(converted.projects.length, 2);
    const project = converted.projects.find(item => item.title === "Нова назва проєкту");
    assert.equal(project.description, "Новий опис");
    assert.equal(project.status, "active");
    assert.equal(project.position, 1);
    assert.equal(await page.locator("#project-task-list .task-card").count(), 0);

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator(`[data-project-id="${project.id}"]`).click();
    assert.equal(await page.locator("#project-screen-title").textContent(), "Нова назва проєкту");
    assert.equal((await page.evaluate(async () => taskDb.all())).length, 0);
    await page.click("#project-back");
    await page.click("#nav-inbox");
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Сусіднє завдання");
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".task-text").first().textContent(), "Сусіднє завдання");
    assert.deepEqual(errors, []);
    console.log("task to project e2e passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
