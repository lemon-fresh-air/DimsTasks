const ENTITY_VERSION = 1;
function nowIso() { return new Date().toISOString(); }
function baseRecord(values = {}) {
  const now = nowIso();
  return { id: values.id || crypto.randomUUID(), entityVersion: values.entityVersion || ENTITY_VERSION, createdAt: values.createdAt || now, updatedAt: values.updatedAt || now, customFields: values.customFields || {} };
}
function createList(values = {}) {
  return { ...baseRecord(values), ...values, title: String(values.title || "").trim(), description: values.description || "", kind: values.kind || "regular", position: Number.isFinite(values.position) ? values.position : 0 };
}
function displayListTitle(list) {
  if (list?.kind === "inbox") return "Нові";
  if (list?.kind === "today") return "Сьогодні";
  return String(list?.title || "").trim();
}
function compareLists(a, b) {
  if (a.kind === "inbox" && b.kind !== "inbox") return -1;
  if (b.kind === "inbox" && a.kind !== "inbox") return 1;
  return (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
    || String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    || String(a.id).localeCompare(String(b.id));
}
function reorderLists(records, selectedIds, beforeId) {
  const regular = records.filter(list => list.kind !== "inbox").sort(compareLists);
  const selected = regular.filter(list => selectedIds.has(list.id));
  if (!selected.length) return records;
  const remaining = regular.filter(list => !selectedIds.has(list.id));
  const insertionIndex = beforeId ? remaining.findIndex(list => list.id === beforeId) : remaining.length;
  const ordered = remaining.slice();
  ordered.splice(insertionIndex < 0 ? remaining.length : insertionIndex, 0, ...selected);
  const now = nowIso();
  const replacements = new Map(ordered.map((list, position) => [list.id,
    list.position === position ? list : { ...list, position, updatedAt: now }
  ]));
  return records.map(list => replacements.get(list.id) || list).sort(compareLists);
}
function createSection(values = {}) {
  return { ...baseRecord(values), ...values, listId: values.listId, title: String(values.title || "").trim(), description: values.description || "", position: Number.isFinite(values.position) ? values.position : 0 };
}
function createProject(values = {}) {
  return { ...baseRecord(values), ...values, title: String(values.title || "").trim(), goal: values.goal || "", description: values.description || "", status: values.status === "completed" ? "completed" : "active", dueDate: values.dueDate || null, dueTime: values.dueDate && values.dueTime ? values.dueTime : null, showCountdown: values.showCountdown === true, lastListId: typeof values.lastListId === "string" ? values.lastListId : null, defaultListId: typeof values.defaultListId === "string" ? values.defaultListId : null, addNewTasksFirst: values.addNewTasksFirst === true, completedAt: values.completedAt || null, position: Number.isFinite(values.position) ? values.position : 0 };
}
function projectFromTask(task, projectRecords) {
  if (task.status !== "active") throw new Error("Лише активне завдання можна перетворити на проєкт");
  const title = String(task.title || "").trim();
  if (!title) throw new Error("Введіть назву завдання");
  return createProject({ title, description: task.description || "", dueDate: task.dueDate || null,
    dueTime: task.dueTime || null, position: nextProjectPosition(projectRecords) });
}
function compareProjects(a, b) {
  return (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
    || String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    || String(a.id).localeCompare(String(b.id));
}
function nextProjectPosition(records) {
  const positions = records
    .filter(project => project.status !== "completed" && Number.isFinite(project.position))
    .map(project => project.position);
  return positions.length ? Math.max(...positions) + 1 : 0;
}
function reorderProjectBlock(records, selectedIds, beforeId) {
  const active = records.filter(project => project.status !== "completed")
    .sort(compareProjects);
  const selected = active.filter(project => selectedIds.has(project.id));
  if (!selected.length) return records;
  const remaining = active.filter(project => !selectedIds.has(project.id));
  const insertionIndex = beforeId ? remaining.findIndex(project => project.id === beforeId) : remaining.length;
  remaining.splice(insertionIndex < 0 ? remaining.length : insertionIndex, 0, ...selected);
  const updatedAt = nowIso();
  const replacements = new Map(remaining.map((project, position) => [project.id,
    project.position === position ? project : { ...project, position, updatedAt }
  ]));
  return records.map(project => replacements.get(project.id) || project);
}
function reorderProjects(records, movedId, beforeId) {
  return reorderProjectBlock(records, new Set([movedId]), beforeId);
}
function projectCountdown(dueDate, today) {
  if (!dueDate || !today) return null;
  const toUtcDay = value => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const days = Math.round((toUtcDay(dueDate) - toUtcDay(today)) / 86400000);
  if (days === 2) return { text: "Післязавтра", overdue: false };
  if (days === 1) return { text: "Завтра", overdue: false };
  if (days === 0) return { text: "Сьогодні", overdue: false };
  if (days === -1) return { text: "Вчора", overdue: true };
  if (days === -2) return { text: "Позавчора", overdue: true };
  if (days < -2) return { text: `Прострочено на ${Math.abs(days)} днів`, overdue: true };
  return { text: `Лишилося ${days} днів`, overdue: false };
}
function createTask(values = {}) {
  return { ...baseRecord(values), ...values, listId: values.listId || INBOX_LIST_ID, sectionId: values.sectionId || null, projectId: values.projectId || null, title: String(values.title || "").trim(), description: values.description || "", status: values.status || "active", completedAt: values.completedAt || null, dueDate: values.dueDate || null, dueTime: values.dueDate && values.dueTime ? values.dueTime : null, position: Number.isFinite(values.position) ? values.position : 0, todayPosition: Number.isSafeInteger(values.todayPosition) && values.todayPosition >= 0 ? values.todayPosition : null, projectPosition: Number.isFinite(values.projectPosition) ? values.projectPosition : null, returnedToInboxAt: values.returnedToInboxAt || null };
}
function taskFromProject(project) {
  if (project.status === "completed") throw new Error("Лише активний проєкт можна перетворити на завдання");
  const title = String(project.title || "").trim();
  if (!title) throw new Error("Введіть назву проєкту");
  return createTask({ title, description: project.description || "", dueDate: project.dueDate || null,
    dueTime: project.dueTime || null, listId: INBOX_LIST_ID, position: 0 });
}
function projectToTaskChanges(project, records, keepSteps, updatedAt) {
  const steps = records.filter(task => task.projectId === project.id);
  const deletedIds = keepSteps ? [] : steps.map(task => task.id);
  const deleted = new Set(deletedIds);
  const updates = records.filter(task => !deleted.has(task.id)).map(task => {
    const isStep = task.projectId === project.id;
    const isInboxRoot = taskOrderScope(task) === `${INBOX_LIST_ID}\u0000`;
    if (!isStep && !isInboxRoot) return task;
    return { ...task,
      ...(isStep ? { projectId: null, projectPosition: null } : {}),
      ...(isInboxRoot ? { position: (Number.isFinite(task.position) ? task.position : 0) + 1 } : {}),
      updatedAt };
  });
  return { task: taskFromProject(project), updates: updates.filter(task => !records.includes(task)), deletedIds };
}
function isTaskCompleted(task) { return task.status === "completed" || task.done === true; }
function completedTasksInRange(records, start, end) {
  return records.filter(task => task.status === "completed" && task.completedAt
    && !Number.isNaN(Date.parse(task.completedAt))
    && new Date(task.completedAt) >= start && new Date(task.completedAt) < end)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt) || String(a.id).localeCompare(String(b.id)));
}
function isTaskOverdue(task, localDate, localTime) {
  if (!task.dueDate || task.status !== "active" || isTaskCompleted(task)) return false;
  if (task.dueDate < localDate) return true;
  return task.dueDate === localDate && Boolean(task.dueTime) && task.dueTime <= localTime;
}
function isTaskDueToday(task, localDate) {
  return task.dueDate === localDate && task.status === "active" && !isTaskCompleted(task);
}
function compareOverdueTasks(a, b) {
  return String(a.dueDate || "").localeCompare(String(b.dueDate || ""))
    || String(a.dueTime || "23:59").localeCompare(String(b.dueTime || "23:59"))
    || String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    || String(a.id).localeCompare(String(b.id));
}
function returnOverdueTasksToInbox(records, { enabled, localDate, localTime, returnedAt }) {
  if (!enabled) return records;
  const returning = records.filter(task => (task.listId || INBOX_LIST_ID) !== INBOX_LIST_ID
    && !task.returnedToInboxAt && isTaskOverdue(task, localDate, localTime)).sort(compareOverdueTasks);
  if (!returning.length) return records;
  const returningIds = new Set(returning.map(task => task.id));
  const positions = new Map(returning.map((task, position) => [task.id, position]));
  const offset = returning.length;
  return records.map(task => {
    if (returningIds.has(task.id)) return { ...task, listId: INBOX_LIST_ID, sectionId: null, position: positions.get(task.id), returnedToInboxAt: returnedAt, updatedAt: returnedAt };
    if ((task.listId || INBOX_LIST_ID) === INBOX_LIST_ID && !task.sectionId) {
      return { ...task, position: (Number.isFinite(task.position) ? task.position : 0) + offset, updatedAt: returnedAt };
    }
    return task;
  });
}
function taskOrderScope(task) {
  return `${task.listId || INBOX_LIST_ID}\u0000${task.sectionId || ""}`;
}
function detachProjectTask(task, records, updatedAt) {
  if (task.status !== "active" || !task.projectId) throw new Error("Лише активний крок проєкту можна від’єднати");
  const detached = { ...task, listId: task.listId || INBOX_LIST_ID, sectionId: null, projectId: null,
    projectPosition: null, position: 0, updatedAt };
  const shifted = records.filter(item => item.id !== task.id && taskOrderScope(item) === taskOrderScope(detached))
    .map(item => ({ ...item, position: (Number.isFinite(item.position) ? item.position : 0) + 1, updatedAt }));
  return [detached, ...shifted];
}
function compareTasks(a, b) {
  const positionA = Number.isFinite(a.position) ? a.position : Number.MAX_SAFE_INTEGER;
  const positionB = Number.isFinite(b.position) ? b.position : Number.MAX_SAFE_INTEGER;
  return positionA - positionB || String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(a.id).localeCompare(String(b.id));
}
function compareTodayTasks(a, b) {
  const positionA = Number.isSafeInteger(a.todayPosition) && a.todayPosition >= 0 ? a.todayPosition : null;
  const positionB = Number.isSafeInteger(b.todayPosition) && b.todayPosition >= 0 ? b.todayPosition : null;
  if (positionA !== null || positionB !== null) {
    if (positionA === null) return -1;
    if (positionB === null) return 1;
    if (positionA !== positionB) return positionA - positionB;
  }
  return String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(a.id).localeCompare(String(b.id));
}
function reorderTodayTaskBlock(records, visible, selectedIds, beforeId) {
  const inScope = visible.slice().sort(compareTodayTasks);
  const selected = inScope.filter(task => selectedIds.has(task.id));
  if (!selected.length) return records;
  const ordered = inScope.filter(task => !selectedIds.has(task.id));
  const index = beforeId ? ordered.findIndex(task => task.id === beforeId) : ordered.length;
  ordered.splice(index < 0 ? ordered.length : index, 0, ...selected);
  const updatedAt = nowIso();
  const replacements = new Map(ordered.map((task, todayPosition) => [task.id,
    task.todayPosition === todayPosition ? task : { ...task, todayPosition, updatedAt }
  ]));
  return records.map(task => replacements.get(task.id) || task);
}
const TODAY_GROUP_COLORS = ["#E05A3A", "#3A7BD5", "#2D9E6B", "#9B59B6", "#D4A017", "#E05E87", "#607D8B"];

