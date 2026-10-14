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
  return { ...baseRecord(values), ...values, title: String(values.title || "").trim(), goal: values.goal || "", description: values.description || "", status: values.status || "active", dueDate: values.dueDate || null, dueTime: values.dueDate && values.dueTime ? values.dueTime : null, completedAt: values.completedAt || null, position: Number.isFinite(values.position) ? values.position : 0 };
}
function createTask(values = {}) {
  return { ...baseRecord(values), ...values, listId: values.listId || INBOX_LIST_ID, sectionId: values.sectionId || null, projectId: values.projectId || null, title: String(values.title || "").trim(), description: values.description || "", status: values.status || "active", completedAt: values.completedAt || null, dueDate: values.dueDate || null, dueTime: values.dueDate && values.dueTime ? values.dueTime : null, position: Number.isFinite(values.position) ? values.position : 0, projectPosition: Number.isFinite(values.projectPosition) ? values.projectPosition : null, returnedToInboxAt: values.returnedToInboxAt || null };
}
function isTaskCompleted(task) { return task.status === "completed" || task.done === true; }
function isTaskOverdue(task, localDate, localTime) {
  if (!task.dueDate || task.status !== "active" || isTaskCompleted(task)) return false;
  if (task.dueDate < localDate) return true;
  return task.dueDate === localDate && Boolean(task.dueTime) && task.dueTime <= localTime;
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
function compareTasks(a, b) {
  const positionA = Number.isFinite(a.position) ? a.position : Number.MAX_SAFE_INTEGER;
  const positionB = Number.isFinite(b.position) ? b.position : Number.MAX_SAFE_INTEGER;
  return positionA - positionB || String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(a.id).localeCompare(String(b.id));
}
function compareTodayTasks(a, b) {
  return String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(a.id).localeCompare(String(b.id));
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
      normalized.push(task.position === position ? task : { ...task, position });
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
  return tasks.filter(task => task.projectId === projectId && !isTaskCompleted(task)).sort((a, b) => (a.projectPosition ?? Number.MAX_SAFE_INTEGER) - (b.projectPosition ?? Number.MAX_SAFE_INTEGER))[0] || null;
}

