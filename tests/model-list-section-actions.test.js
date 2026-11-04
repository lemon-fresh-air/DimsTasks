const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const context = vm.createContext({ crypto: { randomUUID: () => 'new-section' }, INBOX_LIST_ID: 'inbox' });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/js/model.js'), 'utf8') + '\nthis.api={assignListTasksToSection,reorderListSections,renameListSection,removeListSections};', context);
const { assignListTasksToSection, reorderListSections, renameListSection, removeListSections } = context.api;
const list = { id: 'work', kind: 'regular' };
const sections = [
  { id:'a', listId:'work', title:'План', position:0, collapsed:false, customFields:{x:1} },
  { id:'b', listId:'work', title:'Робити', position:1, collapsed:true },
  { id:'c', listId:'work', title:'Далі', position:2, collapsed:false },
  { id:'foreign', listId:'home', title:'План', position:0, collapsed:false }
];
const tasks = [
  { id:'root', listId:'work', sectionId:null, position:0, status:'active' },
  { id:'a1', listId:'work', sectionId:'a', position:1, status:'active', projectId:'p', projectSectionId:'phase', projectPosition:9, dueDate:'2026-12-01' },
  { id:'a2', listId:'work', sectionId:'a', position:0, status:'completed', completedAt:'old' },
  { id:'b1', listId:'work', sectionId:'b', position:0, status:'active' },
  { id:'other', listId:'home', sectionId:'foreign', position:0, status:'active' }
];
const plain = value => JSON.parse(JSON.stringify(value));
test('list sections reorder a selected block in current order within their own list', () => {
  const plan = reorderListSections(sections, 'work', new Set(['c','a','foreign']), null, 'now');
  const updated = sections.map(section=>plan.sections.find(item=>item.id===section.id)||section).filter(section=>section.listId==='work');
  assert.deepEqual(updated.sort((a,b)=>a.position-b.position).map(section=>section.id), ['b','a','c']);
  assert.ok(plan.sections.every(section => section.listId === 'work'));
  assert.equal(plan.sections.find(section=>section.id==='a').customFields.x,1);
  assert.equal(sections[3].position,0);
});
test('empty, unknown, selected and foreign reorder targets cannot move sections', () => {
  for (const [ids,before] of [[[],null],[['foreign'],null],[['a'],'a'],[['a'],'foreign'],[['a'],'missing']]) {
    assert.equal(reorderListSections(sections,'work',new Set(ids),before).sections.length,0);
  }
});
test('rename validates within one list and preserves metadata', () => {
  const result = renameListSection(sections,'work','a','  Нове  ','now');
  assert.deepEqual(plain(result.sections[0]),{...sections[0],title:'Нове',updatedAt:'now'});
  assert.throws(()=>renameListSection(sections,'work','foreign','Нове'));
  for(const title of ['', '  ', 'робити', 'x'.repeat(81)]) assert.throws(()=>renameListSection(sections,'work','a',title));
  assert.equal(renameListSection(sections,'work','a','План').sections[0].title,'План');
});
test('creation groups selected tasks in visible order and preserves project fields and dates', () => {
  const plan = assignListTasksToSection(list,sections,tasks,new Set(['b1','a1','root']),null,'  Нова  ','now');
  assert.equal(plan.sections[0].title,'Нова');
  assert.equal(plan.sections[0].listId,'work');
  assert.equal(plan.sections[0].position,3);
  const grouped = Array.from(plan.tasks).filter(task=>task.sectionId==='new-section');
  assert.deepEqual(grouped.map(task=>task.id),['root','a1','b1']);
  assert.deepEqual(grouped.map(task=>task.position),[0,1,2]);
  const step = plan.tasks.find(task=>task.id==='a1');
  assert.equal(step.projectId,'p');assert.equal(step.projectSectionId,'phase');assert.equal(step.projectPosition,9);assert.equal(step.dueDate,'2026-12-01');
  assert.equal(tasks[1].sectionId,'a');
  assert.ok(plan.tasks.every(task=>task.listId==='work'));
});
test('existing assignment expands target and normalises affected task scopes', () => {
  const plan = assignListTasksToSection(list,sections,tasks,new Set(['root','a1']),'b','ignored','now');
  assert.equal(plan.sections[0].collapsed,false);
  const target=tasks.map(task=>plan.tasks.find(item=>item.id===task.id)||task).filter(task=>task.sectionId==='b').sort((a,b)=>a.position-b.position);
  assert.deepEqual(target.map(task=>task.id),['b1','root','a1']);
  const completed=tasks.map(task=>plan.tasks.find(item=>item.id===task.id)||task).find(task=>task.id==='a2');
  assert.equal(completed.status,'completed');
  assert.equal(completed.completedAt,'old');
  assert.equal(assignListTasksToSection(list,sections,tasks,new Set(['b1']),'b').tasks.length,0);
});
test('assignment rejects other lists, mixed selections, system lists and duplicate or invalid names', () => {
  assert.throws(()=>assignListTasksToSection(list,sections,tasks,new Set(['root']),'foreign'));
  for(const ids of [[],['other'],['root','other'],['missing']]) assert.throws(()=>assignListTasksToSection(list,sections,tasks,new Set(ids),'b'));
  for(const title of ['', ' ', 'План', 'x'.repeat(81)]) assert.throws(()=>assignListTasksToSection(list,sections,tasks,new Set(['root']),null,title));
  assert.throws(()=>assignListTasksToSection({id:'inbox',kind:'inbox'},sections,tasks,new Set(['root']),'b'));
});
test('dissolving moves active and completed members to the same list root without changing project links', () => {
  const plan = removeListSections(sections,tasks,'work',new Set(['a','foreign']),false,'now');
  assert.deepEqual(Array.from(plan.deletedSectionIds),['a']);
  assert.equal(plan.deletedTaskIds.length,0);
  assert.deepEqual(tasks.map(task=>plan.tasks.find(item=>item.id===task.id)||task).filter(task=>task.listId==='work'&&task.sectionId===null).sort((a,b)=>a.position-b.position).map(task=>task.id),['root','a1','a2']);
  const step=plan.tasks.find(task=>task.id==='a1');assert.equal(step.projectId,'p');assert.equal(step.projectSectionId,'phase');
  assert.ok(plan.tasks.every(task=>task.listId==='work'));
});
test('deleting sections includes completed and hidden project tasks, excludes all other lists', () => {
  const plan = removeListSections(sections,tasks,'work',new Set(['a','b','foreign']),true,'now');
  assert.deepEqual(Array.from(plan.deletedSectionIds),['a','b']);
  assert.deepEqual(Array.from(plan.deletedTaskIds).sort(),['a1','a2','b1']);
  assert.equal(plan.tasks.length,0);
});