function isValidTodayLayoutShape(layout) {
  if (!layout || typeof layout !== "object" || Array.isArray(layout)
    || typeof layout.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(layout.date)
    || !Array.isArray(layout.groups) || !layout.groups.length || !Array.isArray(layout.items)) return false;
  const groupIds = new Set();
  const colors = new Set();
  const memberIds = new Set();
  for (const group of layout.groups) {
    if (!group || typeof group !== "object" || Array.isArray(group)
      || typeof group.id !== "string" || !group.id || groupIds.has(group.id)
      || !TODAY_GROUP_COLORS.includes(group.color) || colors.has(group.color)
      || group.title !== undefined && group.title !== null && (typeof group.title !== "string" || !group.title.trim() || group.title.length > 80)
      || typeof group.collapsed !== "boolean" || !Array.isArray(group.taskIds)) return false;
    groupIds.add(group.id);
    colors.add(group.color);
    for (const id of group.taskIds) {
      if (typeof id !== "string" || !id || memberIds.has(id)) return false;
      memberIds.add(id);
    }
  }
  const outer = new Set();
  const referencedGroups = new Set();
  for (const item of layout.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)
      || !["group", "task"].includes(item.type) || typeof item.id !== "string" || !item.id) return false;
    const key = `${item.type}\u0000${item.id}`;
    if (outer.has(key) || item.type === "task" && memberIds.has(item.id)
      || item.type === "group" && !groupIds.has(item.id)) return false;
    outer.add(key);
    if (item.type === "group") referencedGroups.add(item.id);
  }
  return groupIds.size === referencedGroups.size;
}

