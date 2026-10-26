const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    assert.equal((await page.locator("#task-count").textContent()).trim(), "0 завдань");
    for (const [count, label] of [[1, "1 завдання"], [2, "2 завдання"], [5, "5 завдань"],
      [11, "11 завдань"], [21, "21 завдання"]]) {
      await page.evaluate(async target => {
        const current = (await taskDb.all()).length;
        await taskDb.putMany(Array.from({ length: target - current }, (_, index) => createTask({
          id: `term-${current + index}`, title: `Тест ${current + index}`
        })));
        await refresh();
      }, count);
      assert.equal((await page.locator("#task-count").textContent()).trim(), label);
    }
    assert.deepEqual(errors, []);
    console.log("Task terminology scenario passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
