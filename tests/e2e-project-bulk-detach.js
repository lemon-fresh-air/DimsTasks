const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const ids = await page.evaluate(async () => {
      const list = createList({ title: "Робочий список", kind: "regular", position: 1 });
      const section = createSection({ listId: list.id, title: "План", position: 0 });
      const project = createProject({ title: "Вихідний проєкт" });
      const active = createTask({ title: "Вибраний активний", listId: list.id, sectionId: section.id,
        projectId: project.id, projectPosition: 0, position: 7, dueDate: "2026-11-08" });
      const completed = createTask({ title: "Вибраний завершений", listId: list.id, sectionId: section.id,
        projectId: project.id, projectPosition: 1, position: 8, status: "completed", completedAt: new Date().toISOString() });
      const untouched = createTask({ title: "Невибраний", listId: list.id, sectionId: section.id,
        projectId: project.id, projectPosition: 2, position: 9 });
      await listDb.put(list); await sectionDb.put(section); await projectDb.put(project);
      await taskDb.putMany([active, completed, untouched]);
      lists.push(list); sections.push(section); projects.push(project); tasks.push(active, completed, untouched);
      openProject(project.id);
      selectedTaskIds = new Set([active.id, completed.id]);
      renderOpenProject();
      return { projectId: project.id, activeId: active.id, completedId: completed.id, untouchedId: untouched.id,
        listId: list.id, sectionId: section.id };
    });
    await page.click("#project-selection-more-trigger");
    assert.equal(await page.locator("#project-selection-more-menu .projects-icon").count(), 3);
    assert.equal(await page.locator("#project-add-to-existing svg path").count(), 1);
    await page.click("#project-detach-selected");
    await page.waitForFunction(({ activeId, completedId }) =>
      tasks.find(task => task.id === activeId)?.projectId === null && tasks.find(task => task.id === completedId)?.projectId === null, ids);
    assert.deepEqual(await page.evaluate(({ activeId, completedId, untouchedId }) =>
      [activeId, completedId, untouchedId].map(id => {
        const task = tasks.find(item => item.id === id);
        return [task.projectId, task.projectSectionId, task.projectPosition, task.listId, task.sectionId,
          task.position, task.dueDate, task.status];
      }), ids), [
      [null, null, null, ids.listId, ids.sectionId, 7, "2026-11-08", "active"],
      [null, null, null, ids.listId, ids.sectionId, 8, null, "completed"],
      [ids.projectId, null, 2, ids.listId, ids.sectionId, 9, null, "active"]
    ]);
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual(await page.evaluate(async ({ activeId, completedId, untouchedId }) => {
      const saved = await taskDb.all();
      return [activeId, completedId, untouchedId].map(id => saved.find(task => task.id === id).projectId);
    }, ids), [null, null, ids.projectId]);
    assert.deepEqual(errors, []);
    console.log("project bulk detach: passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
