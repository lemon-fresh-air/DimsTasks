"use strict";

const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Завершити все");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Перший крок");
    await page.click("#project-step-form button");
    await page.waitForFunction(() => tasks.some(task => task.title === "Перший крок"));

    await page.click("#project-main-complete");
    await page.locator("#project-complete-dialog").waitFor({ state: "visible" });
    assert.equal(await page.isChecked("#project-complete-tasks"), true);
    await page.click("#project-complete-no");
    assert.equal(await page.evaluate(() => projects.find(project => project.title === "Завершити все").status), "active");

    await page.click("#project-main-complete");
    await page.click("#project-complete-yes");
    await page.waitForFunction(() => projects.find(project => project.title === "Завершити все").status === "completed");
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Перший крок").status), "completed");

    await page.click("#project-back");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Залишити крок");
    await page.click("#project-create-form button[type=submit]");
    await page.fill("#project-step-title", "Активний крок");
    await page.click("#project-step-form button");
    await page.waitForFunction(() => tasks.some(task => task.title === "Активний крок"));
    await page.click("#project-main-complete");
    await page.uncheck("#project-complete-tasks");
    await page.click("#project-complete-yes");
    await page.waitForFunction(() => projects.find(project => project.title === "Залишити крок").status === "completed");
    assert.deepEqual(await page.evaluate(() => {
      const task = tasks.find(item => item.title === "Активний крок");
      return { status: task.status, projectId: task.projectId, projectPosition: task.projectPosition, listId: task.listId };
    }), { status: "active", projectId: null, projectPosition: null, listId: "system-list-inbox" });

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-inbox");
    assert.deepEqual(await page.locator("#task-list .task-text").allTextContents(), ["Активний крок"]);
    assert.deepEqual(errors, []);
    console.log("project completion dialog passed: cancel, default complete tasks, detach active tasks, reload persistence");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
