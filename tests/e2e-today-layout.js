const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const seed = await page.evaluate(async () => {
      const date = localDateValue();
      const tasks = ["a", "b", "c"].map((id, index) => createTask({ id: `layout-${id}`, title: `Задача ${id}`, dueDate: date,
        createdAt: new Date(Date.now() + index).toISOString(), todayPosition: index }));
      await taskDb.putMany(tasks);
      await refresh();
      return date;
    });
    await page.evaluate(async () => changeTodayLayout((layout, visible, date) =>
      createTodayGroup(layout, visible, date, "#2D9E6B", ["layout-a", "layout-b"], "green")));
    const stored = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.equal(stored.date, seed);
    assert.deepEqual(stored.groups[0].taskIds, ["layout-a", "layout-b"]);
    assert.equal(stored.id, "today-layout");
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].taskIds, ["layout-a", "layout-b"]);
    const failedWrite = await page.evaluate(async () => {
      const original = settingsDb.saveTodayLayout;
      settingsDb.saveTodayLayout = async () => { throw new Error("Тестова помилка запису"); };
      try {
        await changeTodayLayout((layout, visible, date) => setTodayGroupCollapsed(layout, visible, date, "green", true));
        return "saved";
      } catch (error) { return error.message; }
      finally { settingsDb.saveTodayLayout = original; }
    });
    assert.equal(failedWrite, "Тестова помилка запису");
    assert.equal((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].collapsed, false);
    assert.equal(await page.evaluate(() => todayLayout.groups[0].collapsed), false);
    const changedDuringAction = await page.evaluate(async () => {
      const original = localDateValue;
      try {
        await changeTodayLayout((layout, visible, date) => {
          localDateValue = () => "2099-01-01";
          return setTodayGroupCollapsed(layout, visible, date, "green", true);
        });
        return "saved";
      } catch (error) { return error.message; }
      finally { localDateValue = original; }
    });
    assert.match(changedDuringAction, /Дата змінилася/);
    assert.equal((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].collapsed, false);
    await page.evaluate(async () => {
      const task = await appDb.get("tasks", "layout-b");
      await taskDb.put({ ...task, status: "completed", completedAt: new Date().toISOString() });
      await refresh();
    });
    assert.deepEqual((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].taskIds, ["layout-a"]);
    await page.evaluate(async () => {
      const task = await appDb.get("tasks", "layout-b");
      await taskDb.put({ ...task, status: "active", completedAt: null });
      await refresh();
    });
    const returned = await page.evaluate(() => appDb.get("settings", "today-layout"));
    assert.deepEqual(returned.groups[0].taskIds, ["layout-a"]);
    assert.equal(returned.items[0].id, "layout-b");
    await page.click("#nav-today");
    await page.getByText("Задача a", { exact: true }).waitFor();

    const backup = await page.evaluate(async () => {
      const source = await appDb.exportAll();
      const envelope = { format: BACKUP_FORMAT, appId: APP_ID, formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt: new Date().toISOString(), data: source };
      const parsed = await parseBackup({ size: 0, text: async () => JSON.stringify(envelope) });
      return { envelope, parsed };
    });
    assert.equal(backup.envelope.formatVersion, 16);
    assert.equal(backup.parsed.settings.find(item => item.id === "today-layout").groups[0].id, "green");
    await page.evaluate(async restored => { await appDb.replaceAll(restored); await initializeApp(); }, backup.parsed);
    assert.equal((await page.evaluate(() => appDb.get("settings", "today-layout"))).groups[0].id, "green");
    const invalid = structuredClone(backup.envelope);
    invalid.data.settings.find(item => item.id === "today-layout").groups[0].color = "invalid";
    const before = await page.evaluate(() => appDb.exportAll());
    const rejection = await page.evaluate(async payload => {
      try { await parseBackup({ size: 0, text: async () => JSON.stringify(payload) }); return null; }
      catch (error) { return error.message; }
    }, invalid);
    assert.match(rejection, /денне компонування/);
    assert.deepEqual(await page.evaluate(() => appDb.exportAll()), before);

    const old = structuredClone(backup.envelope);
    old.formatVersion = 14;
    old.data.settings = old.data.settings.filter(item => item.id !== "today-layout");
    const oldResult = await page.evaluate(async payload => parseBackup({ size: 0, text: async () => JSON.stringify(payload) }), old);
    assert.equal(oldResult.settings.some(item => item.id === "today-layout"), false);

    const stale = structuredClone(backup.envelope);
    stale.data.settings.find(item => item.id === "today-layout").date = "2000-01-01";
    const staleResult = await page.evaluate(async payload => parseBackup({ size: 0, text: async () => JSON.stringify(payload) }), stale);
    assert.equal(staleResult.settings.some(item => item.id === "today-layout"), false);

    await page.clock.setFixedTime(new Date(Date.now() + 86400000));
    await page.evaluate(() => checkForDateChange());
    await page.waitForFunction(async () => !(await appDb.get("settings", "today-layout")));
    const rolled = await page.evaluate(async () => {
      try { await changeTodayLayout((layout, visible, date) =>
        createTodayGroup(layout, visible, date, "#3A7BD5", ["layout-a"], "blue")); return "saved"; }
      catch (error) { return error.message; }
    });
    assert.notEqual(rolled, "saved");
    assert.equal(await page.evaluate(() => appDb.get("settings", "today-layout")), undefined);
    assert.deepEqual(errors, []);
    console.log("today-layout e2e passed: persistence, rollover, old/current/stale/invalid backups");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
