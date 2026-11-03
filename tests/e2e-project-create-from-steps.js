const assert = require('node:assert/strict');
const { openTestApp } = require('./e2e-helper');

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const source = createProject({ title: 'Джерело', position: 0 });
      const target = createProject({ title: 'Ціль', position: 1 });
      const steps = ['Перший', 'Другий'].map((title, projectPosition) => createTask({ title, projectId: source.id, projectPosition }));
      const current = createTask({ title: 'Наявний', projectId: target.id, projectPosition: 0 });
      await projectDb.put(source); await projectDb.put(target); await taskDb.putMany([...steps, current]);
      projects = [source, target]; tasks = [...steps, current];
      openProject(source.id);
      selectedTaskIds = new Set(steps.map(task => task.id));
      renderOpenProject();
    });
    await page.click('#project-create-from-steps');
    assert.equal(await page.locator('#project-create-add-first').isChecked(), true);
    await page.click('#project-create-from-steps-cancel');
    assert.equal(await page.locator('#project-create-from-steps-backdrop').isHidden(), true);
    await page.click('#project-create-from-steps');
    await page.selectOption('#project-create-existing-select', { label: 'Ціль' });
    await page.click('#project-create-from-steps-confirm');
    await page.waitForFunction(() => tasks.filter(task => task.projectId === projects.find(p => p.title === 'Ціль').id).length === 3);
    assert.deepEqual(await page.evaluate(() => tasks.filter(task => task.projectId === projects.find(p => p.title === 'Ціль').id).sort(compareProjectTasks).map(task => task.title)), ['Перший', 'Другий', 'Наявний']);
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual(await page.evaluate(async () => {
      const all = await taskDb.all(); const allProjects = await projectDb.all();
      return all.filter(task => task.projectId === allProjects.find(p => p.title === 'Ціль').id).sort(compareProjectTasks).map(task => task.title);
    }), ['Перший', 'Другий', 'Наявний']);
    assert.deepEqual(errors, []);
    console.log('project create from steps: passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
