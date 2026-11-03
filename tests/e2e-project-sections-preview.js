const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Секції");
    await page.click("#project-create-form button[type=submit]");
    await page.click("#project-edit-open");
    await page.fill("#project-section-name", "Підготовка");
    await page.click("#project-section-create button[type=submit]");
    await page.waitForFunction(() => document.querySelectorAll("#project-task-list .project-section-heading").length === 1);
    await page.fill("#project-sections .section-name", "Підготовка роботи");
    await page.locator("#project-sections .section-name").blur();
    await page.waitForFunction(() => projects[0].projectSections[0].title === "Підготовка роботи");
    await page.click("#project-edit-close");
    assert.equal(await page.locator("#project-task-list .project-section-heading").isVisible(), true);
    assert.equal(await page.locator("#project-step-section-row").isVisible(), true);
    await page.selectOption("#project-step-section", { label: "Підготовка роботи" });
    await page.fill("#project-step-title", "Крок у секції");
    await page.click("#project-step-form button[type=submit]");
    await page.waitForFunction(() => document.querySelector("#project-task-list .project-section-heading .task-text")?.textContent === "Крок у секції");
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Крок у секції").projectSectionId === projects[0].projectSections[0].id), true);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.click(".project-card");
    assert.equal(await page.locator("#project-task-list .project-section-heading .task-text").textContent(), "Крок у секції");
    assert.equal(await page.locator("#project-preview-toggle").isChecked(), false);
    await page.click("#project-back");
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.check("#project-preview-toggle");
    await page.waitForFunction(async () => (await settingsDb.projectPreview()) === true);
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#project-preview-toggle").isChecked(), true);
    assert.deepEqual(errors, []);
    process.stdout.write("Project section and preview settings: OK\n");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
