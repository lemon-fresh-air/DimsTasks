const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const context = vm.createContext({ crypto: { randomUUID: () => 'id' }, INBOX_LIST_ID: 'inbox' });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/js/model.js'), 'utf8') + '\nthis.api={reorderProjectSections,renameProjectSection,removeProjectSections,currentProjectTask,assignProjectTasksToSection};', context);
const { reorderProjectSections, renameProjectSection, removeProjectSections, currentProjectTask, assignProjectTasksToSection } = context.api;
const plain = value => JSON.parse(JSON.stringify(value));
const project = { id: 'p', title: 'Проєкт', goal: 'Збережена мета', projectSections: ['a','b','c','d'].map(id => ({ id, title: id.toUpperCase(), collapsed: id === 'a' })) };
const records = [
  { id: '1', projectId: 'p', projectSectionId: 'a', listId: 'work', sectionId: 'list-section', projectPosition: 3, status: 'active' },
  { id: '2', projectId: 'p', projectSectionId: 'a', listId: 'inbox', projectPosition: 0, status: 'completed', completedAt: 'old' },
  { id: '3', projectId: 'p', projectSectionId: 'b', projectPosition: 1, status: 'active' },
  { id: '4', projectId: 'other', projectSectionId: 'a', status: 'active' },
  { id: '5', projectId: 'p', projectSectionId: null, status: 'active' }
];
test('section block moves preserve relative order and all section metadata', () => {
  const result = reorderProjectSections(project, new Set(['c','a']), null, 'now');
  assert.deepEqual(Array.from(result.projectSections, item => item.id), ['b','d','a','c']);
  assert.equal(result.projectSections[2].collapsed, true);
  assert.equal(result.goal, project.goal);
  assert.equal(result.updatedAt, 'now');
  assert.deepEqual(Array.from(project.projectSections, item => item.id), ['a','b','c','d']);
  const first = reorderProjectSections(project, new Set(['d']), 'a');
  assert.deepEqual(Array.from(first.projectSections, item => item.id), ['d','a','b','c']);
});
test('invalid, empty and unchanged section moves do nothing', () => {
  for (const [ids,before] of [[[],null],[['missing'],null],[['a'],'a'],[['a'],'missing'],[['a'],'b'],[['a','b','c','d'],null]]) {
    assert.equal(reorderProjectSections(project, new Set(ids), before), project);
  }
});
test('renaming trims names, preserves links and rejects invalid or duplicate names', () => {
  const renamed = renameProjectSection(project, 'a', '  Нова назва  ', 'now');
  assert.deepEqual(plain(renamed.projectSections[0]), { id: 'a', title: 'Нова назва', collapsed: true });
  for (const title of ['', '   ', 'b', 'x'.repeat(81)]) assert.throws(() => renameProjectSection(project, 'a', title));
  assert.throws(() => renameProjectSection(project, 'missing', 'Нова назва'));
});
test('dissolving keeps active and completed tasks in their original project and lists', () => {
  const plan = removeProjectSections(project, records, new Set(['a']), false, 'now');
  assert.deepEqual(Array.from(plan.project.projectSections, section => section.id), ['b','c','d']);
  assert.deepEqual(Array.from(plan.tasks, task => task.id), ['1','2']);
  assert.deepEqual(plain(plan.tasks[0]), { ...records[0], projectSectionId: null, updatedAt: 'now' });
  assert.equal(plan.tasks[1].status, 'completed');
  assert.equal(plan.deletedTaskIds.length, 0);
  assert.equal(records[0].projectSectionId, 'a');
});
test('deleting sections removes only their own tasks, including completed tasks', () => {
  const plan = removeProjectSections(project, records, new Set(['a','b','missing']), true, 'now');
  assert.deepEqual(Array.from(plan.deletedTaskIds), ['1','2','3']);
  assert.equal(plan.tasks.length, 0);
  assert.deepEqual(Array.from(plan.project.projectSections, section => section.id), ['c','d']);
});
test('section order changes the computed current task on the project', () => {
  const active = records.filter(task => task.projectId === 'p' && task.projectSectionId && task.status === 'active');
  assert.equal(currentProjectTask(active, 'p', [project]).id, '1');
  const moved = reorderProjectSections(project, new Set(['b']), 'a');
  assert.equal(currentProjectTask(active, 'p', [moved]).id, '3');
});

test('creating a section assigns only this project tasks in visible order', () => {
  const plan = assignProjectTasksToSection(project, records, new Set(['1','3','5','4']), null, '  Нова  ', 'now');
  const section = plan.project.projectSections.at(-1);
  assert.equal(section.title, 'Нова');
  assert.equal(section.collapsed, false);
  assert.deepEqual(Array.from(plan.tasks, task => task.id), ['5','1','3']);
  assert.deepEqual(Array.from(plan.tasks, task => task.projectPosition), [0,1,2]);
  assert.ok(plan.tasks.every(task => task.projectSectionId === section.id && task.projectId === 'p'));
  assert.equal(records[0].projectSectionId, 'a');
  assert.equal(plan.project.goal, project.goal);
});
test('assignment appends a selected block to existing members without changing lists or completion', () => {
  const source = records.concat({ id: 'target', projectId: 'p', projectSectionId: 'c', projectPosition: 12, status: 'active' });
  const plan = assignProjectTasksToSection(project, source, new Set(['1','2']), 'c', '', 'now');
  assert.deepEqual(Array.from(plan.tasks, task => [task.id, task.projectPosition]), [['1',13],['2',14]]);
  assert.equal(plan.tasks[0].listId, 'work');
  assert.equal(plan.tasks[0].sectionId, 'list-section');
  assert.equal(plan.tasks[1].status, 'completed');
  assert.equal(plan.tasks[1].completedAt, 'old');
  assert.equal(plan.project.projectSections.length, 4);
  assert.equal(plan.project.projectSections.find(section => section.id === 'c').collapsed, false);
});
test('reassigning only existing members preserves positions', () => {
  const plan = assignProjectTasksToSection(project, records, new Set(['1','2']), 'a');
  assert.equal(plan.tasks.length, 0);
  assert.equal(plan.project.projectSections[0].collapsed, false);
});
test('section assignment rejects stale targets, empty selections, duplicate names and completed projects', () => {
  assert.throws(() => assignProjectTasksToSection(project, records, new Set(['4']), 'a'));
  assert.throws(() => assignProjectTasksToSection(project, records, new Set(['1']), 'missing'));
  for (const name of ['', ' ', 'b', 'x'.repeat(81)]) assert.throws(() => assignProjectTasksToSection(project, records, new Set(['1']), null, name));
  assert.throws(() => assignProjectTasksToSection({ ...project, status: 'completed' }, records, new Set(['1']), 'a'));
});
