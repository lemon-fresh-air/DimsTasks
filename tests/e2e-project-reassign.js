"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const first = createProject({ title: "Перший" });
      const second = createProject({ title: "Другий" });
      const task = createTask({ title: "Крок", projectId: first.id, projectPosition: 0 });
      await projectDb.putMany([first, second]);
      await taskDb.put(task);
      projects = [first, second];
      tasks = [task];
      openTaskDetails(task);
    });
    await page.click("#task-project-link");
    assert.equal(await page.locator("#project-screen-title").textContent(), "Перший");
    await page.evaluate(() => openTaskDetails(tasks[0]));
    await page.click("#task-project-trigger");
    assert.equal(await page.locator("#task-project-options [role=option]").count(), 2);
    await page.locator("#task-project-options").press("Escape");
    assert.equal(await page.evaluate(() => tasks[0].projectId === projects[0].id), true);
    await page.click("#task-project-trigger");
    await page.locator("#task-project-options [role=option]", { hasText: "Другий" }).click();
    await page.waitForFunction(() => tasks[0]?.projectId === projects[1]?.id);
    assert.equal(await page.locator("#task-project-value").textContent(), "Другий");
    assert.equal(await page.locator("#task-detach-project .project-detach-icon").count(), 1);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(async () => {
      const savedTask = (await taskDb.all())[0];
      const savedProject = (await projectDb.all()).find(project => project.title === "Другий");
      return savedTask.projectId === savedProject.id && savedTask.projectPosition === 0;
    }), true);
    assert.deepEqual(errors, []);
    console.log("project reassign passed: icon navigation, dropdown, save, reload");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
