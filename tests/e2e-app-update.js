const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event("controllerchange")));
    await page.locator("#app-update:not([hidden])").waitFor();
    await Promise.all([
      page.waitForEvent("load"),
      page.locator("#app-update-reload").click()
    ]);
    assert.equal(await page.locator("#app-update").isHidden(), true);
    assert.deepEqual(errors, []);
    console.log("app update e2e passed: prompt and reload");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