// null means that the ordinary todayPosition order is in effect.
function normalizeTodayGroups(layout, visible, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Некоректна локальна дата");
  if (!layout || layout.date !== date || !Array.isArray(layout.groups) || !layout.groups.length) return null;
  const orderedTasks = visible.slice().sort(compareTodayTasks);
  const visibleIds = new Set(orderedTasks.map(task => task.id));
  const groupIds = new Set();
  const colors = new Set();
  const assigned = new Set();
  const groups = [];
  for (const group of layout.groups) {
    if (!group || typeof group.id !== "string" || !group.id || groupIds.has(group.id)
      || !TODAY_GROUP_COLORS.includes(group.color) || colors.has(group.color)) continue;
    const taskIds = [];
    for (const id of Array.isArray(group.taskIds) ? group.taskIds : []) {
      if (!visibleIds.has(id) || assigned.has(id)) continue;
      assigned.add(id);
      taskIds.push(id);
    }
    if (!taskIds.length) continue;
    groupIds.add(group.id);
    colors.add(group.color);
    groups.push({ id: group.id, color: group.color, title: typeof group.title === "string" && group.title.trim() ? group.title.trim().slice(0, 80) : null,
      collapsed: group.collapsed === true, taskIds });
  }
  if (!groups.length) return null;
  const items = [];
  const seenGroups = new Set();
  const seenTasks = new Set();
  for (const item of Array.isArray(layout.items) ? layout.items : []) {
    if (item?.type === "group" && groupIds.has(item.id) && !seenGroups.has(item.id)) {
      items.push({ type: "group", id: item.id });
      seenGroups.add(item.id);
    } else if (item?.type === "task" && visibleIds.has(item.id) && !assigned.has(item.id) && !seenTasks.has(item.id)) {
      items.push({ type: "task", id: item.id });
      seenTasks.add(item.id);
    }
  }
  for (const group of groups) if (!seenGroups.has(group.id)) items.push({ type: "group", id: group.id });
  const missing = orderedTasks.filter(task => !assigned.has(task.id) && !seenTasks.has(task.id))
    .map(task => ({ type: "task", id: task.id }));
  return { date, groups, items: [...missing, ...items] };
}

