const ENTITY_VERSION = 1;
function nowIso() { return new Date().toISOString(); }
function baseRecord(values = {}) {
  const now = nowIso();
  return { id: values.id || crypto.randomUUID(), entityVersion: values.entityVersion || ENTITY_VERSION, createdAt: values.createdAt || now, updatedAt: values.updatedAt || now, customFields: values.customFields || {} };
}
function createList(values = {}) {
  return { ...baseRecord(values), ...values, title: String(values.title || "").trim(), description: values.description || "", kind: values.kind || "regular", position: Number.isFinite(values.position) ? values.position : 0 };
}
function createSection(values = {}) {
  return { ...baseRecord(values), ...values, listId: values.listId, title: String(values.title || "").trim(), description: values.description || "", position: Number.isFinite(values.position) ? values.position : 0 };
}
function createProject(values = {}) {
  return { ...baseRecord(values), ...values, title: String(values.title || "").trim(), goal: values.goal || "", description: values.description || "", status: values.status || "active", dueDate: values.dueDate || null, dueTime: values.dueTime || null, completedAt: values.completedAt || null, position: Number.isFinite(values.position) ? values.position : 0 };
}
function createTask(values = {}) {
  return { ...baseRecord(values), ...values, listId: values.listId || INBOX_LIST_ID, sectionId: values.sectionId || null, projectId: values.projectId || null, title: String(values.title || "").trim(), description: values.description || "", status: values.status || "active", completedAt: values.completedAt || null, dueDate: values.dueDate || null, dueTime: values.dueTime || null, position: Number.isFinite(values.position) ? values.position : 0, projectPosition: Number.isFinite(values.projectPosition) ? values.projectPosition : null };
}
function isTaskCompleted(task) { return task.status === "completed" || task.done === true; }
function currentProjectTask(tasks, projectId) {
  return tasks.filter(task => task.projectId === projectId && !isTaskCompleted(task)).sort((a, b) => (a.projectPosition ?? Number.MAX_SAFE_INTEGER) - (b.projectPosition ?? Number.MAX_SAFE_INTEGER))[0] || null;
}

