"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const task = createTask({ title: "Існуюче завдання", listId: INBOX_LIST_ID });
      const project = createProject({ title: "Тестовий проєкт" });
      await taskDb.put(task);
      await projectDb.put(project);
      tasks = [task];
      projects = [project];
      renderCurrentTasks();
    });
    await page.click("#task-list .task-open");
    await page.click("#task-attach-project");
    await page.click("#task-attach-cancel");
    assert.equal(await page.evaluate(() => tasks[0].projectId), null);
    await page.click("#task-attach-project");
    await page.click("#task-attach-confirm");
    await page.waitForFunction(() => Boolean(tasks[0]?.projectId));
    assert.equal(await page.locator("#task-project-value").textContent(), "Тестовий проєкт");
    await page.click("#task-editor-back");
    await page.click("#add-task-btn");
    await page.locator("#task-attach-project").waitFor({ state: "visible" });
    await page.click("#task-attach-project");
    await page.click("#task-attach-cancel");
    assert.equal(await page.evaluate(() => els.editor.dataset.pendingProjectId), "");
    await page.click("#task-attach-project");
    await page.click("#task-attach-confirm");
    await page.fill("#task-title", "Новий перший крок");
    await page.click("#task-editor-back");
    await page.waitForFunction(() => tasks.some(task => task.title === "Новий перший крок"));
    assert.equal(await page.evaluate(() => {
      const step = tasks.find(task => task.title === "Новий перший крок");
      return step.projectId === projects[0].id && currentProjectTask(tasks, projects[0].id)?.id === step.id;
    }), true);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(async () => {
      const saved = await taskDb.all();
      const project = (await projectDb.all())[0];
      return saved.filter(task => task.projectId === project.id).length === 2
        && currentProjectTask(saved, project.id)?.title === "Новий перший крок";
    }), true);
    assert.deepEqual(errors, []);
    console.log("task attach project passed: cancel, save, persistence");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
