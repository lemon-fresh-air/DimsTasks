let projects = [];
let activeProjectId = null;
let selectedProjectIds = new Set();
let projectCompleteDialogResolve = null;
let projectCompleteDialogReturnFocus = null;
let projectDeleteDialogResolve = null;
let projectDeleteDialogReturnFocus = null;

const projectEls = {
  shell: document.querySelector(".app-shell"),
  overview: document.querySelector("#projects-overview"),
  overviewHeader: document.querySelector(".projects-header"),
  count: document.querySelector("#projects-count"),
  add: document.querySelector("#project-add"),
  createForm: document.querySelector("#project-create-form"),
  createTitle: document.querySelector("#project-create-title"),
  createCancel: document.querySelector("#project-create-cancel"),
  empty: document.querySelector("#projects-empty"),
  activeList: document.querySelector("#active-projects"),
  completed: document.querySelector("#completed-projects"),
  completedCount: document.querySelector("#completed-projects-count"),
  completedList: document.querySelector("#completed-project-list"),
  overviewSelectionToolbar: document.querySelector("#projects-selection-toolbar"),
  overviewSelectionClose: document.querySelector("#projects-selection-close"),
  overviewSelectionCount: document.querySelector("#projects-selection-count"),
  completeSelected: document.querySelector("#projects-complete-selected"),
  deleteSelectedProjects: document.querySelector("#projects-delete-selected"),
  completeDialogBackdrop: document.querySelector("#project-complete-dialog-backdrop"),
  completeDialog: document.querySelector("#project-complete-dialog"),
  completeDialogTitle: document.querySelector("#project-complete-dialog-title"),
  completeTasks: document.querySelector("#project-complete-tasks"),
  completeNo: document.querySelector("#project-complete-no"),
  completeYes: document.querySelector("#project-complete-yes"),
  deleteDialogBackdrop: document.querySelector("#project-delete-dialog-backdrop"),
  deleteDialog: document.querySelector("#project-delete-dialog"),
  deleteDialogTitle: document.querySelector("#project-delete-dialog-title"),
  deleteKeepTasks: document.querySelector("#project-delete-keep-tasks"),
  deleteNo: document.querySelector("#project-delete-no"),
  deleteYes: document.querySelector("#project-delete-yes"),
  cardTemplate: document.querySelector("#project-card-template"),
  screen: document.querySelector("#project-screen"),
  selectionToolbar: document.querySelector("#project-selection-toolbar"),
  selectionClose: document.querySelector("#project-selection-close"),
  selectionCount: document.querySelector("#project-selection-count"),
  dateSelected: document.querySelector("#project-date-selected"),
  listSelected: document.querySelector("#project-list-selected"),
  listOptions: document.querySelector("#project-list-options"),
  deleteSelected: document.querySelector("#project-delete-selected"),
  back: document.querySelector("#project-back"),
  editOpen: document.querySelector("#project-edit-open"),
  editClose: document.querySelector("#project-edit-close"),
  editor: document.querySelector("#project-editor"),
  heading: document.querySelector("#project-screen-title"),
  goalSummary: document.querySelector("#project-goal-summary"),
  descriptionSummary: document.querySelector("#project-description-summary"),
  descriptionToggle: document.querySelector("#project-description-toggle"),
  deadlineSummary: document.querySelector("#project-deadline-summary"),
  title: document.querySelector("#project-title"),
  goal: document.querySelector("#project-goal"),
  description: document.querySelector("#project-description"),
  dueDate: document.querySelector("#project-due-date"),
  dueTime: document.querySelector("#project-due-time"),
  datePickerOpen: document.querySelector("#project-date-picker-open"),
  dateLabel: document.querySelector("#project-date-label"),
  showCountdown: document.querySelector("#project-show-countdown"),
  countdown: document.querySelector("#project-countdown"),
  saveStatus: document.querySelector("#project-save-status"),
  progress: document.querySelector("#project-progress"),
  steps: document.querySelector("#project-steps"),
  tasksExpand: document.querySelector("#project-tasks-expand"),
  tasksEmpty: document.querySelector("#project-tasks-empty"),
  taskList: document.querySelector("#project-task-list"),
  stepForm: document.querySelector("#project-step-form"),
  stepTitle: document.querySelector("#project-step-title"),
  addNewFirst: document.querySelector("#project-add-new-first"),
  mainComplete: document.querySelector("#project-main-complete"),
  save: document.querySelector("#project-save"),
  complete: document.querySelector("#project-complete"),
  delete: document.querySelector("#project-delete")
};

