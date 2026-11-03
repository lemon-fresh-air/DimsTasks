const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const list = await addList("Робота", { fromMainMenu: false });
      const section = createSection({ listId: list.id, title: "Підготовка", position: 0 });
      await sectionDb.put(section);
      sections.push(section);
      openList(list.id);
    });
    await page.locator("#task-list .list-section-add").click();
    await page.fill("#quick-task-title", "Скасований");
    await page.click("#quick-task-cancel");
    assert.equal(await page.locator("#quick-task-backdrop").isVisible(), false);
    await page.locator("#task-list .list-section-add").click();
    await page.fill("#quick-task-title", "Завдання в секції");
    await page.fill("#quick-task-description", "Опис завдання");
    await page.locator("#quick-task-form button[type=submit]").click();
    await page.waitForFunction(() => document.querySelector("#quick-task-backdrop").hidden);
    assert.equal(await page.evaluate(async () => {
      const task = (await taskDb.all()).find(item => item.title === "Завдання в секції");
      const section = sections.find(item => item.title === "Підготовка");
      return task.listId === section.listId && task.sectionId === section.id && task.description === "Опис завдання" && task.projectId === null && task.dueDate === null;
    }), true);
    await page.locator("#task-list .list-section-toggle").click();
    await page.waitForFunction(() => document.querySelector("#task-list .list-section-tasks").hidden);
    assert.equal(await page.locator("#task-list .list-section-tasks").isVisible(), false);
    await page.locator("#task-list .list-section-add").click();
    assert.equal(await page.locator("#quick-task-backdrop").isVisible(), true);
    await page.click("#quick-task-cancel");
    await page.evaluate(async () => {
      const list = lists.find(item => item.title === "Робота");
      const project = createProject({ title: "Проєкт", defaultListId: list.id,
        projectSections: [{ id: crypto.randomUUID(), title: "Етап", collapsed: false }] });
      await projectDb.put(project);
      projects.push(project);
      openProjects();
      openProject(project.id);
    });
    await page.locator("#project-task-list .list-section-add").click();
    await page.fill("#quick-task-title", "Крок у секції");
    await page.fill("#quick-task-description", "Опис кроку");
    await page.locator("#quick-task-form button[type=submit]").click();
    await page.waitForFunction(() => document.querySelector("#quick-task-backdrop").hidden);
    assert.equal(await page.evaluate(async () => {
      const task = (await taskDb.all()).find(item => item.title === "Крок у секції");
      const project = projects.find(item => item.title === "Проєкт");
      return task.projectId === project.id && task.projectSectionId === project.projectSections[0].id && task.listId === project.defaultListId && task.description === "Опис кроку" && task.sectionId === null;
    }), true);
    await page.locator("#project-task-list .list-section-toggle").click();
    await page.waitForFunction(() => document.querySelector("#project-task-list .list-section-tasks").hidden);
    await page.locator("#project-task-list .list-section-add").click();
    assert.equal(await page.locator("#quick-task-backdrop").isVisible(), true);
    await page.click("#quick-task-cancel");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(async () => (await taskDb.all()).filter(task => ["Завдання в секції", "Крок у секції"].includes(task.title)).length), 2);
    assert.deepEqual(errors, []);
    process.stdout.write("Section quick task: OK\n");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
