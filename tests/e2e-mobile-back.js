const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.waitForFunction(() => history.state?.dimsTasksNavigation && history.state.index === 0);
    await page.click("#nav-projects");
    await page.waitForFunction(() => history.state?.index === 1);
    await page.click("#project-add");
    await page.fill("#project-create-title", "Перевірка назад");
    await page.click("#project-create-form button[type=submit]");
    await page.waitForFunction(() => history.state?.view.projectId && !document.querySelector("#project-screen").hidden);
    await page.click("#project-edit-open");
    await page.waitForFunction(() => history.state?.view.projectEditor);
    await page.click("#project-date-picker-open");
    await page.waitForFunction(() => history.state?.view.datePicker);
    await page.click('[data-date-shortcut="today"]');
    await page.click("#time-picker-open");
    await page.waitForFunction(() => history.state?.view.timeDialog);

    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.timeDialog && document.querySelector("#time-dialog-backdrop").hidden);
    assert.equal(await page.locator("#date-picker-backdrop").isVisible(), true);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.datePicker && document.querySelector("#date-picker-backdrop").hidden);
    assert.equal(await page.locator("#project-editor").isVisible(), true);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.projectEditor && document.querySelector("#project-editor").hidden);
    assert.equal(await page.locator("#project-screen").isVisible(), true);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.projectId && document.querySelector("#project-screen").hidden);
    assert.equal(await page.locator("#projects-overview").isVisible(), true);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => history.state?.index === 0 && !document.querySelector(".app-shell").classList.contains("projects-mode"));

    await page.click("#nav-projects");
    await page.waitForFunction(() => history.state?.view.screen === "projects");
    await page.click(".project-card");
    await page.waitForFunction(() => history.state?.view.projectId);
    await page.click("#project-back");
    await page.waitForFunction(() => !history.state?.view.projectId && document.querySelector("#project-screen").hidden);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => history.state?.dimsTasksNavigation && history.state.index === 0);
    await page.click("#main-menu-open");
    await page.waitForFunction(() => history.state?.view.menu);
    await page.click("#settings-open");
    await page.waitForFunction(() => history.state?.view.settings);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.settings && document.querySelector("#settings-open").getAttribute("aria-expanded") === "false");
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.menu && document.querySelector("#main-menu-open").getAttribute("aria-expanded") === "false");
    await page.click("#add-task-btn");
    await page.waitForFunction(() => history.state?.view.taskEditor === "new");
    await page.fill("#task-title", "Завдання для жесту");
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.taskEditor && document.querySelector("#task-editor").classList.contains("is-closing"));
    await page.waitForFunction(() => [...document.querySelectorAll("#task-list .task-text")].some(node => node.textContent === "Завдання для жесту"));
    await page.locator("#task-list .task-open").filter({ hasText: "Завдання для жесту" }).click();
    await page.waitForFunction(() => history.state?.view.taskEditor && history.state.view.taskEditor !== "new");
    await page.click("#date-picker-open");
    await page.waitForFunction(() => history.state?.view.datePicker);
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => !history.state?.view.datePicker && document.querySelector("#date-picker-backdrop").hidden);
    assert.equal(await page.locator("#task-editor").isVisible(), true);
    assert.deepEqual(errors, []);
    console.log("mobile back e2e passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