function projectSteps(projectId) {
  return tasks.filter(task => task.projectId === projectId).sort(compareProjectTasks);
}

async function rememberProjectList(projectId, listId) {
  const project = projects.find(item => item.id === projectId);
  if (!project || project.lastListId === listId || !lists.some(list => list.id === listId)) return;
  const updated = createProject({ ...project, lastListId: listId, updatedAt: new Date().toISOString() });
  projects = projects.map(item => item.id === updated.id ? updated : item);
  try {
    await projectDb.put(updated);
  } catch (_error) {
    toast("Не вдалося запам’ятати список проєкту");
  }
}

async function rememberProjectLists(tasksToRemember, listId) {
  const projectIds = new Set(tasksToRemember.map(task => task.projectId).filter(Boolean));
  await Promise.all([...projectIds].map(projectId => rememberProjectList(projectId, listId)));
}

function renderProjectCountdown() {
  const value = projectEls.showCountdown.checked ? projectCountdown(projectEls.dueDate.value, localDateValue()) : null;
  projectEls.countdown.hidden = !value;
  projectEls.countdown.textContent = value?.text || "";
  projectEls.countdown.dataset.overdue = String(value?.overdue === true);
}

function renderProjectCard(project, container) {
  const card = projectEls.cardTemplate.content.firstElementChild.cloneNode(true);
  const steps = projectSteps(project.id);
  const completed = steps.filter(isTaskCompleted).length;
  const countdown = project.dueDate ? projectCountdown(project.dueDate, localDateValue()) : null;
  card.dataset.projectId = project.id;
  const selected = selectedProjectIds.has(project.id);
  card.classList.toggle("selected", selected);
  card.setAttribute("aria-pressed", String(selected));
  card.querySelector(".project-card-title").textContent = project.title;
  card.querySelector(".project-card-progress").textContent = `${completed}/${steps.length}`;
  const deadline = card.querySelector(".project-card-deadline");
  deadline.hidden = !countdown;
  deadline.textContent = countdown?.text || "";
  deadline.dataset.overdue = String(countdown?.overdue === true);
  container.append(card);
}

function renderProjects() {
  const active = projects.filter(project => project.status !== "completed").sort(compareProjects);
  const completed = projects.filter(project => project.status === "completed").sort((a, b) => String(b.completedAt || b.updatedAt).localeCompare(String(a.completedAt || a.updatedAt)));
  projectEls.activeList.replaceChildren();
  projectEls.completedList.replaceChildren();
  active.forEach(project => renderProjectCard(project, projectEls.activeList));
  completed.forEach(project => renderProjectCard(project, projectEls.completedList));
  selectedProjectIds = new Set(active.filter(project => selectedProjectIds.has(project.id)).map(project => project.id));
  const selectionMode = selectedProjectIds.size > 0;
  projectEls.overview.classList.toggle("selection-mode", selectionMode);
  projectEls.overviewSelectionToolbar.hidden = !selectionMode;
  projectEls.overviewHeader.hidden = selectionMode;
  projectEls.overviewSelectionCount.textContent = `Вибрано: ${selectedProjectIds.size}`;
  projectEls.count.textContent = `${active.length} активних`;
  projectEls.empty.hidden = projects.length > 0;
  projectEls.completed.hidden = completed.length === 0;
  projectEls.completedCount.textContent = completed.length;
  if (activeProjectId) renderOpenProject();
}

