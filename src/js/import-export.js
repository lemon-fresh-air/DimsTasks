const BACKUP_FORMAT = "local-first-pwa-backup";
const APP_ID = "dims-tasks";
const BACKUP_FORMAT_VERSION = 11;
const BACKUP_MAX_BYTES = 50 * 1024 * 1024;

function backupCounts(data) { return Object.fromEntries(STORE_NAMES.map(name => [name, data[name].length])); }
function validIso(value) { return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value)); }
function validDate(value) {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\d$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function validTime(value) { return value === null || typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function validOptionalId(value) { return value === null || typeof value === "string" && value.length > 0; }
function validPosition(value) { return Number.isSafeInteger(value) && value >= 0; }
function normalizeBackupPrefix(value) {
  const cleaned = String(value || "").trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "");
  return cleaned || "Dimstasks";
}
function backupFileName(prefix, version, date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${normalizeBackupPrefix(prefix)}-${version}---${day}-${month}-${date.getFullYear()}.json`;
}

function validateBackupData(data, { strict = true } = {}) {
  if (!data || typeof data !== "object" || !STORE_NAMES.every(name => Array.isArray(data[name]))) throw new Error("Копія має неповну структуру даних");
  for (const name of STORE_NAMES) {
    const ids = new Set();
    for (const record of data[name]) {
      if (!record || typeof record !== "object" || Array.isArray(record) || typeof record.id !== "string" || !record.id || typeof record.createdAt !== "string") throw new Error(`Пошкоджений запис у «${name}»`);
      if (ids.has(record.id)) throw new Error(`Повторний id у «${name}»: ${record.id}`);
      ids.add(record.id);
      if (!strict) continue;
      if (!validIso(record.createdAt) || !validIso(record.updatedAt) || !Number.isSafeInteger(record.entityVersion) || record.entityVersion < 1 || name !== "settings" && (!record.customFields || typeof record.customFields !== "object" || Array.isArray(record.customFields))) throw new Error(`Некоректні спільні поля в «${name}»: ${record.id}`);
      if (name === "lists" && (typeof record.title !== "string" || typeof record.description !== "string" || !["inbox", "regular"].includes(record.kind) || !validPosition(record.position))) throw new Error(`Некоректний список: ${record.id}`);
      if (name === "sections" && (typeof record.listId !== "string" || typeof record.title !== "string" || typeof record.description !== "string" || !validPosition(record.position))) throw new Error(`Некоректна секція: ${record.id}`);
      if (name === "projects" && (typeof record.title !== "string" || typeof record.goal !== "string" || typeof record.description !== "string" || !["active", "completed"].includes(record.status) || !validDate(record.dueDate) || !validTime(record.dueTime) || record.dueTime && !record.dueDate || typeof record.showCountdown !== "boolean" || !validOptionalId(record.lastListId) || typeof record.addNewTasksFirst !== "boolean" || record.completedAt !== null && !validIso(record.completedAt) || !validPosition(record.position))) throw new Error(`Некоректний проєкт: ${record.id}`);
      if (name === "tasks" && (typeof record.listId !== "string" || !validOptionalId(record.sectionId) || !validOptionalId(record.projectId) || typeof record.title !== "string" || typeof record.description !== "string" || !["active", "completed", "archived"].includes(record.status) || record.completedAt !== null && !validIso(record.completedAt) || !validDate(record.dueDate) || !validTime(record.dueTime) || record.dueTime && !record.dueDate || !validPosition(record.position) || record.todayPosition !== null && !validPosition(record.todayPosition) || record.projectPosition !== null && !validPosition(record.projectPosition) || record.returnedToInboxAt !== null && !validIso(record.returnedToInboxAt))) throw new Error(`Некоректне завдання: ${record.id}`);
      if (name === "settings" && (record.id === "appearance" && !["light", "dark"].includes(record.theme) || record.id === "task-defaults" && typeof record.todayListId !== "string" || record.id === "workflow" && typeof record.returnOverdueToInbox !== "boolean" || record.id === "backup-naming" && (typeof record.prefix !== "string" || !record.prefix.trim() || !Number.isSafeInteger(record.nextVersion) || record.nextVersion < 1))) throw new Error(`Некоректне налаштування: ${record.id}`);
    }
  }
  if (!strict) return data;
  const listIds = new Set(data.lists.map(item => item.id));
  const projectIds = new Set(data.projects.map(item => item.id));
  const sections = new Map(data.sections.map(item => [item.id, item]));
  const inbox = data.lists.find(item => item.id === INBOX_LIST_ID);
  if (!inbox || inbox.kind !== "inbox" || data.lists.filter(item => item.kind === "inbox").length !== 1) throw new Error("Копія не містить коректного списку «Нові»");
  for (const section of data.sections) if (!listIds.has(section.listId) || section.listId === INBOX_LIST_ID) throw new Error(`Секція без списку: ${section.id}`);
  for (const task of data.tasks) if (!listIds.has(task.listId) || task.projectId && !projectIds.has(task.projectId) || task.sectionId && sections.get(task.sectionId)?.listId !== task.listId || task.projectId === null && task.projectPosition !== null) throw new Error(`Порушений зв’язок завдання: ${task.id}`);
  return data;
}

function mergeBackupData(local, incoming) {
  const merged = {};
  const changes = { added: 0, updated: 0, kept: 0 };
  for (const name of STORE_NAMES) {
    const records = new Map(local[name].map(record => [record.id, record]));
    for (const record of incoming[name]) {
      const existing = records.get(record.id);
      if (!existing) { records.set(record.id, record); changes.added++; }
      else if (String(record.updatedAt || "") > String(existing.updatedAt || "")) { records.set(record.id, record); changes.updated++; }
      else changes.kept++;
    }
    merged[name] = [...records.values()];
  }
  validateBackupData(merged);
  return { data: merged, changes };
}

function normalizeOlderBackup(data) {
  const lists = data.lists.map(record => createList(record));
  if (!lists.some(item => item.id === INBOX_LIST_ID)) {
    lists.unshift(createList({ id: INBOX_LIST_ID, title: "Інбокс", kind: "inbox" }));
  }
  const listIds = new Set(lists.map(item => item.id));
  const sections = data.sections.filter(item => listIds.has(item.listId) && item.listId !== INBOX_LIST_ID).map(record => createSection(record));
  const sectionById = new Map(sections.map(item => [item.id, item]));
  const projects = data.projects.map(record => createProject({ ...record,
    lastListId: listIds.has(record.lastListId) ? record.lastListId : null }));
  const projectIds = new Set(projects.map(item => item.id));
  const tasks = data.tasks.map(record => {
    const listId = listIds.has(record.listId) ? record.listId : INBOX_LIST_ID;
    const projectId = projectIds.has(record.projectId) ? record.projectId : null;
    const sectionId = sectionById.get(record.sectionId)?.listId === listId ? record.sectionId : null;
    return createTask({ ...record, listId, sectionId, projectId,
      projectPosition: projectId ? record.projectPosition : null });
  });
  const settings = data.settings.map(record => ({ ...record,
    entityVersion: record.entityVersion || 1,
    updatedAt: record.updatedAt || record.createdAt,
    customFields: record.customFields || {},
    ...(record.id === "appearance" ? { theme: record.theme === "dark" ? "dark" : "light" } : {}),
    ...(record.id === "task-defaults" ? { todayListId: listIds.has(record.todayListId) ? record.todayListId : INBOX_LIST_ID } : {}),
    ...(record.id === "workflow" ? { returnOverdueToInbox: record.returnOverdueToInbox === true } : {}),
    ...(record.id === "backup-naming" ? { prefix: normalizeBackupPrefix(record.prefix), nextVersion: Number.isSafeInteger(record.nextVersion) && record.nextVersion > 0 ? record.nextVersion : 1 } : {})
  }));
  return { lists, sections, projects, tasks, settings };
}

function completeBackupFields(data) {
  return {
    lists: data.lists.map(record => createList(record)),
    sections: data.sections.map(record => createSection(record)),
    projects: data.projects.map(record => createProject(record)),
    tasks: data.tasks.map(record => createTask(record)),
    settings: data.settings.map(record => ({ ...record, entityVersion: record.entityVersion || 1,
      updatedAt: record.updatedAt || record.createdAt }))
  };
}

async function downloadBackup(link, { prefix = "Dimstasks", version = 1 } = {}) {
  const data = validateBackupData(completeBackupFields(await appDb.exportAll()));
  const payload = { format: BACKUP_FORMAT, appId: APP_ID, formatVersion: BACKUP_FORMAT_VERSION, databaseVersion: DB_VERSION, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  if (blob.size > BACKUP_MAX_BYTES) throw new Error("Копія завелика для імпорту (понад 50 МБ)");
  const url = URL.createObjectURL(blob);
  if (link.href) URL.revokeObjectURL(link.href);
  link.href = url;
  link.download = backupFileName(prefix, version);
  link.click();
  return backupCounts(data);
}

async function readBackup(file) {
  if (file.size > BACKUP_MAX_BYTES) throw new Error("Файл завеликий (понад 50 МБ)");
  let value;
  try { value = JSON.parse(await file.text()); }
  catch (_error) { throw new Error("Не вдалося прочитати JSON-файл"); }
  if (value?.format !== BACKUP_FORMAT || value?.appId !== APP_ID) throw new Error("Це не резервна копія DimsTasks");
  const version = value.formatVersion;
  if (!Number.isSafeInteger(version) || version < 1 || version > BACKUP_FORMAT_VERSION) throw new Error("Цю версію резервної копії ще не підтримано");
  let data = value.data;
  if (version === 1 && Array.isArray(data?.tasks)) {
    if (!data.tasks.every(task => task && typeof task.id === "string" && task.id && typeof task.createdAt === "string")) throw new Error("Копія містить пошкоджені записи");
    data = { lists: [], sections: [], projects: [], tasks: data.tasks.map(task => createTask({ ...task, status: task.done ? "completed" : "active" })), settings: [] };
  }
  else if (version === 2 && ["lists", "sections", "projects", "tasks"].every(name => Array.isArray(data?.[name]))) data = { ...data, settings: [] };
  validateBackupData(data, { strict: version === BACKUP_FORMAT_VERSION });
  if (version < BACKUP_FORMAT_VERSION) data = normalizeOlderBackup(data);
  validateBackupData(data);
  return { data, formatVersion: version, exportedAt: validIso(value.exportedAt) ? value.exportedAt : null };
}
async function parseBackup(file) { return (await readBackup(file)).data; }

