const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

async function swipe(page, selector, { startX, startY, endX, endY, pointerId }) {
  await page.locator(selector).evaluate((element, gesture) => {
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: gesture.pointerId,
      pointerType: "touch", clientX: gesture.startX, clientY: gesture.startY
    }));
    element.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: gesture.pointerId,
      pointerType: "touch", clientX: gesture.endX, clientY: gesture.endY
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: gesture.pointerId,
      pointerType: "touch", clientX: gesture.endX, clientY: gesture.endY
    }));
  }, { startX, startY, endX, endY, pointerId });
}

async function touchStart(session, x, y) {
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
}

async function touchMove(session, x, y) {
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y, id: 1 }] });
}

async function touchEnd(session) {
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const session = await page.context().newCDPSession(page);
    await page.click("#nav-today");
    const previousHeading = await page.locator("#current-list-heading").textContent();

    await swipe(page, ".page-header", { startX: 30, startY: 130, endX: 120, endY: 170, pointerId: 51 });
    await page.waitForFunction(() => document.querySelector("#main-menu").classList.contains("is-open"));

    await swipe(page, ".main-menu-header", { startX: 330, startY: 70, endX: 245, endY: 120, pointerId: 52 });
    await page.waitForSelector("#main-menu", { state: "hidden" });
    assert.equal(await page.locator("#current-list-heading").textContent(), previousHeading, "swipe must return to the previously open list");

    await page.click("#main-menu-open");
    await page.waitForFunction(() => document.querySelector("#main-menu").classList.contains("is-open"));
    await swipe(page, ".main-menu-header", { startX: 220, startY: 60, endX: 190, endY: 150, pointerId: 53 });
    assert.equal(await page.locator("#main-menu").getAttribute("class"), "main-menu is-open", "mostly vertical movement must leave the menu open");

    for (const title of ["Перший", "Другий"]) {
      await page.click("#new-list-open");
      await page.fill("#new-list-title", title);
      await page.locator("#new-list-form").press("Enter");
      await page.waitForFunction(expected => [...document.querySelectorAll(".main-menu-item")].some(item => item.textContent.includes(expected)), title);
    }

    let first = page.locator('.main-menu-item[data-list-kind="regular"]').filter({ hasText: "Перший" });
    await first.click();
    await page.waitForSelector("#main-menu", { state: "hidden" });
    await page.click("#add-task-btn");
    await page.fill("#task-title", "Задача зі списку");
    await page.click("#task-editor-back");
    await page.waitForSelector("#task-editor", { state: "hidden" });
    await page.click("#main-menu-open");
    await page.waitForFunction(() => document.querySelector("#main-menu").classList.contains("is-open"));
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector("#main-menu")).transform).m41 === 0);
    first = page.locator('.main-menu-item[data-list-kind="regular"]').filter({ hasText: "Перший" });
    const firstBox = await first.boundingBox();
    await touchStart(session, firstBox.x + 30, firstBox.y + 30);
    await page.waitForFunction(() => document.querySelector('.main-menu-item[data-list-kind="regular"].selected')?.textContent.includes("Перший"));
    await touchEnd(session);
    await page.waitForFunction(() => !document.querySelector("#main-menu-selection-toolbar").hidden && document.querySelector("#main-menu-selection-count").textContent === "Вибрано: 1");

    const selectedBeforeSwipe = await first.boundingBox();
    await touchStart(session, 330, selectedBeforeSwipe.y + 30);
    await touchMove(session, 230, selectedBeforeSwipe.y + 55);
    await touchEnd(session);
    assert.equal(await page.locator("#main-menu").getAttribute("class"), "main-menu is-open", "swipe on a list item must not close the menu");

    const regularBeforeDrag = await page.locator('.main-menu-item[data-list-kind="regular"]').allTextContents();
    const moveToStart = regularBeforeDrag.at(-1).includes("Перший");
    const firstRegularBox = await page.locator('.main-menu-item[data-list-kind="regular"]').first().boundingBox();
    const selectedBox = await first.boundingBox();
    await touchStart(session, selectedBox.x + 30, selectedBox.y + 30);
    const targetY = moveToStart ? firstRegularBox.y + 2 : 780;
    await touchMove(session, selectedBox.x + 30, targetY + (moveToStart ? 8 : -8));
    await page.waitForFunction(() => document.querySelector("#main-menu-lists").classList.contains("dragging"));
    await touchMove(session, selectedBox.x + 30, targetY);
    await touchEnd(session);
    await page.waitForFunction(expectFirst => {
      const regular = [...document.querySelectorAll('.main-menu-item[data-list-kind="regular"]')];
      const target = expectFirst ? regular[0] : regular.at(-1);
      return target?.textContent.includes("Перший");
    }, moveToStart);

    await page.locator('.main-menu-item[data-list-kind="regular"]').filter({ hasText: "Другий" }).click();
    await page.waitForFunction(() => document.querySelector("#main-menu-selection-count").textContent === "Вибрано: 2");
    await page.click("#main-menu-delete-selected");
    await page.waitForFunction(() => !document.querySelector("#list-selection-delete-backdrop").hidden);
    await page.click("#list-selection-delete-cancel");
    assert.equal(await page.locator('.main-menu-item[data-list-kind="regular"]').count(), 2, "cancel must preserve selected lists");

    await page.click("#main-menu-delete-selected");
    await page.click("#list-selection-delete-confirm");
    await page.waitForFunction(() => document.querySelectorAll('.main-menu-item[data-list-kind="regular"]').length === 0);
    await page.click("#main-menu-close");
    await page.waitForSelector("#main-menu", { state: "hidden" });
    await page.waitForFunction(() => document.querySelector("#current-list-heading").textContent === "Нові");
    assert.equal(await page.locator("#task-list").textContent().then(text => text.includes("Задача зі списку")), true, "deleted list tasks must move to Inbox");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#task-list").textContent().then(text => text.includes("Задача зі списку")), true, "moved tasks must persist after reload");

    assert.deepEqual(errors, []);
    console.log("E2E main menu swipe passed");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