async function loadProjects() {
  projects = await projectDb.all();
  renderProjects();
}

function openProjects() {
  activeProjectId = null;
  selectedProjectIds = new Set();
  projectEls.shell.classList.add("projects-mode");
  projectEls.overview.hidden = false;
  setActivePrimaryNav("projects");
  selectedTaskIds = new Set();
  renderProjects();
}

function closeProjects() {
  projectEls.shell.classList.remove("projects-mode");
  projectEls.overview.hidden = true;
}

function renderProjectTask(task) {
  const row = els.template.content.firstElementChild.cloneNode(true);
  const project = projects.find(item => item.id === task.projectId);
  const list = lists.find(item => item.id === (task.listId || INBOX_LIST_ID))
    || lists.find(item => item.kind === "inbox");
  row.dataset.id = task.id;
  const selected = selectedTaskIds.has(task.id);
  const completed = isTaskCompleted(task);
  row.classList.toggle("selected", selected);
  row.classList.toggle("completed", completed);
  row.setAttribute("aria-selected", String(selected));
  row.querySelector(".task-text").textContent = task.title;
  const description = row.querySelector(".task-description-preview");
  description.textContent = task.description || "";
  description.hidden = !task.description;
  const date = row.querySelector(".task-date");
  renderTaskDueDate(date, task);
  const projectBadge = row.querySelector(".task-project");
  projectBadge.hidden = !project;
  row.querySelector(".task-project-name").textContent = project?.title || "";
  row.querySelector(".task-list-name").textContent = displayListTitle(list);
  const taskListIcon = row.querySelector(".task-list .inbox-icon");
  taskListIcon.className = list?.kind === "regular" ? "list-menu-icon" : "inbox-icon";
  const toggle = row.querySelector(".toggle");
  toggle.classList.toggle("done", completed);
  toggle.setAttribute("aria-label", completed ? "Повернути завдання в активні" : "Позначити виконаною");
  projectEls.taskList.append(row);
}

async function reopenProjectTask(task) {
  const updatedAt = new Date().toISOString();
  const updated = { ...task, status: "active", completedAt: null, updatedAt };
  await taskDb.put(updated);
  tasks = tasks.map(item => item.id === updated.id ? updated : item);
  renderCurrentTasks();
}

function renderOpenProject() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project || projectEls.screen.hidden) return;
  const steps = projectSteps(project.id);
  const completedCount = steps.filter(isTaskCompleted).length;
  const selectedHere = new Set(steps.filter(task => selectedTaskIds.has(task.id)).map(task => task.id));
  projectEls.heading.textContent = project.title;
  projectEls.goalSummary.textContent = project.goal ? `Мета: ${project.goal}` : "";
  projectEls.descriptionSummary.textContent = project.description || "";
  projectEls.descriptionToggle.hidden = !project.description;
  projectEls.descriptionToggle.setAttribute("aria-expanded", "false");
  const countdown = project.showCountdown ? projectCountdown(project.dueDate, localDateValue()) : null;
  projectEls.deadlineSummary.hidden = !project.dueDate;
  projectEls.deadlineSummary.textContent = project.dueDate ? `Термін: ${readableDueDate(project.dueDate, project.dueTime)}${countdown ? ` · ${countdown.text}` : ""}` : "";
  projectEls.deadlineSummary.dataset.overdue = String(countdown?.overdue === true);
  if (document.activeElement !== projectEls.title) projectEls.title.value = project.title;
  if (document.activeElement !== projectEls.goal) projectEls.goal.value = project.goal || "";
  if (document.activeElement !== projectEls.description) projectEls.description.value = project.description || "";
  if (document.activeElement !== projectEls.dueDate) projectEls.dueDate.value = project.dueDate || "";
  if (document.activeElement !== projectEls.dueTime) projectEls.dueTime.value = project.dueTime || "";
  projectEls.dateLabel.textContent = readableDueDate(project.dueDate, project.dueTime);
  applyDateTone(projectEls.datePickerOpen, project.dueDate, project.dueTime);
  projectEls.showCountdown.checked = project.showCountdown === true;
  renderProjectCountdown();
  projectEls.progress.textContent = `${steps.length} завд. · ${completedCount} виконано`;
  projectEls.tasksEmpty.hidden = steps.length > 0;
  projectEls.tasksExpand.hidden = steps.length < 5;
  projectEls.addNewFirst.checked = project.addNewTasksFirst !== false;
  projectEls.complete.textContent = project.status === "completed" ? "Повернути в активні" : "Завершити проєкт";
  projectEls.mainComplete.textContent = projectEls.complete.textContent;
  projectEls.taskList.replaceChildren();
  steps.forEach(renderProjectTask);
  projectEls.taskList.classList.toggle("selection-mode", selectedHere.size > 0);
  projectEls.selectionToolbar.hidden = selectedHere.size === 0;
  projectEls.screen.querySelector(".project-screen-header").hidden = selectedHere.size > 0;
  projectEls.selectionCount.textContent = `Вибрано: ${selectedHere.size}`;
  projectEls.listOptions.replaceChildren(...lists.map(createListDropdownOption));
}

