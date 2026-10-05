const els = {
  form: document.querySelector("#task-form"), input: document.querySelector("#task-title"), list: document.querySelector("#task-list"),
  empty: document.querySelector("#empty-state"), count: document.querySelector("#task-count"), template: document.querySelector("#task-template"), toast: document.querySelector("#toast")
};

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function renderTasks(tasks, filter) {
  const visible = tasks.filter(task => filter === "all" || (filter === "done" ? task.done : !task.done));
  els.list.replaceChildren(...visible.map(task => {
    const row = els.template.content.firstElementChild.cloneNode(true);
    row.dataset.id = task.id;
    row.classList.toggle("done", task.done);
    row.querySelector(".task-text").textContent = task.title;
    row.querySelector(".toggle").setAttribute("aria-label", task.done ? "Позначити активною" : "Позначити виконаною");
    return row;
  }));
  els.empty.hidden = visible.length > 0;
  const active = tasks.filter(task => !task.done).length;
  els.count.textContent = `${active} ${active === 1 ? "активна" : "активних"}`;
}

