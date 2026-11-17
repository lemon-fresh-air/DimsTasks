const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Перевірка секцій");
    await page.click("#project-create-form button[type=submit]");
    await page.locator("#project-screen").waitFor({ state: "visible" });

    await page.click("#project-main-create-section");
    await page.locator("#project-section-new-dialog").waitFor({ state: "visible" });
    await page.fill("#project-section-new-name", "Тимчасова");
    await page.click("#project-section-new-cancel");
    assert.equal(await page.locator("#project-task-list > .project-section-heading").count(), 1);

    await page.click("#project-main-create-section");
    await page.fill("#project-section-new-name", "Підготовка");
    await page.selectOption("#project-section-new-before", "project-root");
    await page.click("#project-section-new-form button[type=submit]");
    await page.locator("#project-section-new-dialog").waitFor({ state: "hidden" });
    assert.deepEqual(await page.locator("#project-task-list > .project-section-heading").evaluateAll(rows => rows.map(row => row.querySelector(".list-section-label").textContent)), ["Підготовка", "Звичайні кроки"]);

    await page.click("#project-main-create-section");
    await page.fill("#project-section-new-name", "Підготовка");
    await page.click("#project-section-new-form button[type=submit]");
    await page.locator("#project-section-new-error:not([hidden])").waitFor();
    assert.equal(await page.locator("#project-task-list > .project-section-heading").count(), 2);
    await page.keyboard.press("Escape");
    await page.locator("#project-section-new-dialog").waitFor({ state: "hidden" });

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator(".project-card").first().click();
    assert.deepEqual(await page.locator("#project-task-list > .project-section-heading").evaluateAll(rows => rows.map(row => row.querySelector(".list-section-label").textContent)), ["Підготовка", "Звичайні кроки"]);
    assert.equal(await page.evaluate(() => projects.find(project => project.id === activeProjectId).projectSections.length), 1);
    assert.deepEqual(errors, []);
    console.log("project section creation: cancel, position, duplicate, reload passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