function openProject(projectId) {
  const project = projects.find(item => item.id === projectId);
  if (!project) return;
  activeProjectId = projectId;
  selectedTaskIds = new Set();
  projectEls.screen.hidden = false;
  document.body.classList.add("project-screen-open");
  renderOpenProject();
}

function openProjectEditor() {
  renderOpenProject();
  projectEls.editor.hidden = false;
  document.body.classList.add("project-editor-open");
  projectEls.title.focus();
}

function closeProjectEditor() {
  projectEls.editor.hidden = true;
  document.body.classList.remove("project-editor-open");
  renderOpenProject();
  projectEls.editOpen.focus();
}

function toggleProjectTasks() {
  const expanded = !projectEls.steps.classList.contains("is-expanded");
  projectEls.steps.classList.toggle("is-expanded", expanded);
  projectEls.tasksExpand.setAttribute("aria-expanded", String(expanded));
  projectEls.tasksExpand.setAttribute("aria-label", expanded ? "Згорнути завдання" : "Розгорнути всі завдання");
  document.body.classList.toggle("project-tasks-open", expanded);
  if (expanded) projectEls.tasksExpand.focus();
}

async function closeProject({ animated = false } = {}) {
  if (!projectEls.editor.hidden) closeProjectEditor();
  if (projectEls.steps.classList.contains("is-expanded")) toggleProjectTasks();
  if (animated) {
    projectEls.screen.classList.add("is-closing");
    await new Promise(resolve => setTimeout(resolve, 230));
  }
  selectedTaskIds = new Set();
  activeProjectId = null;
  projectEls.screen.hidden = true;
  projectEls.screen.classList.remove("is-closing");
  document.body.classList.remove("project-screen-open");
  renderProjects();
}

async function saveProjectFields({ closeAfter = false } = {}) {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const title = projectEls.title.value.trim();
  if (!title) {
    projectEls.saveStatus.textContent = "Назва не може бути порожньою";
    return;
  }
  const updated = createProject({ ...project, title, goal: projectEls.goal.value.trim(), description: projectEls.description.value.trim(), dueDate: projectEls.dueDate.value || null, dueTime: projectEls.dueDate.value && projectEls.dueTime.value ? projectEls.dueTime.value : null, showCountdown: projectEls.showCountdown.checked, updatedAt: new Date().toISOString() });
  projectEls.saveStatus.textContent = "Збереження…";
  try {
    await projectDb.put(updated);
    projects = projects.map(item => item.id === updated.id ? updated : item);
    projectEls.heading.textContent = updated.title;
    projectEls.saveStatus.textContent = "Збережено";
    renderProjects();
    renderCurrentTasks();
    if (closeAfter) closeProjectEditor();
  } catch (_error) {
    projectEls.saveStatus.textContent = "Не вдалося зберегти";
  }
}

