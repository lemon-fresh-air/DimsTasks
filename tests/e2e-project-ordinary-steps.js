const assert = require("node:assert/strict");
const { openTestApp, seedProjectSections } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Перевірка звичайних кроків");
    await page.click("#project-create-form button[type=submit]");
    await page.waitForSelector("#project-screen:not([hidden])");
    const root = page.locator(".project-root-heading");
    assert.equal(await root.locator(".list-section-label").textContent(), "Звичайні кроки");
    await page.addProjectStep("Крок без секції");
    await root.locator("[data-id]").waitFor();
    assert.equal(await root.locator("[data-id]").count(), 1);
    await root.locator("[data-project-section-toggle]").click();
    assert.equal(await root.locator("[data-project-section-toggle]").getAttribute("aria-expanded"), "false");
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    await page.locator(".project-card").first().click();
    assert.equal(await root.locator("[data-project-section-toggle]").getAttribute("aria-expanded"), "false");
    await root.locator("[data-project-section-toggle]").click();
    await seedProjectSections(page, ["Інша секція"]);
    await page.locator(".project-root-heading [data-id] .task-open").click();
    await page.selectOption("#task-project-section-select", { label: "Інша секція" });
    await page.click("#task-editor-back");
    await page.waitForFunction(() => document.querySelector(".project-section-heading:not(.project-root-heading) [data-id]"));
    assert.equal(await root.locator("[data-id]").count(), 0);
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Крок без секції").projectSectionId !== null), true);
    await page.locator(".project-section-heading:not(.project-root-heading) [data-id] .task-open").click();
    await page.selectOption("#task-project-section-select", { label: "Звичайні кроки" });
    await page.click("#task-editor-back");
    await root.locator("[data-id]").waitFor();
    assert.equal(await page.evaluate(() => tasks.find(task => task.title === "Крок без секції").projectSectionId), null);
    await root.locator(".list-section-add").click();
    await page.fill("#quick-task-title", "Ще один звичайний крок");
    await page.click("#quick-task-form button[type=submit]");
    await page.waitForFunction(() => document.querySelectorAll(".project-root-heading [data-id]").length === 2);
    assert.deepEqual(errors, []);
    console.log("ordinary project steps: passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
