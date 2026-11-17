const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.locator("#nav-upcoming").click();
    const week = page.locator("#upcoming-week .upcoming-day");
    assert.equal(await week.count(), 7);
    await page.locator("#upcoming-expand").click();
    assert.equal(await week.count(), 35);
    assert.equal(await page.locator("#upcoming-expand").getAttribute("aria-expanded"), "true");
    const target = await week.nth(12).getAttribute("data-date");
    await page.locator(`#upcoming-week [data-date="${target}"]`).click();
    await page.waitForFunction(date => document.querySelector(`#upcoming-feed [data-date="${date}"]`)?.classList.contains("selected-day"), target);
    assert.equal(await week.count(), 35);
    await page.locator("#upcoming-expand").click();
    assert.equal(await week.count(), 7);
    assert.equal(await page.locator("#upcoming-week [aria-pressed=true]").getAttribute("data-date"), target);

    const handle = await page.locator("#upcoming-expand").boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 5);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + 55, { steps: 5 });
    await page.mouse.up();
    assert.equal(await week.count(), 35);
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.locator("#upcoming-expand").click();
    assert.equal(await week.count(), 7);
    await page.locator("#upcoming-expand").focus();
    await page.keyboard.press("Enter");
    assert.equal(await week.count(), 35);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-upcoming").click();
    assert.equal(await week.count(), 7);
    assert.deepEqual(errors, []);
    console.log("Upcoming expand scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