function markProjectDirty() {
  projectEls.saveStatus.textContent = "Є незбережені зміни";
}

async function addProject(title) {
  const value = title.trim();
  if (!value) return;
  const project = createProject({ title: value, position: nextProjectPosition(projects) });
  await projectDb.put(project);
  projects.push(project);
  projectEls.createForm.hidden = true;
  projectEls.createTitle.value = "";
  renderProjects();
  openProject(project.id);
}

async function addProjectStep(title) {
  const project = projects.find(item => item.id === activeProjectId);
  const value = title.trim();
  if (!project || !value) return;
  const listId = lists.some(list => list.id === project.lastListId) ? project.lastListId : INBOX_LIST_ID;
  const listTasks = tasks.filter(task => (task.listId || INBOX_LIST_ID) === listId && !task.sectionId);
  const steps = tasks.filter(task => task.projectId === project.id);
  const addFirst = project.addNewTasksFirst !== false;
  const task = createTask({
    title: value,
    listId,
    position: addFirst ? 0 : (listTasks.length ? Math.max(...listTasks.map(item => item.position || 0)) + 1 : 0),
    projectId: project.id,
    projectPosition: addFirst ? 0 : (steps.length ? Math.max(...steps.map(item => item.projectPosition ?? -1)) + 1 : 0)
  });
  const replacements = new Map();
  if (addFirst) {
    for (const existing of tasks) {
      const inProject = existing.projectId === project.id;
      const inListRoot = (existing.listId || INBOX_LIST_ID) === listId && !existing.sectionId;
      if (!inProject && !inListRoot) continue;
      replacements.set(existing.id, {
        ...existing,
        position: inListRoot ? (Number.isFinite(existing.position) ? existing.position : 0) + 1 : existing.position,
        projectPosition: inProject ? (Number.isFinite(existing.projectPosition) ? existing.projectPosition : 0) + 1 : existing.projectPosition,
        updatedAt: task.updatedAt
      });
    }
  }
  await taskDb.putMany([task, ...replacements.values()]);
  tasks = tasks.map(existing => replacements.get(existing.id) || existing);
  tasks.push(task);
  await rememberProjectList(project.id, listId);
  if (projectEls.stepTitle.value.trim() === value) projectEls.stepTitle.value = "";
  renderOpenProject();
  renderProjects();
}

async function toggleProjectStatus() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const completing = project.status !== "completed";
  if (completing) {
    await completeProjects([project]);
    return;
  }
  const now = new Date().toISOString();
  const updated = { ...project, status: "active", completedAt: null, updatedAt: now };
  await projectDb.put(updated);
  projects = projects.map(item => item.id === updated.id ? updated : item);
  renderOpenProject();
  renderProjects();
}

async function deleteProject() {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const detachTasks = await requestProjectDeletion(1);
  if (detachTasks === null) return;
  const now = new Date().toISOString();
  await projectDb.deleteManyWithTasks([project.id], now, detachTasks);
  tasks = detachTasks
    ? tasks.map(task => task.projectId === project.id ? { ...task, projectId: null, projectPosition: null, updatedAt: now } : task)
    : tasks.filter(task => task.projectId !== project.id);
  projects = projects.filter(item => item.id !== project.id);
  closeProject();
  renderCurrentTasks();
  toast(detachTasks ? "Проєкт видалено, завдання збережено" : "Проєкт і його завдання видалено");
}

async function reorderSelectedProjectSteps({ beforeId }) {
  const projectSelectedIds = new Set(projectSteps(activeProjectId).filter(task => selectedTaskIds.has(task.id)).map(task => task.id));
  const reordered = reorderProjectStepBlock(tasks, activeProjectId, projectSelectedIds, beforeId);
  const changed = reordered.filter((task, index) => task !== tasks[index]);
  if (!changed.length) return;
  tasks = reordered;
  renderOpenProject();
  renderProjects();
  try { await taskDb.putMany(changed); }
  catch (_error) { await refresh(); toast("Не вдалося зберегти порядок кроків"); }
}

