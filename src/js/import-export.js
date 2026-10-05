const BACKUP_FORMAT = "local-first-pwa-backup";
const APP_ID = "dims-tasks";

function downloadBackup(tasks) {
  const payload = { format: BACKUP_FORMAT, appId: APP_ID, formatVersion: 1, databaseVersion: DB_VERSION, exportedAt: new Date().toISOString(), data: { tasks } };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dims-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function parseBackup(file) {
  const value = JSON.parse(await file.text());
  if (value?.format !== BACKUP_FORMAT || value?.appId !== APP_ID || value?.formatVersion !== 1 || !Array.isArray(value?.data?.tasks)) throw new Error("Це не резервна копія DimsTasks");
  const valid = value.data.tasks.every(task => typeof task.id === "string" && typeof task.title === "string" && typeof task.done === "boolean");
  if (!valid) throw new Error("Копія містить пошкоджені задачі");
  return value.data.tasks;
}