function todayGroupBase(visible, date) {
  return { date, groups: [], items: visible.slice().sort(compareTodayTasks).map(task => ({ type: "task", id: task.id })) };
}

function createTodayGroup(layout, visible, date, color, selectedIds, groupId) {
  if (!TODAY_GROUP_COLORS.includes(color)) throw new Error("Невідомий колір групи");
  if (typeof groupId !== "string" || !groupId) throw new Error("Потрібен ID групи");
  const current = normalizeTodayGroups(layout, visible, date) || todayGroupBase(visible, date);
  if (current.groups.some(group => group.id === groupId || group.color === color)) throw new Error("Група або колір уже існує");
  const selected = new Set(selectedIds);
  const positions = current.items.map((item, index) => selected.has(item.id) && item.type === "task" ? index : -1).filter(index => index >= 0);
  if (!positions.length || positions.length !== selected.size) throw new Error("Виберіть видимі незгруповані задачі");
  const taskIds = positions.map(index => current.items[index].id);
  const firstId = taskIds[0];
  const items = current.items.filter(item => item.type !== "task" || !selected.has(item.id));
  const firstIndex = current.items.findIndex(item => item.type === "task" && item.id === firstId);
  const insertion = current.items.slice(0, firstIndex).filter(item => item.type !== "task" || !selected.has(item.id)).length;
  items.splice(insertion, 0, { type: "group", id: groupId });
  return { date, groups: [...current.groups, { id: groupId, color, title: null, collapsed: false, taskIds }], items };
}