async function reorderProjectCards({ selectedIds, beforeId }) {
  const reordered = reorderProjectBlock(projects, selectedIds, beforeId);
  const changed = reordered.filter((project, index) => project !== projects[index]);
  if (!changed.length) return;
  projects = reordered;
  renderProjects();
  try { await projectDb.putMany(changed); }
  catch (_error) { await loadProjects(); toast("Не вдалося зберегти порядок проєктів"); }
}

function selectProject(projectId) {
  if (!projects.some(project => project.id === projectId && project.status !== "completed")) return;
  selectedProjectIds.add(projectId);
  renderProjects();
}

function selectOnlyProject(projectId) {
  selectedProjectIds = new Set([projectId]);
  renderProjects();
}

function toggleProjectSelection(projectId) {
  if (selectedProjectIds.has(projectId)) selectedProjectIds.delete(projectId);
  else selectedProjectIds.add(projectId);
  renderProjects();
}

function clearProjectSelection() {
  selectedProjectIds = new Set();
  renderProjects();
}

async function completeSelectedProjects() {
  const selected = projects.filter(project => selectedProjectIds.has(project.id) && project.status !== "completed");
  if (!selected.length) return;
  await completeProjects(selected);
}

async function completeProjects(selected) {
  const completeTasks = await requestProjectCompletion(selected.length);
  if (completeTasks === null) return;
  const now = new Date().toISOString();
  const updates = selected.map(project => ({ ...project, status: "completed", completedAt: now, updatedAt: now }));
  const ids = new Set(updates.map(project => project.id));
  const replacements = new Map(updates.map(project => [project.id, project]));
  await projectDb.completeManyWithTasks(updates, now, completeTasks);
  projects = projects.map(project => replacements.get(project.id) || project);
  tasks = tasks.map(task => {
    if (!ids.has(task.projectId) || task.status !== "active") return task;
    return completeTasks
      ? { ...task, status: "completed", completedAt: now, updatedAt: now }
      : { ...task, projectId: null, projectPosition: null, updatedAt: now };
  });
  selectedProjectIds = new Set();
  renderProjects();
  renderCurrentTasks();
}

function requestProjectCompletion(count) {
  if (projectCompleteDialogResolve) projectCompleteDialogResolve(null);
  projectCompleteDialogReturnFocus = document.activeElement;
  projectEls.completeDialogTitle.textContent = count === 1 ? "Завершити проєкт?" : `Завершити проєкти (${count})?`;
  projectEls.completeTasks.checked = true;
  projectEls.completeDialogBackdrop.hidden = false;
  document.body.classList.add("project-complete-dialog-open");
  requestAnimationFrame(() => projectEls.completeDialog.focus());
  return new Promise(resolve => { projectCompleteDialogResolve = resolve; });
}

function closeProjectCompleteDialog(result = null) {
  if (!projectCompleteDialogResolve) return;
  const resolve = projectCompleteDialogResolve;
  projectCompleteDialogResolve = null;
  projectEls.completeDialogBackdrop.hidden = true;
  document.body.classList.remove("project-complete-dialog-open");
  projectCompleteDialogReturnFocus?.focus();
  projectCompleteDialogReturnFocus = null;
  resolve(result);
}

async function deleteSelectedProjects() {
  const ids = new Set(selectedProjectIds);
  if (!ids.size) return;
  const detachTasks = await requestProjectDeletion(ids.size);
  if (detachTasks === null) return;
  const now = new Date().toISOString();
  await projectDb.deleteManyWithTasks(ids, now, detachTasks);
  tasks = detachTasks
    ? tasks.map(task => ids.has(task.projectId) ? { ...task, projectId: null, projectPosition: null, updatedAt: now } : task)
    : tasks.filter(task => !ids.has(task.projectId));
  projects = projects.filter(project => !ids.has(project.id));
  selectedProjectIds = new Set();
  renderProjects();
  renderCurrentTasks();
  toast(detachTasks ? "Проєкти видалено, завдання збережено" : "Проєкти та їхні завдання видалено");
}

