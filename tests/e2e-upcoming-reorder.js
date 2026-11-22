const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.locator("#nav-upcoming").click();
    const { date, nextDate, first, second } = await page.evaluate(async () => {
      const date = localDateValue();
      const a = createTask({ title: "Перше", dueDate: date, dueTime: "09:00" });
      const b = createTask({ title: "Друге", dueDate: date, dueTime: "10:00" });
      await taskDb.putMany([a, b]);
      await refresh();
      return { date, nextDate: upcomingAdvance(date, 1), first: a.id, second: b.id };
    });
    const day = page.locator(`#upcoming-feed [data-date="${date}"]`);
    const row = id => day.locator(`[data-id="${id}"]`);
    const ids = () => day.locator(".swipe-row").evaluateAll(rows => rows.map(row => row.dataset.id));
    async function startDrag(id) {
      const source = row(id);
      await source.scrollIntoViewIfNeeded();
      const box = await source.locator(".task-text").boundingBox();
      await page.mouse.move(box.x + 4, box.y + box.height / 2);
      await page.mouse.down();
      await page.locator("#upcoming-screen.selection-mode").waitFor();
    }
    async function moveTo(target, fraction) {
      const box = await target.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * fraction, { steps: 6 });
    }
    assert.deepEqual(await ids(), [first, second]);
    await startDrag(first);
    await moveTo(row(second), 0.8);
    await row(second).and(page.locator(".drop-after")).waitFor();
    await day.locator(".drag-placeholder").waitFor();
    assert.equal(await day.locator(".drag-placeholder").evaluate(slot => slot.previousElementSibling.dataset.id), second);
    await page.mouse.up();
    await page.getByText("Порядок завдань збережено").waitFor();
    assert.deepEqual(await ids(), [second, first]);

    await page.reload();
    await page.locator("#nav-upcoming").click();
    await row(first).waitFor();
    assert.deepEqual(await ids(), [second, first]);
    const stored = await page.evaluate(id => appDb.get("tasks", id), first);
    assert.equal(stored.dueDate, date);
    assert.equal(stored.dueTime, "09:00");
    assert.equal(stored.customFields.upcomingOrder.position, 1);

    await startDrag(first);
    await moveTo(row(second), 0.2);
    await row(second).and(page.locator(".drop-before")).waitFor();
    await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: upcomingTaskGesture.id })));
    await page.mouse.up();
    await page.locator(".drag-preview").waitFor({ state: "detached" });
    assert.deepEqual(await ids(), [second, first]);

    await startDrag(first);
    const next = page.locator(`#upcoming-feed [data-date="${nextDate}"] h2`);
    await moveTo(next, 0.5);
    await page.mouse.up();
    await page.locator(`#upcoming-feed [data-date="${nextDate}"] [data-id="${first}"]`).waitFor();
    assert.equal(await page.evaluate(async id => (await appDb.get("tasks", id)).dueDate, first), nextDate);
    assert.deepEqual(errors, []);
    console.log("Upcoming reorder scenario passed");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
