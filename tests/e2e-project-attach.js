"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const rows = [
        createTask({ title: "Купити папір", description: "А4", listId: INBOX_LIST_ID }),
        createTask({ title: "Купити олівці", listId: INBOX_LIST_ID }),
        createTask({ title: "Інше завдання", listId: INBOX_LIST_ID }),
        createTask({ title: "Готове", status: "completed", completedAt: new Date().toISOString() })
      ];
      await taskDb.putMany(rows);
      tasks = rows;
      renderCurrentTasks();
    });
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Тестовий проєкт");
    await page.click("#project-create-form button[type=submit]");
    await page.click("#project-attach-open");
    await page.fill("#project-attach-search", "купити");
    assert.equal(await page.locator("#project-attach-results input").count(), 2);
    await page.locator("#project-attach-results input").first().check();
    await page.click("#project-attach-close");
    assert.equal(await page.locator("#project-task-list .task-text").count(), 0);
    await page.click("#project-attach-open");
    await page.fill("#project-attach-search", "купити");
    await page.locator("#project-attach-results input").first().check();
    await page.locator("#project-attach-results input").last().check();
    await page.click("#project-attach-save");
    await page.waitForFunction(() => projectSteps(activeProjectId).length === 2);
    assert.deepEqual(await page.evaluate(() => projectSteps(activeProjectId).map(task => task.projectPosition)), [0, 1]);
    assert.equal(await page.locator("#project-task-list .task-text").count(), 2);
    await page.fill("#project-step-title", "Новий крок");
    await page.click("#project-step-form button");
    await page.waitForFunction(() => projectSteps(activeProjectId).length === 3);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.click("#active-projects .project-card");
    assert.equal(await page.locator("#project-task-list .task-text").count(), 3);
    await page.click("#project-attach-open");
    assert.equal(await page.locator("#project-attach-results input").count(), 1);
    assert.deepEqual(errors, []);
    console.log("project attach passed: search, cancel, multi-select, save, reload, new step");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
