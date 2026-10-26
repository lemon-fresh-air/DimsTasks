const assert = require("node:assert/strict");
const { openTestApp } = require("./e2e-helper");

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    const dates = await page.evaluate(async () => {
      const today = localDateValue();
      const tomorrow = nextLocalDate();
      await taskDb.putMany([
        createTask({ id: "legacy-a", title: "Старий порядок А", dueDate: today, todayPosition: 1 }),
        createTask({ id: "legacy-b", title: "Старий порядок Б", dueDate: today, todayPosition: 0 }),
        createTask({ id: "legacy-next", title: "Стара група", dueDate: tomorrow })
      ]);
      const now = new Date().toISOString();
      await appDb.put("settings", { id: "today-layout", entityVersion: 1, date: tomorrow,
        groups: [{ id: "old-group", color: "#2D9E6B", collapsed: false, taskIds: ["legacy-next"] }],
        items: [{ type: "group", id: "old-group" }], createdAt: now, updatedAt: now });
      await appDb.delete("settings", "day-plan-migration");
      return { today, tomorrow };
    });
    await page.reload({ waitUntil: "networkidle" });
    const migrated = await page.evaluate(async () => ({
      old: await appDb.get("settings", "today-layout"),
      today: await appDb.get("settings", dayPlanId(localDateValue())),
      tomorrow: await appDb.get("settings", dayPlanId(nextLocalDate()))
    }));
    assert.equal(migrated.old, undefined);
    assert.deepEqual(migrated.today.items.map(item => item.id), ["legacy-b", "legacy-a"]);
    assert.deepEqual(migrated.tomorrow.groups[0].taskIds, ["legacy-next"]);

    const backup = await page.evaluate(async () => {
      const { blob } = await prepareBackup();
      const payload = JSON.parse(await blob.text());
      const parsed = await parseBackup({ size: blob.size, text: async () => JSON.stringify(payload) });
      return { payload, parsed };
    });
    assert.equal(backup.payload.formatVersion, 17);
    assert.equal(backup.parsed.settings.filter(item => item.id.startsWith("day-plan:")).length, 2);
    const old = structuredClone(backup.payload);
    old.formatVersion = 16;
    old.data.settings = old.data.settings.filter(item => !item.id.startsWith("day-plan:"));
    old.data.settings.push({ ...migrated.tomorrow, id: "today-layout" });
    const restored = await page.evaluate(async payload => parseBackup({ size: 0, text: async () => JSON.stringify(payload) }), old);
    assert.equal(restored.settings.find(item => item.id === `day-plan:${dates.tomorrow}`).groups[0].id, "old-group");
    const invalid = structuredClone(backup.payload);
    invalid.data.settings.find(item => item.id === `day-plan:${dates.tomorrow}`).groups[0].color = "invalid";
    const rejection = await page.evaluate(async payload => {
      try { await parseBackup({ size: 0, text: async () => JSON.stringify(payload) }); return null; }
      catch (error) { return error.message; }
    }, invalid);
    assert.match(rejection, /денний план/);
    assert.deepEqual(errors, []);
    console.log("day plan backup e2e passed: migration, export, older import, invalid rejection");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
