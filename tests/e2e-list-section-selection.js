const assert = require('node:assert/strict');
const { openTestApp } = require('./e2e-helper');
(async () => {
  const { browser, page, errors } = await openTestApp();
  page.setDefaultTimeout(10000);
  try {
    await page.evaluate(async () => {
      const work=createList({id:'work',title:'Робота',kind:'regular',position:0});
      const home=createList({id:'home',title:'Дім',kind:'regular',position:1});
      await listDb.put(work);await listDb.put(home);
      const project=createProject({id:'p',title:'Проєкт',projectSections:[{id:'phase',title:'Етап',collapsed:false}]});
      await projectDb.put(project);
      const sectionRecords=[createSection({id:'existing',listId:'work',title:'Наявна',position:0,collapsed:true}),createSection({id:'foreign-section',listId:'home',title:'Побут',position:0})];
      const taskRecords=[
        createTask({id:'a',title:'Перше',listId:'work',position:0}),
        createTask({id:'b',title:'Друге',listId:'work',position:1}),
        createTask({id:'c',title:'Третє',listId:'work',position:2}),
        createTask({id:'step',title:'Поточний крок',listId:'work',sectionId:'existing',position:0,projectId:'p',projectSectionId:'phase',projectPosition:0}),
        createTask({id:'hidden-step',title:'Прихований крок',listId:'work',sectionId:'existing',position:1,projectId:'p',projectSectionId:'phase',projectPosition:1}),
        createTask({id:'done',title:'Завершене',listId:'work',sectionId:'existing',position:2,status:'completed',completedAt:new Date().toISOString()}),
        createTask({id:'foreign-task',title:'Інший список',listId:'home',sectionId:'foreign-section',position:0}),
        createTask({id:'inbox-task',title:'Вхідне',listId:INBOX_LIST_ID,dueDate:localDateValue(),position:0})
      ];
      await sectionDb.applyChanges({sections:sectionRecords,tasks:taskRecords});
      lists.push(work,home);projects.push(project);sections.push(...sectionRecords);tasks.push(...taskRecords);
      window.foreignSnapshot=JSON.stringify({section:sectionRecords[1],task:taskRecords.find(task=>task.id==='foreign-task'),project});
      openList('work');
    });
    const row=id=>page.locator(`#task-list [data-id="${id}"] .task-open`);
    const header=id=>page.locator(`#task-list [data-section-id="${id}"] .list-section-toggle`);
    async function holdTask(id) {
      await row(id).scrollIntoViewIfNeeded();const box=await row(id).boundingBox();
      await page.mouse.move(box.x+30,box.y+box.height/2);await page.mouse.down();
      await page.waitForFunction(id=>selectedTaskIds.has(id),id);await page.mouse.up();
    }
    async function holdSection(id) {
      await header(id).scrollIntoViewIfNeeded();const box=await header(id).boundingBox();
      await page.mouse.move(box.x+30,box.y+box.height/2);await page.mouse.down();
      await page.waitForFunction(id=>selectedListSectionIds.has(id),id);await page.mouse.up();
    }
    await page.click('#list-editor-open');
    assert.equal(await page.locator('#list-sections').count(),0);
    await page.click('#list-editor-close');
    await page.locator('#list-editor').waitFor({state:'hidden'});
    await holdTask('a');await row('b').click();
    await page.click('#list-assign-section');
    assert.deepEqual(await page.locator('#project-section-options button').allTextContents(),['Наявна']);
    await page.fill('#project-section-name','Скасована');await page.click('#project-sections-close');
    assert.equal(await page.evaluate(()=>orderedListSections().length),1);
    await page.click('#list-assign-section');await page.fill('#project-section-name','Наявна');
    await page.click('#project-section-create button');await page.locator('#project-section-picker-error:not([hidden])').waitFor();
    await page.fill('#project-section-name','Побут');await page.click('#project-section-create button');
    await page.waitForFunction(()=>!projectEls.sectionsDialog.open);
    const createdId=await page.evaluate(()=>sections.find(section=>section.listId==='work'&&section.title==='Побут').id);
    assert.equal(await page.locator(`#task-list [data-section-id="${createdId}"] [data-id]`).count(),2);
    await holdTask('c');await page.click('#list-assign-section');await page.click('[data-assign-project-section="existing"]');
    await page.waitForFunction(()=>!projectEls.sectionsDialog.open);
    await row('step').waitFor();await row('c').waitFor();
    assert.equal(await page.locator('#task-list [data-id="hidden-step"]').count(),0);
    const source=await header('existing').boundingBox();
    await page.mouse.move(source.x+30,source.y+source.height/2);await page.mouse.down();
    await page.waitForFunction(()=>selectedListSectionIds.has('existing'));
    const target=await header(createdId).boundingBox();
    await page.mouse.move(target.x+30,target.y+target.height-1,{steps:10});await page.mouse.up();
    await page.waitForFunction(async id=>(await sectionDb.all()).filter(section=>section.listId==='work').sort((a,b)=>a.position-b.position)[0].id===id,createdId);
    await page.click('#list-section-rename');await page.fill('#project-section-rename-input','Скасована назва');await page.click('#project-section-action-cancel');
    assert.match(await header('existing').innerText(),/Наявна/);
    await page.click('#list-section-rename');await page.fill('#project-section-rename-input','Перейменована');await page.locator('#project-section-rename-input').press('Enter');
    await page.waitForFunction(()=>!projectEls.sectionActionDialog.open);
    await page.click('#list-section-selection-close');
    await header(createdId).click();await row('a').waitFor({state:'hidden'});
    await header(createdId).click();await row('a').waitFor();
    // Original task drag between section and root is still available.
    await holdTask('b');const task=await row('b').boundingBox();const section=await header(createdId).boundingBox();
    await page.mouse.move(task.x+30,task.y+task.height/2);await page.mouse.down();
    await page.mouse.move(task.x+30,task.y+task.height/2+15,{steps:3});await page.mouse.move(section.x+30,section.y-8,{steps:10});await page.mouse.up();
    await page.waitForFunction(()=>tasks.find(task=>task.id==='b').sectionId===null);await page.click('#selection-close');
    await holdTask('b');await page.click('#list-assign-section');
    await page.evaluate(()=>{window.originalApplySections=sectionDb.applyChanges;sectionDb.applyChanges=async()=>{throw new Error('Тестовий збій');};});
    await page.fill('#project-section-name','Незбережена');await page.click('#project-section-create button');
    await page.locator('#project-section-picker-error').filter({hasText:'Тестовий збій'}).waitFor();
    assert.equal(await page.evaluate(async()=>(await sectionDb.all()).some(section=>section.title==='Незбережена')),false);
    assert.equal(await page.evaluate(async()=>(await taskDb.all()).find(task=>task.id==='b').sectionId),null);
    await page.evaluate(()=>{sectionDb.applyChanges=window.originalApplySections;});
    await page.fill('#project-section-name','Третя');await page.click('#project-section-create button');await page.waitForFunction(()=>!projectEls.sectionsDialog.open);
    const thirdId=await page.evaluate(()=>tasks.find(task=>task.id==='b').sectionId);
    await holdSection(createdId);await header(thirdId).click();assert.equal(await page.locator('#list-section-rename').isDisabled(),true);
    const block=await header(thirdId).boundingBox();const after=await header('existing').boundingBox();
    await page.mouse.move(block.x+30,block.y+block.height/2);await page.mouse.down();await page.mouse.move(after.x+30,after.y+after.height,{steps:12});await page.mouse.up();
    await page.waitForFunction(()=>orderedListSections()[0].id==='existing');
    assert.deepEqual(await page.evaluate(()=>orderedListSections().map(section=>section.id)),['existing',createdId,thirdId]);
    await page.screenshot({path:'D:/Downloads/dimstasks-list-sections.png'});
    await page.click('#list-section-dissolve');
    await page.waitForFunction(()=>history.state?.view?.projectSectionAction?.scope?.kind==='list');
    await page.goBack();await page.waitForFunction(()=>!projectEls.sectionActionDialog.open);
    assert.equal(await header(createdId).isVisible(),true);
    await page.click('#list-section-dissolve');await page.click('#project-section-action-confirm');await page.waitForFunction(()=>!projectEls.sectionActionDialog.open);
    assert.equal(await page.evaluate(()=>tasks.find(task=>task.id==='a').sectionId),null);
    assert.equal(await page.evaluate(()=>tasks.find(task=>task.id==='b').sectionId),null);
    assert.equal(await page.evaluate(()=>tasks.find(task=>task.id==='step').projectSectionId),'phase');
    await holdSection('existing');await page.click('#list-section-delete');
    assert.match(await page.locator('#project-section-action-description').innerText(),/завдань у них: 4/);
    await page.click('#project-section-action-cancel');await page.click('#list-section-delete');await page.click('#project-section-action-confirm');
    await page.waitForFunction(()=>!projectEls.sectionActionDialog.open);
    assert.deepEqual((await page.evaluate(async()=>(await taskDb.all()).map(task=>task.id))).sort(),['a','b','foreign-task','inbox-task']);
    assert.equal(await page.evaluate(async()=>JSON.stringify({section:(await sectionDb.all()).find(section=>section.id==='foreign-section'),task:(await taskDb.all()).find(task=>task.id==='foreign-task'),project:(await projectDb.all()).find(project=>project.id==='p')})===window.foreignSnapshot),true);
    await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>openList('work'));
    assert.deepEqual(await page.locator('#task-list .task-text').allTextContents(),['Перше','Друге']);
    assert.equal(await page.locator('#task-list > .list-section').count(),0);
    for(const width of [320,390,1280]) {
      await page.setViewportSize({width,height:844});await holdTask('a');
      assert.equal(await page.locator('.app-shell').evaluate(element=>element.scrollWidth<=element.clientWidth),true);
      await page.click('#list-assign-section');const box=await page.locator('#project-sections-dialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
      await page.click('#project-sections-close');await page.click('#selection-close');
    }
    await page.evaluate(()=>openList(INBOX_LIST_ID));await holdTask('inbox-task');
    assert.equal(await page.locator('#list-assign-section').isVisible(),false);
    await page.click('#selection-close');await page.evaluate(async()=>{openList(TODAY_LIST_ID);await syncTodayLayout();renderCurrentTasks();});await holdTask('inbox-task');
    assert.equal(await page.locator('#list-assign-section').isVisible(),false);
    assert.equal(await page.locator('#group-selected').isVisible(),true);
    assert.deepEqual(errors,[]);
    console.log('list sections: create/assign, own-list isolation, selection/drag blocks, task drag, rename, validation/cancel, failed save, browser Back, dissolve/delete incl completed and hidden project steps, reload, system lists and 320/390/1280px: passed');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
