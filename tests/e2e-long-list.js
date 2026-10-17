const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      await taskDb.putMany(Array.from({ length: 40 }, (_, i) => createTask({ title: `Тест ${String(i).padStart(2, "0")}`, listId: INBOX_LIST_ID, position: i })));
      await refresh();
    });
    await page.waitForFunction(() => document.querySelectorAll("#task-list .swipe-row").length === 40);
    await page.evaluate(() => window.scrollTo(0, 800));
    assert.ok(await page.evaluate(() => scrollY) > 700);
    await page.evaluate(() => selectTask(tasks.find(task => task.title === "Тест 12").id));
    const card = page.locator("#task-list .task-card").nth(12);
    await card.scrollIntoViewIfNeeded();
    const start = await card.boundingBox();
    await page.mouse.move(start.x + 100, start.y + 30);
    await page.mouse.down();
    await page.mouse.move(start.x + 100, start.y + 75, { steps: 4 });
    assert.equal(await page.locator(".drag-preview").isVisible(), true);
    await page.mouse.up();
    await page.evaluate(() => window.scrollTo(0, 1200));
    assert.ok(await page.locator("#selection-toolbar").evaluate(node => node.getBoundingClientRect().top) < 50);
    await page.evaluate(() => { selectedTaskIds = new Set(); renderCurrentTasks(); });
    const touchCard = page.locator("#task-list .task-card").nth(14);
    await touchCard.scrollIntoViewIfNeeded();
    const touchBox = await touchCard.boundingBox();
    const x = touchBox.x + 100;
    const y = touchBox.y + 30;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    await page.waitForFunction(() => document.querySelector("#selection-toolbar") && !document.querySelector("#selection-toolbar").hidden);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + 45, id: 1 }] });
    assert.equal(await page.locator(".drag-preview").count(), 0);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const secondBox = await page.locator("#task-list .task-card").nth(14).boundingBox();
    const secondY = secondBox.y + 30;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: secondY, id: 2 }] });
    await page.waitForFunction(() => document.querySelector("#task-list .swipe-row.selected.lifted"));
    const originalIndex = await page.locator("#task-list .swipe-row.selected").evaluate(node => [...node.parentElement.children].indexOf(node));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: secondY + 45, id: 2 }] });
    await page.waitForFunction(() => !!document.querySelector(".drag-preview"));
    const destination = await page.locator("#task-list .task-card").nth(17).boundingBox();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: destination.y + destination.height / 2, id: 2 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(index => [...document.querySelector("#task-list").children].findIndex(node => node.classList.contains("selected")) !== index, originalIndex);
    assert.deepEqual(errors, []);
    console.log("long list passed: drag after scroll, sticky selection toolbar, no console errors");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
