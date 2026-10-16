const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.click("#nav-projects");
    for (const title of ["Перший", "Другий", "Третій"]) {
      await page.click("#project-add");
      await page.fill("#project-create-title", title);
      await page.click("#project-create-form button[type=submit]");
      await page.click("#project-back");
      await page.waitForFunction(expected => document.querySelectorAll("#active-projects .project-card").length === expected, ["Перший", "Другий", "Третій"].indexOf(title) + 1);
    }

    const cards = page.locator("#active-projects .project-card");
    const initialFirst = await cards.nth(0).boundingBox();
    await page.mouse.move(initialFirst.x + initialFirst.width / 2, initialFirst.y + initialFirst.height / 2);
    await page.mouse.down();
    await page.locator("#projects-selection-toolbar").waitFor({ state: "visible" });
    await page.mouse.up();
    await cards.nth(1).click();
    assert.equal(await page.locator("#projects-selection-count").textContent(), "Вибрано: 2");
    assert.equal(await page.locator("#active-projects .project-card.selected").count(), 2);

    const first = await cards.nth(0).boundingBox();
    const third = await cards.nth(2).boundingBox();
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(third.x + third.width / 2, third.y + third.height + 8, { steps: 5 });
    assert.equal(await page.locator(".project-drag-preview").isVisible(), true);
    assert.equal(await page.locator(".project-drag-placeholder").isVisible(), true);
    assert.equal(await page.locator(".project-drag-preview .drag-count").textContent(), "2");
    await page.mouse.up();
    await page.waitForFunction(() => [...document.querySelectorAll("#active-projects .project-card-title")].map(node => node.textContent).join("|") === "Третій|Перший|Другий");
    assert.equal(await page.locator("#project-screen").isVisible(), false);
    await page.click("#projects-selection-close");
    assert.equal(await page.locator("#projects-selection-toolbar").isVisible(), false);

    await page.reload({ waitUntil: "networkidle" });
    await page.click("#nav-projects");
    assert.deepEqual(await page.locator("#active-projects .project-card-title").allTextContents(), ["Третій", "Перший", "Другий"]);
    await page.click("#active-projects .project-card");
    assert.equal(await page.locator("#project-screen").isVisible(), true);
    await page.click("#project-back");

    const activeFirst = await page.locator("#active-projects .project-card").nth(0).boundingBox();
    await page.mouse.move(activeFirst.x + activeFirst.width / 2, activeFirst.y + activeFirst.height / 2);
    await page.mouse.down();
    await page.locator("#projects-selection-toolbar").waitFor({ state: "visible" });
    await page.mouse.up();
    await page.click("#projects-complete-selected");
    await page.locator("#project-complete-dialog").waitFor({ state: "visible" });
    assert.equal(await page.isChecked("#project-complete-tasks"), true);
    await page.click("#project-complete-yes");
    await page.waitForFunction(() => document.querySelectorAll("#active-projects .project-card").length === 2);
    assert.equal(await page.locator("#completed-project-list .project-card-title").textContent(), "Третій");
    assert.deepEqual(errors, []);
    console.log("project overview selection passed: long press, multi-select drag, cancel, persistence, open, complete");
  } finally {
    await browser.close();
  }
})();
