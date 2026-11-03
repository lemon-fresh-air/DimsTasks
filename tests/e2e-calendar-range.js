"use strict";
const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#add-task-btn");
    await page.click("#date-picker-open");
    const month = await page.locator("#calendar-grid button[data-date]").evaluateAll(nodes => nodes.map(node => node.dataset.date));
    assert.equal(month[0], await page.evaluate(() => localDateValue(calendarWeekStart(new Date()))));
    assert.equal(month.at(-1), await page.evaluate(() => localDateValue(calendarRangeEnd(calendarWeekStart(new Date())))));
    assert.equal(await page.evaluate(() => localDateValue(calendarWeekStart(new Date(2026, 7, 15, 12)))), "2026-08-10");
    assert.equal(await page.locator("#date-picker-open").evaluate(node => getComputedStyle(node).backgroundColor), "rgb(255, 255, 255)");
    await page.click("#calendar-next");
    assert.notEqual(await page.locator("#calendar-grid button[data-date]").last().getAttribute("data-date"), month.at(-1));
    await page.click("#date-picker-close");
    await page.click("#task-editor-back");

    await page.click("#main-menu-open");
    await page.click("#settings-open");
    for (const [mode, count] of [["3-weeks", 28], ["2-weeks", 21], ["1-week", 14]]) {
      await page.selectOption("#calendar-range-select", mode);
      await page.waitForFunction(expected => calendarRangeMode === expected, mode);
      await page.click("#settings-close");
      await page.click("#main-menu-close");
      await page.click("#add-task-btn");
      await page.click("#date-picker-open");
      assert.equal(await page.locator("#calendar-grid button[data-date]").count(), count);
      assert.equal(await page.locator("#calendar-grid button[data-date]").first().getAttribute("data-date"),
        await page.evaluate(() => localDateValue(calendarWeekStart(new Date()))));
      await page.click("#date-picker-close");
      await page.click("#task-editor-back");
      await page.click("#main-menu-open");
      await page.click("#settings-open");
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.click("#main-menu-open");
    await page.click("#settings-open");
    assert.equal(await page.locator("#calendar-range-select").inputValue(), "1-week");
    assert.deepEqual(errors, []);
    console.log("calendar range e2e passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