function requestProjectDeletion(count) {
  if (projectDeleteDialogResolve) projectDeleteDialogResolve(null);
  projectDeleteDialogReturnFocus = document.activeElement;
  projectEls.deleteDialogTitle.textContent = count === 1 ? "Видалити проєкт?" : `Видалити проєкти (${count})?`;
  projectEls.deleteKeepTasks.checked = true;
  projectEls.deleteDialogBackdrop.hidden = false;
  document.body.classList.add("project-delete-dialog-open");
  requestAnimationFrame(() => projectEls.deleteDialog.focus());
  return new Promise(resolve => { projectDeleteDialogResolve = resolve; });
}

function closeProjectDeleteDialog(result = null) {
  if (!projectDeleteDialogResolve) return;
  const resolve = projectDeleteDialogResolve;
  projectDeleteDialogResolve = null;
  projectEls.deleteDialogBackdrop.hidden = true;
  document.body.classList.remove("project-delete-dialog-open");
  projectDeleteDialogReturnFocus?.focus();
  projectDeleteDialogReturnFocus = null;
  resolve(result);
}

projectEls.add.addEventListener("click", () => { projectEls.createForm.hidden = false; projectEls.createTitle.focus(); });
projectEls.createCancel.addEventListener("click", () => { projectEls.createForm.hidden = true; projectEls.createTitle.value = ""; });
projectEls.createForm.addEventListener("submit", event => { event.preventDefault(); addProject(projectEls.createTitle.value); });
[projectEls.activeList, projectEls.completedList].forEach(container => container.addEventListener("click", event => {
  const card = event.target.closest("[data-project-id]");
  if (!card) return;
  if (card.dataset.dragged) { delete card.dataset.dragged; return; }
  if (card.dataset.longPressed) { delete card.dataset.longPressed; return; }
  if (selectedProjectIds.size && container === projectEls.activeList) { toggleProjectSelection(card.dataset.projectId); return; }
  openProject(card.dataset.projectId);
}));
projectEls.overviewSelectionClose.addEventListener("click", clearProjectSelection);
projectEls.completeSelected.addEventListener("click", completeSelectedProjects);
projectEls.deleteSelectedProjects.addEventListener("click", deleteSelectedProjects);
projectEls.completeNo.addEventListener("click", () => closeProjectCompleteDialog(null));
projectEls.completeYes.addEventListener("click", () => closeProjectCompleteDialog(projectEls.completeTasks.checked));
projectEls.completeDialogBackdrop.addEventListener("click", event => { if (event.target === projectEls.completeDialogBackdrop) closeProjectCompleteDialog(null); });
projectEls.deleteNo.addEventListener("click", () => closeProjectDeleteDialog(null));
projectEls.deleteYes.addEventListener("click", () => closeProjectDeleteDialog(projectEls.deleteKeepTasks.checked));
projectEls.deleteDialogBackdrop.addEventListener("click", event => { if (event.target === projectEls.deleteDialogBackdrop) closeProjectDeleteDialog(null); });
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!projectEls.completeDialogBackdrop.hidden) closeProjectCompleteDialog(null);
  else if (!projectEls.deleteDialogBackdrop.hidden) closeProjectDeleteDialog(null);
});
projectEls.back.addEventListener("click", closeProject);
projectEls.editOpen.addEventListener("click", openProjectEditor);
projectEls.editClose.addEventListener("click", () => saveProjectFields({ closeAfter: true }));
projectEls.descriptionToggle.addEventListener("click", () => {
  const expanded = projectEls.descriptionToggle.getAttribute("aria-expanded") !== "true";
  projectEls.descriptionToggle.setAttribute("aria-expanded", String(expanded));
});
projectEls.tasksExpand.addEventListener("click", toggleProjectTasks);
projectEls.mainComplete.addEventListener("click", toggleProjectStatus);
[projectEls.title, projectEls.goal, projectEls.description, projectEls.dueDate, projectEls.dueTime].forEach(field => field.addEventListener("input", markProjectDirty));
projectEls.datePickerOpen.addEventListener("click", () => {
  editingSelectedTaskDates = false;
  editingProjectDate = true;
  openDatePicker(projectEls.dueDate.value, projectEls.dueTime.value);
});
projectEls.showCountdown.addEventListener("change", () => { markProjectDirty(); renderProjectCountdown(); });
projectEls.save.addEventListener("click", () => saveProjectFields({ closeAfter: true }));
projectEls.stepForm.addEventListener("submit", event => { event.preventDefault(); addProjectStep(projectEls.stepTitle.value); });
projectEls.addNewFirst.addEventListener("change", async () => {
  const project = projects.find(item => item.id === activeProjectId);
  if (!project) return;
  const updated = createProject({ ...project, addNewTasksFirst: projectEls.addNewFirst.checked, updatedAt: new Date().toISOString() });
  projects = projects.map(item => item.id === updated.id ? updated : item);
  try { await projectDb.put(updated); }
  catch (_error) {
    projects = projects.map(item => item.id === project.id ? project : item);
    projectEls.addNewFirst.checked = project.addNewTasksFirst !== false;
    toast("Не вдалося зберегти порядок нових завдань");
  }
});
projectEls.complete.addEventListener("click", toggleProjectStatus);
projectEls.delete.addEventListener("click", deleteProject);
projectEls.taskList.addEventListener("click", async event => {
  const row = event.target.closest(".swipe-row");
  if (!row || row.dataset.swiped) { if (row) delete row.dataset.swiped; return; }
  if (row.dataset.longPressed) { delete row.dataset.longPressed; return; }
  if (selectedTaskIds.size) { toggleTaskSelection(row.dataset.id); return; }
  const task = tasks.find(item => item.id === row.dataset.id);
  if (event.target.closest(".toggle")) {
    if (isTaskCompleted(task)) await reopenProjectTask(task);
    else await completeTask(task, {}, event.target.closest(".toggle"));
    renderOpenProject();
    return;
  }
  if (event.target.closest(".task-card")) openTaskDetails(task);
});

