const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const date = localDateValue();
      await taskDb.putMany(["a", "b", "c"].map((id, position) => createTask({
        id: `selection-${id}`, title: `Вибір ${id}`, dueDate: date, position, todayPosition: position
      })));
      await refresh();
      const visible = visibleTodayLayoutTasks(date);
      let layout = createTodayGroup(null, visible, date, "#3A7BD5", ["selection-a"], "blue");
      layout = createTodayGroup(layout, visible, date, "#E05A3A", ["selection-b"], "orange");
      await settingsDb.saveTodayLayout(layout, date);
      await refresh();
    });
    await page.click("#nav-today");
    const headings = page.locator(".today-group-toggle");
    await headings.first().waitFor();
    await page.evaluate(() => {
      window.groupCollapseHeights = [];
      const sample = () => {
        const height = document.querySelector('.today-group[data-group-id="blue"]')?.getBoundingClientRect().height;
        if (height !== undefined) window.groupCollapseHeights.push(height);
        if (!selectedTodayGroupIds.has("blue")) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const first = await headings.first().boundingBox();
    await page.mouse.move(first.x + 24, first.y + first.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => selectedTodayGroupIds.has("blue") && todayLayout.groups.find(group => group.id === "blue")?.collapsed);
    await page.mouse.up();
    const heights = await page.evaluate(() => groupCollapseHeights);
    assert.ok(heights.every((height, index) => index === 0 || height <= heights[index - 1] + 1), "group height must not bounce at the end of collapse");
    assert.equal(await page.locator('.today-group[data-group-id="blue"] .today-group-toggle').getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('.today-group[data-group-id="blue"]').getAttribute("aria-selected"), "true");
    await page.locator('.swipe-row[data-id="selection-c"]').click();
    assert.deepEqual(await page.evaluate(() => [...selectedTaskIds]), []);
    assert.match(await page.locator("#toast").innerText(), /окремо від груп/);

    const second = await page.locator('.today-group[data-group-id="orange"] .today-group-toggle').boundingBox();
    await page.mouse.move(second.x + 24, second.y + second.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => selectedTodayGroupIds.size === 2 && todayLayout.groups.find(group => group.id === "orange")?.collapsed);
    await page.mouse.up();
    assert.equal(await page.locator("#rename-selected-group").isDisabled(), true);
    assert.equal(await page.locator("#recolor-selected-group").isDisabled(), true);
    await page.click("#selection-close");
    assert.equal(await page.evaluate(() => selectedTodayGroupIds.size), 0);

    await page.evaluate(() => selectTask("selection-c"));
    await page.locator('.today-group[data-group-id="blue"] .today-group-toggle').click();
    assert.deepEqual(await page.evaluate(() => [...selectedTaskIds]), ["selection-c"]);
    assert.equal(await page.evaluate(() => selectedTodayGroupIds.size), 0);
    assert.deepEqual(errors, []);
    console.log("Today group selection scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
