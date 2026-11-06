const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

async function swipe(page, selector, startY, pointerId, direction = "right") {
  await page.locator(selector).evaluate((element, { startY, pointerId, direction }) => {
    const startX = direction === "right" ? 50 : 170;
    const endX = direction === "right" ? 145 : 70;
    const setPointerCapture = element.setPointerCapture;
    element.setPointerCapture = () => {};
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId, pointerType: "touch", clientX: startX, clientY: startY
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId, pointerType: "touch", clientX: endX, clientY: startY + 6
    }));
    element.setPointerCapture = setPointerCapture;
  }, { startY, pointerId, direction });
}

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    await page.click("#project-add");
    await page.fill("#project-create-title", "Проєкт для свайпу");
    await page.click('#project-create-form button[type="submit"]');
    await page.waitForFunction(() => document.querySelector("#active-projects .project-card")?.textContent.includes("Проєкт для свайпу"));

    const header = await page.locator(".projects-header").boundingBox();
    await swipe(page, ".projects-header h1", header.y + 24, 1);
    await page.waitForFunction(() => document.querySelector("#main-menu").classList.contains("is-open"));
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector("#main-menu")).transform).m41 === 0);
    await swipe(page, ".main-menu-header", 70, 2, "left");
    await page.locator("#main-menu").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#projects-overview").isVisible(), true);

    const card = await page.locator("#active-projects .project-card").boundingBox();
    await swipe(page, "#active-projects .project-card", card.y + 24, 3);
    assert.equal(await page.locator("#main-menu").isHidden(), true, "card swipe must not open the menu");
    await swipe(page, "#active-projects", card.y + card.height + 6, 4);
    assert.equal(await page.locator("#main-menu").isHidden(), true, "card gap swipe must not open the menu");

    const bottom = await page.locator("#projects-swipe-zone").boundingBox();
    await swipe(page, "#projects-swipe-zone", bottom.y + 16, 5);
    await page.waitForFunction(() => document.querySelector("#main-menu").classList.contains("is-open"));
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector("#main-menu")).transform).m41 === 0);
    await swipe(page, ".main-menu-header", 70, 6, "left");
    await page.locator("#main-menu").waitFor({ state: "hidden" });
    assert.equal(await page.locator("#projects-overview").isVisible(), true);

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    assert.equal(await page.locator("#active-projects .project-card").filter({ hasText: "Проєкт для свайпу" }).count(), 1);
    await page.click("#nav-today");
    assert.equal(await page.locator("#projects-overview").isHidden(), true, "neighbouring navigation must still work");
    assert.deepEqual(errors, []);
    console.log("E2E projects menu swipe passed");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
