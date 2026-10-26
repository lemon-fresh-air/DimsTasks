const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    await page.locator("#check-app-update").click();
    await page.locator("#toast.show").getByText("У вас найновіша версія").waitFor();
    assert.equal(await page.locator("#check-app-update").isDisabled(), false);
    await page.evaluate(() => {
      appServiceWorkerRegistration = new EventTarget();
      appServiceWorkerRegistration.update = async function () {
        this.dispatchEvent(new Event("updatefound"));
        this.installing = {};
        return this;
      };
    });
    await page.locator("#check-app-update").click();
    await page.locator("#toast.show").getByText(/Оновлення знайдено/).waitFor();
    assert.equal(await page.locator("#check-app-update").isDisabled(), false);
    await page.locator("#toast:not(.show)").waitFor();
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
