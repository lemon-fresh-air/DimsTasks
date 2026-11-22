const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.click("#desktop-settings-open");
    const download = page.waitForEvent("download", { timeout: 5000 });
    await page.click("#backup-export");
    console.log("Export:", (await download).suggestedFilename());
    console.log("State:", await page.evaluate(() => ({ busy: backupBusy, picker: typeof showDirectoryPicker, status: els.backupStatus.textContent })));
    await page.click("#backup-folder-choose");
    await page.waitForFunction(() => els.backupStatus.textContent === "Вибір папки скасовано.");
    console.log("Folder:", await page.locator("#backup-status").innerText());
    await page.click("#backup-import-open");
    await page.waitForFunction(() => !backupImportPending);
    console.log("Import:", await page.locator("#backup-status").innerText());
    await page.evaluate(() => {
      window.showDirectoryPicker = () => new Promise((_resolve, reject) => { window.cancelTestPicker = () => reject(new DOMException("Cancelled", "AbortError")); });
    });
    await page.click("#backup-import-open");
    assert.equal(await page.evaluate(() => backupImportPending && !backupBusy), true);
    assert.match(await page.locator("#backup-status").innerText(), /Відкриваємо папку/);
    await page.fill("#backup-prefix", "Edge");
    const pendingDownload = page.waitForEvent("download", { timeout: 5000 });
    await page.click("#backup-export");
    assert.match((await pendingDownload).suggestedFilename(), /^Edge-2---/);
    await page.evaluate(() => window.cancelTestPicker());
    await page.waitForFunction(() => !backupImportPending && !backupBusy);
    assert.deepEqual(errors, []);
    console.log("PASS: pending folder picker does not block export; cancellation releases import");
    console.log("Errors:", errors);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