function assignTodayGroupTasks(layout, visible, date, groupId, selectedIds) {
  const current = normalizeTodayGroups(layout, visible, date);
  if (!current) throw new Error("Немає денних груп");
  const target = current.groups.find(group => group.id === groupId);
  if (!target) throw new Error("Групу не знайдено");
  const selected = new Set(selectedIds);
  const visibleIds = new Set(visible.map(task => task.id));
  if ([...selected].some(id => !visibleIds.has(id))) throw new Error("Задачу не видно на Сьогодні");
  const ordered = current.items.flatMap(item => item.type === "task" ? [item.id]
    : current.groups.find(group => group.id === item.id).taskIds).filter(id => selected.has(id) && !target.taskIds.includes(id));
  return normalizeTodayGroups({ date, groups: current.groups.map(group => ({ ...group, taskIds: group.id === groupId
    ? [...group.taskIds, ...ordered] : group.taskIds.filter(id => !selected.has(id)) })),
    items: current.items.filter(item => item.type !== "task" || !selected.has(item.id)) }, visible, date);
}

function removeTodayGroupTasks(layout, visible, date, groupId, selectedIds) {
  const current = normalizeTodayGroups(layout, visible, date);
  const group = current?.groups.find(item => item.id === groupId);
  if (!group) throw new Error("Групу не знайдено");
  const selected = new Set(selectedIds);
  if ([...selected].some(id => !group.taskIds.includes(id))) throw new Error("Задачі немає в групі");
  const removed = group.taskIds.filter(id => selected.has(id));
  const groups = current.groups.map(item => item.id === groupId
    ? { ...item, taskIds: item.taskIds.filter(id => !selected.has(id)) } : item).filter(item => item.taskIds.length);
  if (!groups.length) return null;
  const ranks = new Map(visible.slice().sort(compareTodayTasks).map((task, index) => [task.id, index]));
  const byGroup = new Map(groups.map(item => [item.id, item]));
  const anchor = item => item.type === "task" ? ranks.get(item.id)
    : Math.min(...byGroup.get(item.id).taskIds.map(id => ranks.get(id)));
  const items = current.items.filter(item => item.type !== "group" || byGroup.has(item.id));
  for (const id of removed.sort((a, b) => ranks.get(a) - ranks.get(b))) {
    const index = items.findIndex(item => anchor(item) > ranks.get(id));
    items.splice(index < 0 ? items.length : index, 0, { type: "task", id });
  }
  return { date, groups, items };
}

