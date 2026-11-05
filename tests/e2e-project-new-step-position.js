"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Порядок кроків");
    await page.click("#project-create-form button[type=submit]");
    await page.click("#project-edit-open");
    assert.equal(await page.isChecked("#project-add-new-first"), false);
    await page.click("#project-edit-close");

    for (const title of ["Перший", "Другий"]) {
      await page.addProjectStep(title);
      await page.waitForFunction(expected => tasks.filter(task => task.projectId === activeProjectId).length === expected, title === "Перший" ? 1 : 2);
    }
    assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Перший", "Другий"]);

    await page.addProjectStep("Третій");
    await page.waitForFunction(() => tasks.some(task => task.title === "Третій"));
    assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Перший", "Другий", "Третій"]);

    await page.click("#project-back");
    await page.waitForSelector("#projects-overview:not([hidden])");
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.click("#active-projects .project-card");
    await page.click("#project-edit-open");
    assert.equal(await page.isChecked("#project-add-new-first"), false);

    await page.check("#project-add-new-first");
    await page.waitForFunction(() => projects.find(project => project.id === activeProjectId).addNewTasksFirst === true);
    await page.click("#project-edit-close");
    await page.addProjectStep("Четвертий");
    await page.waitForFunction(() => tasks.some(task => task.title === "Четвертий"));
    assert.deepEqual(await page.locator("#project-task-list .task-text").allTextContents(), ["Четвертий", "Перший", "Другий", "Третій"]);
    assert.deepEqual(await page.evaluate(() => projectSteps(activeProjectId).map(task => [task.title, task.projectPosition, task.position])), [
      ["Четвертий", 0, 0], ["Перший", 1, 1], ["Другий", 2, 2], ["Третій", 3, 3]
    ]);
    assert.deepEqual(errors, []);
    console.log("project step placement passed: default append, first mode, reload persistence, project and list positions");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
