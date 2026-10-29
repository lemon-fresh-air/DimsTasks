"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const project = createProject({ title: "Вихідний проєкт" });
      const steps = [0, 1, 2].map(index => createTask({ title: `Крок ${index}`, projectId: project.id, projectPosition: index }));
      await projectDb.put(project);
      await taskDb.putMany(steps);
      projects = [project];
      tasks = steps;
      openProject(project.id);
      selectedTaskIds = new Set([steps[0].id, steps[2].id]);
      renderOpenProject();
    });
    await page.click("#project-create-from-steps");
    await page.fill("#project-create-from-steps-name", "Новий проєкт");
    await page.click("#project-create-from-steps-cancel");
    assert.equal(await page.evaluate(() => projects.length), 1);
    await page.click("#project-create-from-steps");
    await page.fill("#project-create-from-steps-name", "Новий проєкт");
    await page.click("#project-create-from-steps-confirm");
    await page.waitForFunction(() => projects.length === 2);
    assert.deepEqual(await page.evaluate(() => {
      const newProject = projects.find(project => project.title === "Новий проєкт");
      return tasks.filter(task => task.projectId === newProject.id).sort(compareProjectTasks).map(task => [task.title, task.projectPosition]);
    }), [["Крок 0", 0], ["Крок 2", 1]]);
    assert.equal(await page.evaluate(() => tasks.filter(task => task.projectId === activeProjectId).length), 1);
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual(await page.evaluate(async () => {
      const savedProjects = await projectDb.all();
      const savedTasks = await taskDb.all();
      const newProject = savedProjects.find(project => project.title === "Новий проєкт");
      return [savedProjects.length, savedTasks.filter(task => task.projectId === newProject.id).length];
    }), [2, 2]);
    assert.deepEqual(errors, []);
    console.log("project from steps passed: cancel, save, order, remaining step, reload");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
