const BACKUP_FORMAT = "local-first-pwa-backup";
const APP_ID = "dims-tasks";
const BACKUP_FORMAT_VERSION = 7;

async function downloadBackup() {
  const payload = { format: BACKUP_FORMAT, appId: APP_ID, formatVersion: BACKUP_FORMAT_VERSION, databaseVersion: DB_VERSION, exportedAt: new Date().toISOString(), data: await appDb.exportAll() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dims-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function isRecord(value) { return value && typeof value.id === "string" && typeof value.createdAt === "string"; }
async function parseBackup(file) {
  const value = JSON.parse(await file.text());
  if (value?.format !== BACKUP_FORMAT || value?.appId !== APP_ID) throw new Error("Це не резервна копія DimsTasks");
  if (value.formatVersion === 1 && Array.isArray(value?.data?.tasks)) {
    return { lists: [], sections: [], projects: [], tasks: value.data.tasks.map(task => createTask({ ...task, status: task.done ? "completed" : "active" })), settings: [] };
  }
  if (value.formatVersion === 2 && ["lists", "sections", "projects", "tasks"].every(name => Array.isArray(value?.data?.[name]))) {
    if (!["lists", "sections", "projects", "tasks"].every(name => value.data[name].every(isRecord))) throw new Error("Копія містить пошкоджені записи");
    return { ...value.data, settings: [] };
  }
  if (![3, 4, 5, 6, BACKUP_FORMAT_VERSION].includes(value.formatVersion)) throw new Error("Цю версію резервної копії ще не підтримано");
  if (!STORE_NAMES.every(name => Array.isArray(value?.data?.[name]))) throw new Error("Копія має неповну структуру даних");
  if (!STORE_NAMES.every(name => value.data[name].every(isRecord))) throw new Error("Копія містить пошкоджені записи");
  return value.data;
}
async function restoreBackup(file) { await appDb.replaceAll(await parseBackup(file)); }