function ungroupTodayGroup(layout, visible, date, groupId) {
  const current = normalizeTodayGroups(layout, visible, date);
  const group = current?.groups.find(item => item.id === groupId);
  if (!group) throw new Error("Групу не знайдено");
  if (current.groups.length === 1) return null;
  return { date, groups: current.groups.filter(item => item.id !== groupId),
    items: current.items.flatMap(item => item.type === "group" && item.id === groupId
      ? group.taskIds.map(id => ({ type: "task", id })) : [item]) };
}

function setTodayGroupCollapsed(layout, visible, date, groupId, collapsed) {
  const current = normalizeTodayGroups(layout, visible, date);
  if (!current?.groups.some(group => group.id === groupId)) throw new Error("Групу не знайдено");
  return { ...current, groups: current.groups.map(group => group.id === groupId ? { ...group, collapsed: Boolean(collapsed) } : group) };
}

function setTodayGroupTitle(layout, visible, date, groupId, title) {
  const current = normalizeTodayGroups(layout, visible, date);
  if (!current?.groups.some(group => group.id === groupId)) throw new Error("Групу не знайдено");
  const normalized = String(title).trim();
  if (!normalized || normalized.length > 80) throw new Error("Назва групи має містити від 1 до 80 символів");
  return { ...current, groups: current.groups.map(group => group.id === groupId ? { ...group, title: normalized } : group) };
}

function moveTodayOuterItem(layout, visible, date, type, id, beforeType = null, beforeId = null) {
  const current = normalizeTodayGroups(layout, visible, date);
  if (!current) throw new Error("Немає денних груп");
  const source = current.items.findIndex(item => item.type === type && item.id === id);
  if (source < 0 || (beforeId !== null && !current.items.some(item => item.type === beforeType && item.id === beforeId))) throw new Error("Елемент не знайдено");
  const items = current.items.slice();
  const [moved] = items.splice(source, 1);
  const target = beforeId === null ? items.length : items.findIndex(item => item.type === beforeType && item.id === beforeId);
  items.splice(target < 0 ? items.length : target, 0, moved);
  return { ...current, items };
}

function reorderTodayOuterTaskBlock(layout, visible, date, selectedIds, beforeType = null, beforeId = null) {
  const current = normalizeTodayGroups(layout, visible, date);
  if (!current) throw new Error("Немає денних груп");
  const selected = new Set(selectedIds);
  const moved = current.items.filter(item => item.type === "task" && selected.has(item.id));
  if (!moved.length) return current;
  const remaining = current.items.filter(item => item.type !== "task" || !selected.has(item.id));
  const target = beforeId === null ? remaining.length : remaining.findIndex(item => item.type === beforeType && item.id === beforeId);
  if (target < 0) throw new Error("Місце перестановки не знайдено");
  remaining.splice(target, 0, ...moved);
  return { ...current, items: remaining };
}

function shiftTodayGroupTask(layout, visible, date, groupId, taskId, direction) {
  const current = normalizeTodayGroups(layout, visible, date);
  const group = current?.groups.find(item => item.id === groupId);
  if (!group || ![-1, 1].includes(direction)) throw new Error("Некоректний зсув задачі");
  const index = group.taskIds.indexOf(taskId);
  if (index < 0) throw new Error("Задачі немає в групі");
  const taskIds = group.taskIds.slice();
  const next = index + direction;
  if (next >= 0 && next < taskIds.length) [taskIds[index], taskIds[next]] = [taskIds[next], taskIds[index]];
  return { ...current, groups: current.groups.map(item => item.id === groupId ? { ...item, taskIds } : item) };
}

