const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.keyboard.press("g");
    await page.keyboard.press("c");
    await page.locator("#upcoming-screen").waitFor({ state: "visible" });
    const selected = await page.locator("#upcoming-week [aria-pressed=true]").getAttribute("data-date");
    await page.locator("#upcoming-month").click();
    await page.locator("#upcoming-calendar-backdrop").waitFor({ state: "visible" });
    await page.locator("#upcoming-calendar-cancel").click();
    await page.locator("#upcoming-calendar-backdrop").waitFor({ state: "hidden" });
    await page.locator("#add-task-btn").click();
    await page.locator("#task-editor").waitFor({ state: "visible" });
    assert.equal(await page.locator("#task-date").inputValue(), selected);
    await page.locator("#task-title").fill("Перевірка Скоро");
    await page.locator("#task-form").evaluate(form => form.requestSubmit());
    await page.locator("#upcoming-feed .task-text", { hasText: "Перевірка Скоро" }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#nav-upcoming").click();
    await page.locator("#upcoming-feed .task-text", { hasText: "Перевірка Скоро" }).waitFor();
    const clickedDate = await page.evaluate(value => upcomingAdvance(value, 4), selected);
    await page.locator(`#upcoming-feed .upcoming-feed-day[data-date="${clickedDate}"] h2`).click();
    await page.waitForFunction(value => document.querySelector("#upcoming-week [aria-pressed=true]")?.dataset.date === value, clickedDate);
    await page.waitForFunction(value => {
      const feed = document.querySelector("#upcoming-feed").getBoundingClientRect();
      const day = document.querySelector(`#upcoming-feed .upcoming-feed-day[data-date="${value}"]`).getBoundingClientRect();
      return Math.abs(day.top - feed.top) < 24;
    }, clickedDate);
    await page.locator(`#upcoming-feed .upcoming-feed-day[data-date="${selected}"] h2`).click();
    await page.waitForFunction(value => {
      const feed = document.querySelector("#upcoming-feed").getBoundingClientRect();
      const day = document.querySelector(`#upcoming-feed .upcoming-feed-day[data-date="${value}"]`).getBoundingClientRect();
      return Math.abs(day.top - feed.top) < 24;
    }, selected);
    const row = page.locator("#upcoming-feed .swipe-row", { hasText: "Перевірка Скоро" });
    const source = await row.locator(".task-open").boundingBox();
    await page.mouse.move(source.x + 24, source.y + 20);
    await page.mouse.down();
    await page.locator("#upcoming-screen.selection-mode").waitFor({ state: "visible" });
    await page.mouse.up();
    await page.locator("#upcoming-more").click();
    await page.locator("#upcoming-selection").waitFor({ state: "visible" });
    await page.locator("#upcoming-more").click();
    await page.locator("#upcoming-selection").waitFor({ state: "hidden" });
    const targetDate = await page.evaluate(value => upcomingAdvance(value, 1), selected);
    const nextDay = page.locator(`#upcoming-feed .upcoming-feed-day[data-date="${targetDate}"]`);
    const target = await nextDay.locator("h2").boundingBox();
    const selectedSource = await row.locator(".task-open").boundingBox();
    await page.mouse.move(selectedSource.x + 24, selectedSource.y + 20);
    await page.mouse.down();
    await page.mouse.move(target.x + 24, target.y + 15, { steps: 8 });
    const visibleDateBeforeDrop = await page.evaluate(() => {
      const top = document.querySelector("#upcoming-feed").getBoundingClientRect().top;
      return [...document.querySelectorAll("#upcoming-feed .upcoming-feed-day")]
        .find(day => day.getBoundingClientRect().bottom > top)?.dataset.date;
    });
    await page.mouse.up();
    await page.waitForFunction(date => tasks.some(task => task.title === "Перевірка Скоро" && task.dueDate === date), targetDate);
    assert.equal(await page.locator("#upcoming-week [aria-pressed=true]").getAttribute("data-date"), selected);
    assert.equal(await page.evaluate(() => {
      const top = document.querySelector("#upcoming-feed").getBoundingClientRect().top;
      return [...document.querySelectorAll("#upcoming-feed .upcoming-feed-day")]
        .find(day => day.getBoundingClientRect().bottom > top)?.dataset.date;
    }), visibleDateBeforeDrop);
    assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Перевірка Скоро")?.dueDate), targetDate);
    assert.equal(await page.locator("#upcoming-feed .upcoming-feed-day", { hasText: "Перевірка Скоро" }).getAttribute("data-date"), targetDate);
    const dates = await page.evaluate(() => ({ future: upcomingAdvance(localDateValue(), 14), earlier: upcomingAdvance(localDateValue(), 3) }));
    await page.evaluate(async future => {
      await taskDb.put(createTask({ title: "Назад у Скоро", dueDate: future, listId: INBOX_LIST_ID }));
      await refresh();
      selectUpcomingDate(future, { animate: false });
    }, dates.future);
    const futureRow = page.locator("#upcoming-feed .swipe-row", { hasText: "Назад у Скоро" });
    const futureBox = await futureRow.locator(".task-open").boundingBox();
    await page.mouse.move(futureBox.x + 24, futureBox.y + 20);
    await page.mouse.down();
    await page.locator("#upcoming-screen.selection-mode").waitFor({ state: "visible" });
    await page.mouse.up();
    const selectedFutureBox = await futureRow.locator(".task-open").boundingBox();
    await page.mouse.move(selectedFutureBox.x + 24, selectedFutureBox.y + 20);
    await page.mouse.down();
    const feedBox = await page.locator("#upcoming-feed").boundingBox();
    await page.mouse.move(feedBox.x + 40, feedBox.y + 12, { steps: 8 });
    await page.waitForFunction(earlier => {
      const feed = document.querySelector("#upcoming-feed").getBoundingClientRect();
      const day = document.querySelector(`#upcoming-feed [data-date="${earlier}"] h2`)?.getBoundingClientRect();
      return day && day.top > feed.top + 8 && day.bottom < feed.bottom;
    }, dates.earlier);
    await page.mouse.move(feedBox.x + feedBox.width / 2, feedBox.y + feedBox.height / 2);
    const earlierBox = await page.locator(`#upcoming-feed [data-date="${dates.earlier}"] h2`).boundingBox();
    await page.mouse.move(earlierBox.x + 24, earlierBox.y + 10, { steps: 4 });
    await page.mouse.up();
    await page.waitForFunction(earlier => tasks.some(task => task.title === "Назад у Скоро" && task.dueDate === earlier), dates.earlier);
    assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Назад у Скоро")?.dueDate), dates.earlier);
    const yesterday = await page.evaluate(() => {
      selectUpcomingDate(localDateValue(), { animate: false });
      return upcomingAdvance(localDateValue(), -1);
    });
    const movedRow = page.locator("#upcoming-feed .swipe-row", { hasText: "Назад у Скоро" });
    const movedBox = await movedRow.locator(".task-open").boundingBox();
    await page.mouse.move(movedBox.x + 24, movedBox.y + 20);
    await page.mouse.down();
    await page.locator("#upcoming-screen.selection-mode").waitFor({ state: "visible" });
    await page.mouse.up();
    const selectedMovedBox = await movedRow.locator(".task-open").boundingBox();
    await page.mouse.move(selectedMovedBox.x + 24, selectedMovedBox.y + 20);
    await page.mouse.down();
    const pastFeedBox = await page.locator("#upcoming-feed").boundingBox();
    await page.mouse.move(pastFeedBox.x + 40, pastFeedBox.y + 12, { steps: 8 });
    await page.waitForFunction(date => {
      const feed = document.querySelector("#upcoming-feed").getBoundingClientRect();
      const day = document.querySelector(`#upcoming-feed [data-date="${date}"] h2`)?.getBoundingClientRect();
      return day && day.top > feed.top + 8 && day.bottom < feed.bottom;
    }, yesterday);
    await page.mouse.move(pastFeedBox.x + pastFeedBox.width / 2, pastFeedBox.y + pastFeedBox.height / 2);
    const yesterdayBox = await page.locator(`#upcoming-feed [data-date="${yesterday}"] h2`).boundingBox();
    await page.mouse.move(yesterdayBox.x + 24, yesterdayBox.y + 10, { steps: 8 });
    assert.equal(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest(".upcoming-feed-day")?.dataset.date,
      [yesterdayBox.x + 24, yesterdayBox.y + 10]), yesterday);
    await page.mouse.up();
    assert.equal(await page.evaluate(async () => (await taskDb.all()).find(task => task.title === "Назад у Скоро")?.dueDate), dates.earlier);
    await page.locator("#nav-inbox").click();
    await page.locator("#task-list .task-text", { hasText: "Перевірка Скоро" }).waitFor();
    assert.deepEqual(errors, []);
    console.log("Upcoming scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
