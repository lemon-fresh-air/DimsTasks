let tasks = [];
let currentFilter = "all";
let installPrompt;

async function refresh() {
  tasks = (await taskDb.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  renderTasks(tasks, currentFilter);
}

els.form.addEventListener("submit", async event => {
  event.preventDefault();
  const title = els.input.value.trim();
  if (!title) return;
  await taskDb.put({ id: crypto.randomUUID(), title, done: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  els.form.reset();
  await refresh();
  toast("Задачу додано");
});

els.list.addEventListener("click", async event => {
  const row = event.target.closest(".task-card");
  if (!row) return;
  const task = tasks.find(item => item.id === row.dataset.id);
  if (event.target.closest(".toggle")) await taskDb.put({ ...task, done: !task.done, updatedAt: new Date().toISOString() });
  if (event.target.closest(".delete") && confirm(`Видалити «${task.title}»?`)) await taskDb.delete(task.id);
  await refresh();
});

document.querySelector(".filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  currentFilter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button));
  renderTasks(tasks, currentFilter);
});

document.querySelector("#theme-btn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("dims-theme", next);
});

document.querySelector("#export-btn").addEventListener("click", () => downloadBackup(tasks));
document.querySelector("#import-input").addEventListener("change", async event => {
  try {
    const restored = await parseBackup(event.target.files[0]);
    if (!confirm(`Замінити поточні дані та відновити ${restored.length} задач? Спершу за потреби зробіть експорт.`)) return;
    await taskDb.replaceAll(restored);
    await refresh();
    toast("Дані відновлено");
  } catch (error) { alert(error.message); }
  finally { event.target.value = ""; }
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault(); installPrompt = event; document.querySelector("#install-btn").hidden = false;
});
document.querySelector("#install-btn").addEventListener("click", async () => { await installPrompt?.prompt(); });

document.documentElement.dataset.theme = localStorage.getItem("dims-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
refresh().catch(() => toast("Не вдалося відкрити локальне сховище"));