function reorderTodayGroupTaskBlock(layout, visible, date, groupId, selectedIds, beforeId = null) {
  const current = normalizeTodayGroups(layout, visible, date);
  const group = current?.groups.find(item => item.id === groupId);
  if (!group) throw new Error("Групу не знайдено");
  const selected = new Set(selectedIds);
  const moved = group.taskIds.filter(id => selected.has(id));
  if (!moved.length) return current;
  const remaining = group.taskIds.filter(id => !selected.has(id));
  const index = beforeId === null ? remaining.length : remaining.indexOf(beforeId);
  if (index < 0) throw new Error("Місце перестановки не знайдено");
  remaining.splice(index, 0, ...moved);
  return { ...current, groups: current.groups.map(item => item.id === groupId ? { ...item, taskIds: remaining } : item) };
}
function normalizeTaskOrder(records) {
  const groups = new Map();
  for (const task of records) {
    const scope = taskOrderScope(task);
    if (!groups.has(scope)) groups.set(scope, []);
    groups.get(scope).push(task);
  }
  const normalized = [];
  for (const group of groups.values()) {
    group.sort(compareTasks).forEach((task, position) => {
      const hasProjectFields = Object.hasOwn(task, "projectId") && Object.hasOwn(task, "projectPosition");
      normalized.push(task.position === position && hasProjectFields ? task : {
        ...task,
        projectId: task.projectId ?? null,
        projectPosition: Number.isFinite(task.projectPosition) ? task.projectPosition : null,
        position
      });
    });
  }
  return normalized;
}
function reorderTaskBlock(records, selectedIds, beforeId, scope) {
  const inScope = records.filter(task => taskOrderScope(task) === scope).sort(compareTasks);
  const selected = inScope.filter(task => selectedIds.has(task.id));
  if (!selected.length) return records;
  const remaining = inScope.filter(task => !selectedIds.has(task.id));
  const insertionIndex = beforeId ? remaining.findIndex(task => task.id === beforeId) : remaining.length;
  const ordered = remaining.slice();
  ordered.splice(insertionIndex < 0 ? remaining.length : insertionIndex, 0, ...selected);
  const now = nowIso();
  const replacements = new Map(ordered.map((task, position) => [task.id,
    task.position === position ? task : { ...task, position, updatedAt: now }
  ]));
  return records.map(task => replacements.get(task.id) || task);
}
function currentProjectTask(tasks, projectId) {
  return tasks.filter(task => task.projectId === projectId && !isTaskCompleted(task)).sort(compareProjectTasks)[0] || null;
}
function compareProjectTasks(a, b) {
  return Number(isTaskCompleted(a)) - Number(isTaskCompleted(b))
    || (a.projectPosition ?? Number.MAX_SAFE_INTEGER) - (b.projectPosition ?? Number.MAX_SAFE_INTEGER)
    || String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    || String(a.id).localeCompare(String(b.id));
}
function visibleProjectTasks(records) {
  const currentIds = new Set(records.filter(task => task.projectId).map(task => currentProjectTask(records, task.projectId)?.id).filter(Boolean));
  return records.filter(task => !task.projectId || currentIds.has(task.id));
}
function visibleListTasks(records, listId) {
  return visibleProjectTasks(records).filter(task => (task.listId || INBOX_LIST_ID) === listId);
}
function reorderProjectSteps(records, projectId, movedId, beforeId) {
  return reorderProjectStepBlock(records, projectId, new Set([movedId]), beforeId);
}
function reorderProjectStepBlock(records, projectId, selectedIds, beforeId) {
  const steps = records.filter(task => task.projectId === projectId && !isTaskCompleted(task)).sort(compareProjectTasks);
  const selected = steps.filter(task => selectedIds.has(task.id));
  if (!selected.length) return records;
  const ordered = steps.filter(task => !selectedIds.has(task.id));
  const index = beforeId ? ordered.findIndex(task => task.id === beforeId) : ordered.length;
  ordered.splice(index < 0 ? ordered.length : index, 0, ...selected);
  const updatedAt = nowIso();
  const replacements = new Map(ordered.map((task, projectPosition) => [task.id,
    task.projectPosition === projectPosition ? task : { ...task, projectPosition, updatedAt }
  ]));
  return records.map(task => replacements.get(task.id) || task);
}

