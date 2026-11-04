const assert = require('node:assert/strict');
const { openTestApp } = require('./e2e-helper');
(async () => {
  const { browser, page, errors } = await openTestApp();
  page.setDefaultTimeout(10000);
  try {
    await page.click('#nav-projects');
    await page.click('#project-add');
    await page.fill('#project-create-title', 'Секції на КП');
    await page.click('#project-create-form button[type=submit]');
    await page.locator('#project-screen').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      const original = projects.find(project => project.id === activeProjectId);
      const project = createProject({ ...original, goal: 'Стара мета', projectSections: [{ id: 'existing', title: 'Наявна', collapsed: true }] });
      const other = createProject({ id: 'other', title: 'Інший проєкт', projectSections: [{ id: 'existing', title: 'Інша', collapsed: false }] });
      const records = [
        createTask({ id: 'a', title: 'Перше', projectId: project.id, projectPosition: 0, listId: INBOX_LIST_ID }),
        createTask({ id: 'b', title: 'Друге', projectId: project.id, projectPosition: 1, listId: INBOX_LIST_ID }),
        createTask({ id: 'c', title: 'Третє', projectId: project.id, projectPosition: 2, listId: INBOX_LIST_ID }),
        createTask({ id: 'd', title: 'Наявне', projectId: project.id, projectSectionId: 'existing', projectPosition: 5, listId: INBOX_LIST_ID }),
        createTask({ id: 'done', title: 'Завершене', projectId: project.id, projectSectionId: 'existing', projectPosition: 6, listId: INBOX_LIST_ID, status: 'completed', completedAt: new Date().toISOString() }),
        createTask({ id: 'foreign', title: 'Інше', projectId: other.id, projectSectionId: 'existing', projectPosition: 0, listId: INBOX_LIST_ID })
      ];
      await projectDb.putWithTasks(project, records);
      await projectDb.put(other);
      projects = projects.map(item => item.id === project.id ? project : item).concat(other);
      tasks = records;
      renderOpenProject();
    });
    await page.click('#project-edit-open');
    assert.equal(await page.locator('#project-section-cards').count(), 0);
    await page.click('#project-edit-close');
    await page.locator('#project-editor').waitFor({ state: 'hidden' });
    const row = id => page.locator(`#project-task-list [data-id="${id}"] .task-open`);
    const header = id => page.locator(`#project-task-list [data-project-section-toggle="${id}"]`);
    async function selectTaskByHold(id) {
      await row(id).waitFor({ state: 'visible' });
      await row(id).scrollIntoViewIfNeeded();
      const box = await row(id).boundingBox();
      await page.mouse.move(box.x + 30, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForFunction(id => selectedTaskIds.has(id), id);
      await page.mouse.up();
    }
    await selectTaskByHold('a');
    await row('b').click();
    await page.click('#project-assign-section');
    await page.fill('#project-section-name', 'Скасована');
    await page.click('#project-sections-close');
    assert.equal(await page.evaluate(() => projects.find(project => project.id === activeProjectId).projectSections.length), 1);
    await page.click('#project-assign-section');
    await page.fill('#project-section-name', 'Наявна');
    await page.click('#project-section-create button[type=submit]');
    await page.locator('#project-section-picker-error:not([hidden])').waitFor();
    await page.fill('#project-section-name', 'Нова секція');
    await page.click('#project-section-create button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('#project-sections-dialog').open);
    const createdId = await page.evaluate(() => projects.find(project => project.id === activeProjectId).projectSections.find(section => section.title === 'Нова секція').id);
    assert.equal(await page.locator(`#project-task-list [data-section-id="${createdId}"] [data-id]`).count(), 2);
    assert.equal(await page.evaluate(() => selectedTaskIds.size), 0);
    assert.equal(await page.locator('#project-selection-toolbar').isVisible(), false);
    // Existing section choice keeps its original task and appends the selected task.
    await selectTaskByHold('c');
    await page.click('#project-assign-section');
    await page.click('[data-assign-project-section="existing"]');
    await page.waitForFunction(() => !document.querySelector('#project-sections-dialog').open);
    assert.deepEqual(await page.locator('#project-task-list [data-section-id="existing"] .task-text').allTextContents(), ['Наявне','Третє']);
    assert.equal(await page.evaluate(() => tasks.find(task => task.id === 'c').listId), 'system-list-inbox');
    // Section selection, single and block drag use the actual KP headers.
    const first = await header('existing').boundingBox();
    await page.mouse.move(first.x + 30, first.y + first.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => selectedProjectSectionIds.has('existing'));
    assert.equal(await page.locator('#project-section-selection-toolbar').isVisible(), true);
    const target = await header(createdId).boundingBox();
    await page.mouse.move(target.x + 30, target.y + target.height - 1, { steps: 10 });
    await page.mouse.up();
    await page.waitForFunction(async id => (await projectDb.all()).find(project => project.id === activeProjectId).projectSections[0].id === id, createdId);
    await page.click('#project-section-rename');
    await page.fill('#project-section-rename-input', 'Скасована назва');
    await page.click('#project-section-action-cancel');
    assert.match(await header('existing').innerText(), /Наявна/);
    await page.click('#project-section-rename');
    await page.fill('#project-section-rename-input', 'Перейменована');
    await page.locator('#project-section-rename-input').press('Enter');
    await page.waitForFunction(() => !document.querySelector('#project-section-action-dialog').open);
    assert.match(await header('existing').innerText(), /Перейменована/);
    await page.click('#project-section-selection-close');
    assert.equal(await page.locator('#project-section-selection-toolbar').isVisible(), false);
    // Ordinary header taps still collapse and expand the section.
    await header(createdId).click();
    await row('a').waitFor({ state: 'hidden' });
    await header(createdId).click();
    await row('a').waitFor();
    // Existing task drag can move tasks out of a section and back into a section.
    await selectTaskByHold('b');
    const task = await row('b').boundingBox();
    const section = await header(createdId).boundingBox();
    await page.mouse.move(task.x + 30, task.y + task.height / 2);
    await page.mouse.down();
    await page.mouse.move(task.x + 30, task.y + task.height / 2 + 15, { steps: 3 });
    await page.mouse.move(section.x + 30, section.y - 8, { steps: 10 });
    await page.mouse.up();
    await page.waitForFunction(() => tasks.find(task => task.id === 'b').projectSectionId === null);
    await page.click('#project-selection-close');
    // Creation failure leaves the selected task and project untouched.
    await selectTaskByHold('b');
    await page.click('#project-assign-section');
    await page.evaluate(() => { window.originalPutWithTasks = projectDb.putWithTasks; projectDb.putWithTasks = async () => { throw new Error('Тестовий збій'); }; });
    await page.fill('#project-section-name', 'Не збережена');
    await page.click('#project-section-create button[type=submit]');
    await page.locator('#project-section-picker-error').filter({ hasText: 'Тестовий збій' }).waitFor();
    assert.equal(await page.evaluate(() => tasks.find(task => task.id === 'b').projectSectionId), null);
    assert.equal(await page.evaluate(async () => (await projectDb.all()).find(project => project.id === activeProjectId).projectSections.some(section => section.title === 'Не збережена')), false);
    await page.evaluate(() => { projectDb.putWithTasks = window.originalPutWithTasks; });
    await page.click('[data-assign-project-section="existing"]');
    await page.waitForFunction(() => !document.querySelector('#project-sections-dialog').open);
    // Add a third section through the same real task-selection flow.
    await selectTaskByHold('b');
    await page.click('#project-assign-section');
    await page.fill('#project-section-name', 'Третя секція');
    await page.click('#project-section-create button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('#project-sections-dialog').open);
    const thirdId = await page.evaluate(() => tasks.find(task => task.id === 'b').projectSectionId);
    const one = await header(createdId).boundingBox();
    await page.mouse.move(one.x + 30, one.y + one.height / 2);
    await page.mouse.down();
    await page.waitForFunction(id => selectedProjectSectionIds.has(id), createdId);
    await page.mouse.up();
    await header(thirdId).click();
    assert.equal(await page.locator('#project-section-rename').isDisabled(), true);
    const sourceBlock = await header(thirdId).boundingBox();
    const below = await header('existing').boundingBox();
    await page.mouse.move(sourceBlock.x + 30, sourceBlock.y + sourceBlock.height / 2);
    await page.mouse.down();
    await page.mouse.move(below.x + 30, below.y + below.height, { steps: 12 });
    await page.mouse.up();
    await page.waitForFunction(async () => (await projectDb.all()).find(project => project.id === activeProjectId).projectSections[0].id === 'existing');
    assert.deepEqual(await page.evaluate(() => projects.find(project => project.id === activeProjectId).projectSections.map(section => section.id)), ['existing',createdId,thirdId]);
    await page.screenshot({ path: 'D:/Downloads/dimstasks-project-sections-kp.png' });
    await page.click('#project-section-dissolve');
    await page.click('#project-section-action-cancel');
    assert.equal(await header(createdId).isVisible(), true);
    await page.click('#project-section-dissolve');
    await page.click('#project-section-action-confirm');
    await page.waitForFunction(() => !document.querySelector('#project-section-action-dialog').open);
    assert.equal(await page.evaluate(() => tasks.find(task => task.id === 'a').projectSectionId), null);
    assert.equal(await page.evaluate(() => tasks.find(task => task.id === 'b').projectSectionId), null);
    // Delete an actual section with active and completed tasks, preserving another project.
    const last = await header('existing').boundingBox();
    await page.mouse.move(last.x + 30, last.y + last.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => selectedProjectSectionIds.has('existing'));
    await page.mouse.up();
    await page.click('#project-section-delete');
    await page.click('#project-section-action-cancel');
    await page.click('#project-section-delete');
    await page.click('#project-section-action-confirm');
    await page.waitForFunction(() => !document.querySelector('#project-section-action-dialog').open);
    assert.deepEqual((await page.evaluate(async () => (await taskDb.all()).map(task => task.id))).sort(), ['a','b','foreign']);
    assert.equal(await page.evaluate(() => projects.find(project => project.id === activeProjectId).goal), 'Стара мета');
    await page.reload({ waitUntil: 'networkidle' });
    await page.click('#nav-projects');
    await page.locator('.project-card').filter({ hasText: 'Секції на КП' }).click();
    assert.deepEqual(await page.locator('#project-task-list .task-text').allTextContents(), ['Перше','Друге']);
    assert.equal(await page.locator('[data-project-section-toggle]').count(), 0);
    for (const width of [320,390,1280]) {
      await page.setViewportSize({ width, height: 844 });
      await selectTaskByHold('a');
      assert.equal(await page.locator('#project-screen').evaluate(element => element.scrollWidth <= element.clientWidth), true);
      await page.click('#project-assign-section');
      const box = await page.locator('#project-sections-dialog').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width);
      await page.click('#project-sections-close');
      await page.click('#project-selection-close');
    }
    assert.deepEqual(errors, []);
    console.log('KP sections: create/assign, validation, cancel, failed save, section and task drag, multi-selection, rename, dissolve, delete, reload, list/project isolation and 320/390/1280px: passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
