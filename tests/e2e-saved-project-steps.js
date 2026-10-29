const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "План");
    await page.click("#project-create-form button[type=submit]");
    for (const title of ["Перший", "Виконаний", "Другий"]) {
      await page.fill("#project-step-title", title);
      await page.click("#project-step-form button");
      await page.waitForFunction(count => tasks.filter(task => task.projectId === activeProjectId).length === count,
        ["Перший", "Виконаний", "Другий"].indexOf(title) + 1);
    }
    await page.evaluate(async () => {
      const steps = tasks.filter(task => task.projectId === activeProjectId);
      const updates = steps.map((step, index) => ({ ...step, description: `Повний опис ${index}\nдругий рядок`,
        status: index === 1 ? "completed" : "active", completedAt: index === 1 ? new Date().toISOString() : null }));
      await taskDb.putMany(updates);
      tasks = tasks.map(task => updates.find(item => item.id === task.id) || task);
    });
    await page.click("#project-edit-open");
    await page.click("#project-convert-task");
    assert.equal(await page.locator('input[name="project-convert-choice"]:checked').inputValue(), "save");
    await page.click("#project-convert-cancel");
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);
    await page.click("#project-convert-task");
    await page.click("#project-convert-confirm");
    await page.locator("#task-saved-steps").waitFor({ state: "visible" });
    assert.equal(await page.locator("#task-saved-steps").evaluate(node => node.open), false);
    await page.locator("#task-saved-steps summary").click();
    assert.deepEqual(await page.locator("#task-saved-steps strong").allTextContents(), ["Перший", "Другий"]);
    assert.equal(await page.locator("#task-saved-steps-list").textContent().then(text => text.includes("другий рядок")), true);
    const saved = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "План"));
    assert.equal(saved.savedSteps.length, 2);
    assert.equal((await page.evaluate(async () => taskDb.all())).length, 1);
    await page.evaluate(async () => {
      const collision = createProject({ id: "collision", title: "Колізія" });
      await projectDb.put(collision);
      projects.push(collision);
      window.originalProjectFromTask = projectFromTask;
      projectFromTask = (...args) => ({ ...window.originalProjectFromTask(...args), id: "collision" });
    });
    await page.click("#task-convert-project");
    await page.locator("#toast .toast-message").filter({ hasText: "Не вдалося створити проєкт" }).waitFor();
    assert.equal((await page.evaluate(async () => taskDb.all())).some(task => task.id === saved.id), true);
    assert.equal((await page.evaluate(async () => projectDb.all())).length, 1);
    await page.evaluate(() => { projectFromTask = window.originalProjectFromTask; });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".task-open").first().click();
    assert.equal(await page.locator("#task-saved-steps").isVisible(), true);
    assert.match(await page.locator("#task-convert-project").textContent(), /2 кроків/);
    await page.click("#task-convert-project");
    await page.locator("#project-screen").waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelectorAll("#project-task-list .swipe-row").length === 2);
    assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Перший", "Другий"]);
    const restored = await page.evaluate(async () => ({ projects: await projectDb.all(), tasks: await taskDb.all() }));
    assert.equal(restored.projects.length, 2);
    assert.deepEqual(restored.tasks.sort((a, b) => a.projectPosition - b.projectPosition).map(task => task.title), ["Перший", "Другий"]);
    assert.equal(restored.tasks.every(task => task.status === "active" && task.completedAt === null), true);
    assert.equal(restored.tasks[0].description.includes("другий рядок"), true);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await page.evaluate(async () => taskDb.all())).length, 2);
    await page.click("#nav-inbox");
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Сусіднє завдання");
    assert.equal(await page.locator("#task-saved-steps").isHidden(), true);
    await page.click("#task-editor-back");
    await page.locator("#task-editor").waitFor({ state: "hidden" });
    assert.equal((await page.evaluate(async () => taskDb.all())).some(task => task.title === "Сусіднє завдання"), true);
    assert.deepEqual(errors, []);
    console.log("saved project steps e2e passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
