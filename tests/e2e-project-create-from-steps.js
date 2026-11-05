const assert = require('node:assert/strict');
const { openTestApp } = require('./e2e-helper');

(async () => {
  const { browser, page, errors } = await openTestApp();
  try {
    await page.evaluate(async () => {
      const source = createProject({ title: 'Джерело', position: 0 });
      const target = createProject({ title: 'Ціль', position: 1, addNewTasksFirst: true });
      const steps = ['Перший', 'Другий'].map((title, projectPosition) => createTask({ title, projectId: source.id, projectPosition }));
      const current = createTask({ title: 'Наявний', projectId: target.id, projectPosition: 0 });
      await projectDb.put(source); await projectDb.put(target); await taskDb.putMany([...steps, current]);
      projects = [source, target]; tasks = [...steps, current];
      openProject(source.id);
      selectedTaskIds = new Set(steps.map(task => task.id));
      renderOpenProject();
    });
    await page.click('#project-selection-more-trigger');
    assert.equal(await page.locator('#project-selection-more-trigger span').evaluate(dot => getComputedStyle(dot).width), '4px');
    const toolbarLayout = await page.locator('#project-selection-toolbar > .project-selection-actions').evaluate(group => {
      const buttons = [...group.querySelectorAll('.toolbar-action')].map(button => button.getBoundingClientRect());
      const toolbar = group.closest('#project-selection-toolbar').getBoundingClientRect();
      return { widths: buttons.map(rect => rect.width), gaps: buttons.slice(1).map((rect, index) => rect.left - buttons[index].right),
        centerOffset: (buttons[0].left + buttons.at(-1).right - toolbar.left - toolbar.right) / 2 };
    });
    assert.deepEqual(toolbarLayout.widths, [44, 44, 44, 44, 44]);
    assert.ok(toolbarLayout.gaps.every(gap => gap >= 11));
    assert.ok(Math.abs(toolbarLayout.centerOffset) <= 1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-selection-more-menu').isHidden(), true);
    await page.click('#project-selection-more-trigger');
    await page.click('#project-add-to-existing');
    assert.equal(await page.locator('#project-create-add-first').count(), 0);
    await page.click('#project-create-from-steps-cancel');
    assert.equal(await page.locator('#project-create-from-steps-backdrop').isHidden(), true);
    await page.click('#project-selection-more-trigger');
    await page.click('#project-add-to-existing');
    await page.selectOption('#project-create-existing-select', { label: 'Ціль' });
    await page.click('#project-create-from-steps-confirm');
    await page.waitForFunction(() => tasks.filter(task => task.projectId === projects.find(p => p.title === 'Ціль').id).length === 3);
    assert.deepEqual(await page.evaluate(() => tasks.filter(task => task.projectId === projects.find(p => p.title === 'Ціль').id).sort(compareProjectTasks).map(task => task.title)), ['Перший', 'Другий', 'Наявний']);
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual(await page.evaluate(async () => {
      const all = await taskDb.all(); const allProjects = await projectDb.all();
      return all.filter(task => task.projectId === allProjects.find(p => p.title === 'Ціль').id).sort(compareProjectTasks).map(task => task.title);
    }), ['Перший', 'Другий', 'Наявний']);
    await page.evaluate(async () => {
      const source = createProject({ title: 'Джерело 2', position: 2 });
      const target = createProject({ title: 'Ціль 2', position: 3, addNewTasksFirst: false });
      const moved = createTask({ title: 'Перенесений', projectId: source.id, projectPosition: 0 });
      const existing = createTask({ title: 'Перший у цілі', projectId: target.id, projectPosition: 0 });
      await projectDb.put(source); await projectDb.put(target); await taskDb.putMany([moved, existing]);
      projects = [...projects, source, target]; tasks = [...tasks, moved, existing];
      openProject(source.id);
      selectedTaskIds = new Set([moved.id]);
      renderOpenProject();
    });
    await page.click('#project-selection-more-trigger');
    await page.click('#project-add-to-existing');
    await page.selectOption('#project-create-existing-select', { label: 'Ціль 2' });
    await page.click('#project-create-from-steps-confirm');
    await page.waitForFunction(() => tasks.some(task => task.title === 'Перенесений' && task.projectId === projects.find(project => project.title === 'Ціль 2').id));
    assert.deepEqual(await page.evaluate(() => projectSteps(projects.find(project => project.title === 'Ціль 2').id).map(task => task.title)), ['Перший у цілі', 'Перенесений']);
    assert.deepEqual(errors, []);
    console.log('project create from steps: passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
