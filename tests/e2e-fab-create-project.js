const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const add = page.locator("#add-task-btn");
    const box = await add.boundingBox();
    const holdAdd = async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.locator("#fab-create-menu").waitFor({ state: "visible" });
      await page.mouse.up();
    };
    await holdAdd();
    await page.keyboard.press("Escape");
    await page.locator("#fab-create-menu").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#task-editor").isVisible(), false);
    await holdAdd();
    await page.locator("#fab-create-project").click();
    await page.locator("#project-create-form").waitFor({ state: "visible" });
    await page.locator("#project-create-title").fill("Пробний");
    await page.locator("#project-create-cancel").click();
    await page.locator("#project-create-form").waitFor({ state: "hidden" });
    assert.equal((await page.evaluate(() => projectDb.all())).length, 0);
    await page.locator("#project-add").click();
    await page.locator("#project-create-title").fill("Новий проєкт");
    await page.locator('#project-create-form button[type="submit"]').click();
    await page.locator("#project-screen").waitFor({ state: "visible" });
    assert.equal((await page.evaluate(() => projectDb.all())).length, 1);
    await page.reload();
    await page.locator("#nav-projects").click();
    await page.getByText("Новий проєкт").first().waitFor();
    assert.deepEqual(errors, []);
    console.log("FAB create project scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
