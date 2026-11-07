const assert = require("node:assert/strict");
const { openTestApp, seedProjectSections } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Видимість кроків");
    await page.click('#project-create-form button[type="submit"]');
    await page.locator("#project-screen").waitFor({ state: "visible" });
    await page.addProjectStep("Звичайний крок");
    await seedProjectSections(page, ["Інша секція"]);
    const before = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Звичайний крок"));
    await page.click("#project-edit-open");
    await page.check("#project-hide-root");
    await page.click("#project-edit-close");
    await page.waitForFunction(() => !document.querySelector(".project-root-heading"));
    assert.equal(await page.locator(".project-section-heading:not(.project-root-heading)").count(), 1);
    assert.equal(await page.locator("#project-root-visibility").getAttribute("aria-pressed"), "true");
    await page.reload();
    await page.click("#nav-projects");
    await page.locator(".project-card").first().click();
    assert.equal(await page.locator(".project-root-heading").count(), 0);
    await page.click("#project-root-visibility");
    await page.locator(".project-root-heading [data-id]").waitFor();
    const after = await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Звичайний крок"));
    assert.deepEqual(after, before);
    assert.deepEqual(errors, []);
    console.log("Project root visibility scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
