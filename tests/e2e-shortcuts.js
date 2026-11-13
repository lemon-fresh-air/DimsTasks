const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const key = async (code, value, extra = {}) => page.evaluate(({ code, value, extra }) => {
      document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, code, key: value, ...extra }));
    }, { code, value, extra });
    await key("Slash", ",", { shiftKey: true });
    await page.locator("#keyboard-shortcuts-dialog").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.locator("#keyboard-shortcuts-dialog").waitFor({ state: "hidden" });

    await key("KeyQ", "й");
    await page.locator("#task-editor").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.locator("#task-editor").waitFor({ state: "hidden" });

    await key("KeyG", "п"); await key("KeyT", "е");
    await page.waitForFunction(() => activeListId === TODAY_LIST_ID);
    await key("KeyG", "п"); await key("KeyI", "ш");
    await page.waitForFunction(() => activeListId === INBOX_LIST_ID);
    await key("KeyG", "п"); await key("KeyP", "з");
    await page.locator("#projects-overview").waitFor({ state: "visible" });
    await page.evaluate(() => { window.shortcutUndoChecked = false; toast("Пробна дія", { action: () => { window.shortcutUndoChecked = true; }, duration: 5000 }); });
    await key("KeyZ", "я", { ctrlKey: true });
    await page.waitForFunction(() => window.shortcutUndoChecked === true);
    await page.reload({ waitUntil: "networkidle" });
    await key("KeyG", "п"); await key("KeyT", "е");
    await page.waitForFunction(() => activeListId === TODAY_LIST_ID);
    assert.deepEqual(errors, []);
    console.log("Shortcuts: help, Escape, Q, G I/T/P, Ukrainian key values, reload passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
