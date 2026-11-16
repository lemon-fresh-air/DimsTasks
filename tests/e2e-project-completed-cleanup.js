const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.locator("#nav-projects").click();
    await page.locator("#project-add").click();
    await page.locator("#project-create-title").fill("Проєкт для очищення");
    await page.locator("#project-create-form button[type=submit]").click();
    await page.waitForFunction(() => activeProjectId && projects.some(project => project.id === activeProjectId));
    const ids = await page.evaluate(async () => {
      const projectId = activeProjectId;
      const other = createProject({ title: "Інший проєкт", position: 2 });
      const completedAt = new Date().toISOString();
      const completed = [0, 1].map(index => createTask({ title: `Завершений ${index + 1}`, projectId,
        projectPosition: index, status: "completed", completedAt }));
      const active = createTask({ title: "Активний крок", projectId, projectPosition: 2 });
      const outside = createTask({ title: "Чуже завершене", projectId: other.id, projectPosition: 0,
        status: "completed", completedAt });
      await projectDb.put(other);
      await taskDb.putMany([...completed, active, outside]);
      projects.push(other);
      await refresh();
      renderOpenProject();
      return { projectId, active: active.id, outside: outside.id, screenHidden: projectEls.screen.hidden,
        completedCount: projectSteps(projectId).filter(isTaskCompleted).length,
        buttonHidden: projectEls.deleteCompletedTasks.hidden };
    });
    assert.equal(ids.screenHidden, false);
    assert.equal(ids.completedCount, 2);
    assert.equal(ids.buttonHidden, false);
    await page.locator("#project-edit-open").click();
    await page.locator("#project-actions-trigger").click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.locator("#project-delete-completed-tasks").evaluate(button => button === document.activeElement), true);
    await page.keyboard.press("Enter");
    await page.waitForFunction(id => tasks.filter(task => task.projectId === id).length === 1, ids.projectId);
    assert.match(await page.locator("#project-progress").textContent(), /1 завд\. · 0 виконано/);
    assert.equal(await page.evaluate(id => tasks.some(task => task.id === id), ids.active), true);
    assert.equal(await page.evaluate(id => tasks.some(task => task.id === id), ids.outside), true);
    await page.locator("#toast-action").click();
    await page.waitForFunction(id => tasks.filter(task => task.projectId === id).length === 3, ids.projectId);
    assert.match(await page.locator("#project-progress").textContent(), /3 завд\. · 2 виконано/);
    await page.locator("#project-actions-trigger").click();
    await page.locator("#project-delete-completed-tasks").click();
    await page.waitForFunction(id => tasks.filter(task => task.projectId === id).length === 1, ids.projectId);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-projects").click();
    await page.locator(".project-card").filter({ hasText: "Проєкт для очищення" }).click();
    assert.match(await page.locator("#project-progress").textContent(), /1 завд\. · 0 виконано/);
    await page.locator("#project-edit-open").click();
    await page.locator("#project-actions-trigger").click();
    assert.equal(await page.locator("#project-delete-completed-tasks").isHidden(), true);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