projectEls.selectionClose.addEventListener("click", clearTaskSelection);
projectEls.dateSelected.addEventListener("click", openSelectedTaskDatePicker);
projectEls.listSelected.addEventListener("click", () => {
  projectEls.listOptions.hidden = !projectEls.listOptions.hidden;
  projectEls.listOptions.scrollLeft = 0;
  projectEls.listSelected.setAttribute("aria-expanded", String(!projectEls.listOptions.hidden));
});
projectEls.listOptions.addEventListener("click", event => {
  const option = event.target.closest("[data-list-id]");
  if (!option) return;
  projectEls.listOptions.hidden = true;
  projectEls.listSelected.setAttribute("aria-expanded", "false");
  moveSelectedTasksToList(option.dataset.listId);
});
projectEls.deleteSelected.addEventListener("click", deleteSelectedTasks);

enableTaskGestures({
  container: projectEls.taskList,
  onDelete: deleteTask,
  isSelectionMode: () => selectedTaskIds.size > 0,
  isSelected: id => selectedTaskIds.has(id),
  onLongPress: selectTask,
  onSelectOnly: selectTask,
  getSelectedIds: () => new Set(selectedTaskIds),
  onReorder: reorderSelectedProjectSteps,
  requireSelectionForDrag: true
});

enableProjectCardReorder({
  container: projectEls.activeList,
  isSelectionMode: () => selectedProjectIds.size > 0,
  isSelected: id => selectedProjectIds.has(id),
  onLongPress: selectProject,
  onSelectOnly: selectOnlyProject,
  getSelectedIds: () => new Set(selectedProjectIds),
  onReorder: reorderProjectCards
});
