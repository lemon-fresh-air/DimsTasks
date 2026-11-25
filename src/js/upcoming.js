let upcomingDate = localDateValue();
let upcomingEnd = null;
let upcomingStart = null;
let upcomingCalendarMonth = null;
let upcomingReturnFocus = null;
let upcomingWeekAnimation = null;
let upcomingHeightAnimation = null;
let upcomingScrollTimer = null;
let upcomingProgrammaticScroll = false;
let upcomingScrollRestore = null;
let upcomingExpanded = false;
let upcomingExpandedStart = null;
const UPCOMING_EXPANDED_DAYS = 28;
const upcoming = {
  screen: document.querySelector("#upcoming-screen"), week: document.querySelector("#upcoming-week"),
  weekViewport: document.querySelector(".upcoming-week-viewport"),
  feed: document.querySelector("#upcoming-feed"), month: document.querySelector("#upcoming-month"),
  backdrop: document.querySelector("#upcoming-calendar-backdrop"), grid: document.querySelector("#upcoming-calendar-grid")
};
const upcomingMonthFormatter = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" });
const upcomingDayFormatter = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" });
const upcomingDateLabel = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });
const upcomingWeekday = new Intl.DateTimeFormat("uk-UA", { weekday: "long" });
function upcomingAdvance(value, days) {
  const date = dateFromValue(value);
  date.setDate(date.getDate() + days);
  return localDateValue(date);
}
function upcomingTasks() {
  return visibleProjectTasks(tasks, projects).filter(task => task.status === "active" && !isTaskCompleted(task) && task.dueDate);
}
function renderUpcomingSelection() {
  upcoming.screen.classList.toggle("selection-mode", selectedTaskIds.size > 0);
  els.shell.classList.toggle("selection-active", selectedTaskIds.size > 0);
  document.querySelector("#upcoming-selection-count").textContent = selectedTaskIds.size ? `Вибрано: ${selectedTaskIds.size}` : "Виберіть завдання";
  document.querySelector("#upcoming-selection-date").hidden = !selectedTaskIds.size;
  document.querySelector("#upcoming-selection-delete").hidden = !selectedTaskIds.size;
  document.querySelector("#upcoming-selection-close").hidden = !selectedTaskIds.size;
  for (const row of upcoming.feed.querySelectorAll(".swipe-row")) {
    const selected = selectedTaskIds.has(row.dataset.id);
    row.classList.toggle("selected", selected);
    row.setAttribute("aria-selected", String(selected));
  }
  document.querySelector("#upcoming-selection-all").setAttribute("aria-checked", String(
    [...upcoming.feed.querySelectorAll(".swipe-row")].every(row => selectedTaskIds.has(row.dataset.id))));
}
function selectUpcomingTask(id, only = false) {
  if (only) selectedTaskIds = new Set([id]);
  else {
    selectedTaskIds = new Set(selectedTaskIds);
    if (selectedTaskIds.has(id)) selectedTaskIds.delete(id);
    else selectedTaskIds.add(id);
  }
  renderUpcomingSelection();
}
function clearUpcomingSelection() {
  selectedTaskIds = new Set();
  renderUpcomingSelection();
  closeUpcomingMenu();
  renderCurrentTasks();
}
function closeUpcomingMenu({ restoreFocus = false } = {}) {
  const menu = document.querySelector("#upcoming-selection");
  if (menu.hidden) return;
  menu.hidden = true;
  document.querySelector("#upcoming-more").setAttribute("aria-expanded", "false");
  if (restoreFocus) document.querySelector("#upcoming-more").focus();
}
function renderUpcomingWeek(previousDate = null) {
  const selectedWeek = localDateValue(calendarWeekStart(dateFromValue(upcomingDate)));
  if (upcomingExpanded && (!upcomingExpandedStart || upcomingDate < upcomingExpandedStart
    || upcomingDate >= upcomingAdvance(upcomingExpandedStart, UPCOMING_EXPANDED_DAYS)))
    upcomingExpandedStart = selectedWeek;
  const first = dateFromValue(upcomingExpanded ? upcomingExpandedStart : selectedWeek);
  upcomingWeekAnimation?.();
  const shouldSlide = previousDate && previousDate !== upcomingDate
    && upcoming.week.firstElementChild?.dataset.date !== localDateValue(first)
    && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const previous = shouldSlide ? upcoming.week.cloneNode(true) : null;
  const oldHeight = upcoming.week.offsetHeight;
  const oldScroll = upcoming.week.scrollTop;
  const dueDates = new Set(upcomingTasks().map(task => task.dueDate));
  const today = localDateValue();
  upcoming.month.textContent = upcomingMonthFormatter.format(dateFromValue(upcomingDate));
  upcoming.week.replaceChildren(...Array.from({ length: upcomingExpanded ? UPCOMING_EXPANDED_DAYS : 7 }, (_, index) => {
    const date = new Date(first);
    date.setDate(date.getDate() + index);
    const value = localDateValue(date);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = value;
    button.className = "upcoming-day";
    button.innerHTML = `<strong>${date.getDate()}</strong><i aria-hidden="true"></i>`;
    button.setAttribute("aria-label", upcomingDayFormatter.format(date));
    button.setAttribute("aria-pressed", String(value === upcomingDate));
    if (value === today) button.setAttribute("aria-current", "date");
    if (value < today) button.dataset.dateTone = "overdue";
    button.classList.toggle("has-tasks", dueDates.has(value));
    return button;
  }));
  if (previous) {
    upcomingWeekAnimation = animateCalendarSlide(upcoming.week, previous, upcoming.weekViewport,
      upcomingDate > previousDate ? 1 : -1, oldHeight, () => { upcomingWeekAnimation = null; });
    previous.scrollTop = oldScroll;
  }
}
function appendUpcomingDays(start, count = 21) {
  const today = localDateValue();
  const byDate = new Map();
  for (const task of upcomingTasks()) {
    if (!byDate.has(task.dueDate)) byDate.set(task.dueDate, []);
    byDate.get(task.dueDate).push(task);
  }
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index++) {
    const value = upcomingAdvance(start, index);
    const day = document.createElement("section");
    day.className = "upcoming-feed-day";
    day.dataset.date = value;
    if (value < today) day.dataset.dateTone = "overdue";
    if (value === today) day.dataset.dateTone = "today";
    day.classList.toggle("selected-day", value === upcomingDate);
    const heading = document.createElement("h2");
    const date = dateFromValue(value);
    heading.textContent = `${value === today ? "Сьогодні · " : ""}${upcomingDateLabel.format(date)}, ${upcomingWeekday.format(date)}`;
    heading.tabIndex = 0;
    heading.setAttribute("role", "button");
    heading.setAttribute("aria-label", `Перейти до ${upcomingDayFormatter.format(date)}`);
    day.append(heading);
    for (const task of (byDate.get(value) || []).sort(compareUpcomingTasks)) {
      const row = els.template.content.firstElementChild.cloneNode(true);
      row.dataset.id = task.id;
      renderTaskCardDetails(row, task, lists, projects, { listSections: sections, showListSection: true });
      day.append(row);
    }
    fragment.append(day);
  }
  upcoming.feed.append(fragment);
  if (!upcomingStart) upcomingStart = start;
  upcomingEnd = upcomingAdvance(start, count - 1);
  renderUpcomingSelection();
}
function prependUpcomingDays() {
  const oldEnd = upcomingEnd;
  const oldHeight = upcoming.feed.scrollHeight;
  const oldChildren = upcoming.feed.children.length;
  const start = upcomingAdvance(upcomingStart, -21);
  appendUpcomingDays(start);
  const added = [...upcoming.feed.children].slice(oldChildren);
  upcoming.feed.prepend(...added);
  upcomingStart = start;
  upcomingEnd = oldEnd;
  upcoming.feed.scrollTop += upcoming.feed.scrollHeight - oldHeight;
  while (upcoming.feed.children.length > 84) upcoming.feed.lastElementChild.remove();
  if (upcoming.feed.lastElementChild) upcomingEnd = upcoming.feed.lastElementChild.dataset.date;
}
function rememberUpcomingFeedScroll() {
  if (upcoming.screen.hidden) return;
  const feedTop = upcoming.feed.getBoundingClientRect().top;
  const anchor = [...upcoming.feed.children].find(day => day.getBoundingClientRect().bottom > feedTop);
  if (anchor) upcomingScrollRestore = { date: anchor.dataset.date, offset: anchor.getBoundingClientRect().top - feedTop };
}
function renderUpcomingFeed() {
  upcoming.feed.replaceChildren();
  upcomingStart = null;
  const restore = upcomingScrollRestore;
  appendUpcomingDays(upcomingAdvance(restore?.date || upcomingDate, -21), 42);
  const day = upcoming.feed.querySelector(`[data-date="${restore?.date || upcomingDate}"]`);
  upcoming.feed.scrollTop = day.offsetTop - upcoming.feed.offsetTop - (restore?.offset || 0);
  upcomingScrollRestore = null;
}
function scrollUpcomingToDate(value, animate) {
  const day = [...upcoming.feed.querySelectorAll(".upcoming-feed-day")].find(item => item.dataset.date === value);
  if (!day) return;
  upcomingProgrammaticScroll = true;
  clearTimeout(upcomingScrollTimer);
  const top = day.offsetTop - upcoming.feed.offsetTop;
  upcoming.feed.scrollTo({ top, behavior: animate && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  upcomingScrollTimer = setTimeout(() => { upcomingProgrammaticScroll = false; }, animate ? 700 : 0);
}
function selectUpcomingDate(value, { animate = true } = {}) {
  const previousDate = upcomingDate;
  const alreadyRendered = [...upcoming.feed.querySelectorAll(".upcoming-feed-day")].some(item => item.dataset.date === value);
  upcomingDate = value;
  for (const day of upcoming.feed.querySelectorAll(".upcoming-feed-day"))
    day.classList.toggle("selected-day", day.dataset.date === value);
  renderUpcomingWeek(animate ? previousDate : null);
  if (!alreadyRendered) {
    renderUpcomingFeed();
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      upcoming.feed.animate([{ opacity: .55, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  scrollUpcomingToDate(value, animate && alreadyRendered);
}
function openUpcoming() {
  closeProjects();
  closeMainMenu();
  selectedTaskIds = new Set();
  els.shell.classList.add("upcoming-mode");
  upcoming.screen.hidden = false;
  els.mainMenuOpen.dataset.currentPrimaryNav = "upcoming";
  setActivePrimaryNav("upcoming");
  selectUpcomingDate(upcomingDate, { animate: false });
}
function closeUpcoming() {
  if (upcoming.screen.hidden) return;
  upcomingWeekAnimation?.();
  upcomingHeightAnimation?.();
  selectedTaskIds = new Set();
  els.shell.classList.remove("selection-active");
  els.shell.classList.remove("upcoming-mode");
  upcoming.screen.hidden = true;
  closeUpcomingMenu();
  closeUpcomingCalendar();
}
function renderUpcomingCalendar() {
  const month = upcomingCalendarMonth;
  const today = localDateValue();
  document.querySelector("#upcoming-calendar-month").textContent = upcomingMonthFormatter.format(month);
  const first = calendarWeekStart(month);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12);
  const cells = [];
  for (let date = new Date(first); date <= last || (date.getDay() + 6) % 7 !== 0; date.setDate(date.getDate() + 1)) {
    const value = localDateValue(date);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = value;
    if (value < today) button.dataset.dateTone = "overdue";
    button.textContent = date.getDate();
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", fullDateFormatter.format(date));
    button.classList.toggle("outside-month", date.getMonth() !== month.getMonth());
    button.classList.toggle("today", value === today);
    button.classList.toggle("selected", value === upcomingDate);
    if (value === today) button.setAttribute("aria-current", "date");
    if (value === upcomingDate) button.setAttribute("aria-selected", "true");
    cells.push(button);
  }
  upcoming.grid.replaceChildren(...cells);
}
function openUpcomingCalendar() {
  upcomingReturnFocus = document.activeElement;
  const date = dateFromValue(upcomingDate);
  upcomingCalendarMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  renderUpcomingCalendar();
  upcoming.backdrop.hidden = false;
  document.querySelector("#upcoming-calendar").focus();
}
function closeUpcomingCalendar() {
  if (upcoming.backdrop.hidden) return;
  upcoming.backdrop.hidden = true;
  upcomingReturnFocus?.focus();
}
let upcomingSuppressClick = false;
const upcomingExpand = document.querySelector("#upcoming-expand");
function setUpcomingExpanded(expanded) {
  const viewport = upcoming.weekViewport;
  const oldHeight = viewport.getBoundingClientRect().height;
  upcomingHeightAnimation?.();
  upcomingWeekAnimation?.();
  const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches && oldHeight > 0;
  const previous = animate && !expanded ? upcoming.week.cloneNode(true) : null;
  const oldScroll = upcoming.week.scrollTop;
  upcomingExpanded = expanded;
  upcomingExpandedStart = expanded ? localDateValue(calendarWeekStart(dateFromValue(upcomingDate))) : null;
  upcoming.screen.classList.toggle("calendar-expanded", expanded);
  upcomingExpand.setAttribute("aria-expanded", String(expanded));
  upcomingExpand.setAttribute("aria-label", expanded ? "Згорнути дати до тижня" : "Розгорнути дати на чотири тижні");
  renderUpcomingWeek();
  if (!animate) return;
  const height = viewport.offsetHeight;
  if (previous) {
    previous.removeAttribute("id");
    previous.setAttribute("aria-hidden", "true");
    previous.inert = true;
    previous.classList.add("upcoming-week-collapsing");
    previous.style.height = `${oldHeight}px`;
    viewport.append(previous);
    previous.scrollTop = oldScroll;
  }
  const animation = viewport.animate([{ height: `${oldHeight}px` }, { height: `${height}px` }],
    { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
  upcomingHeightAnimation = () => {
    animation.cancel();
    previous?.remove();
    upcomingHeightAnimation = null;
  };
  animation.addEventListener("finish", upcomingHeightAnimation, { once: true });
}
let upcomingExpandPointer = null;
let upcomingExpandDragged = false;
upcomingExpand.addEventListener("pointerdown", event => {
  upcomingExpandPointer = { y: event.clientY, id: event.pointerId };
  upcomingExpandDragged = false;
  upcomingExpand.setPointerCapture(event.pointerId);
});
upcomingExpand.addEventListener("pointerup", event => {
  if (!upcomingExpandPointer || upcomingExpandPointer.id !== event.pointerId) return;
  const dy = event.clientY - upcomingExpandPointer.y;
  upcomingExpandPointer = null;
  if ((!upcomingExpanded && dy > 25) || (upcomingExpanded && dy < -25)) {
    upcomingExpandDragged = true;
    setUpcomingExpanded(!upcomingExpanded);
  }
});
upcomingExpand.addEventListener("pointercancel", () => { upcomingExpandPointer = null; });
upcomingExpand.addEventListener("click", () => {
  if (upcomingExpandDragged) { upcomingExpandDragged = false; return; }
  setUpcomingExpanded(!upcomingExpanded);
});
upcoming.week.addEventListener("click", event => {
  if (upcomingSuppressClick) { upcomingSuppressClick = false; event.preventDefault(); return; }
  const day = event.target.closest("[data-date]");
  if (day) selectUpcomingDate(day.dataset.date);
});
let upcomingSwipe = null;
upcoming.week.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.button !== 0) return;
  upcomingSuppressClick = false;
  upcomingSwipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
window.addEventListener("pointerup", event => {
  if (upcomingSwipe?.id !== event.pointerId) return;
  const dx = event.clientX - upcomingSwipe.x;
  const dy = event.clientY - upcomingSwipe.y;
  upcomingSwipe = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    upcomingSuppressClick = true;
    const days = dx < 0 ? 7 : -7;
    if (upcomingExpanded) upcomingExpandedStart = upcomingAdvance(upcomingExpandedStart, days);
    selectUpcomingDate(upcomingAdvance(upcomingDate, days));
  }
});
window.addEventListener("pointercancel", event => {
  if (upcomingSwipe?.id === event.pointerId) upcomingSwipe = null;
});
upcoming.feed.addEventListener("scroll", () => {
  if (!upcomingProgrammaticScroll && upcoming.feed.scrollTop < 100 && upcomingStart) prependUpcomingDays();
  if (upcoming.feed.scrollTop + upcoming.feed.clientHeight < upcoming.feed.scrollHeight - 500) return;
  if (upcoming.feed.querySelectorAll(".upcoming-feed-day").length >= 84) return;
  appendUpcomingDays(upcomingAdvance(upcomingEnd, 1));
});
upcoming.feed.addEventListener("wheel", () => { upcomingProgrammaticScroll = false; }, { passive: true });
upcoming.feed.addEventListener("touchstart", () => { upcomingProgrammaticScroll = false; }, { passive: true });
upcoming.feed.addEventListener("click", event => {
  if (upcomingSuppressTaskClick) { upcomingSuppressTaskClick = false; event.preventDefault(); return; }
  const heading = event.target.closest(".upcoming-feed-day h2");
  if (heading) { selectUpcomingDate(heading.parentElement.dataset.date); return; }
  const row = event.target.closest(".swipe-row");
  if (row?.dataset.swiped) { delete row.dataset.swiped; return; }
  const task = tasks.find(item => item.id === row?.dataset.id);
  if (!task) return;
  if (selectedTaskIds.size) { selectUpcomingTask(task.id); return; }
  if (event.target.closest(".toggle")) completeTask(task, {}, row.querySelector(".toggle"));
  else if (event.target.closest(".task-open")) openTaskDetails(task);
});
upcoming.feed.addEventListener("keydown", event => {
  if (event.target.matches(".upcoming-feed-day h2") && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    selectUpcomingDate(event.target.parentElement.dataset.date);
    return;
  }
  const row = event.target.closest(".swipe-row");
  if (row && event.key === " " && event.shiftKey) {
    event.preventDefault();
    selectUpcomingTask(row.dataset.id);
  } else if (event.key === "Escape" && selectedTaskIds.size) {
    event.preventDefault();
    clearUpcomingSelection();
  }
});
document.querySelector("#upcoming-more").addEventListener("click", () => {
  const menu = document.querySelector("#upcoming-selection");
  menu.hidden = !menu.hidden;
  document.querySelector("#upcoming-more").setAttribute("aria-expanded", String(!menu.hidden));
  if (!menu.hidden) menu.querySelector("button:not([hidden])")?.focus();
});
document.addEventListener("click", event => {
  if (!event.target.closest(".upcoming-heading-actions")) closeUpcomingMenu();
});
document.querySelector("#upcoming-selection").addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeUpcomingMenu({ restoreFocus: true }); }
});
document.querySelector("#upcoming-selection-close").addEventListener("click", clearUpcomingSelection);
document.querySelector("#upcoming-selection-all").addEventListener("click", () => {
  const ids = [...upcoming.feed.querySelectorAll(".swipe-row")].map(row => row.dataset.id);
  selectedTaskIds = ids.every(id => selectedTaskIds.has(id)) ? new Set() : new Set(ids);
  renderUpcomingSelection();
  closeUpcomingMenu({ restoreFocus: true });
});
document.querySelector("#upcoming-selection-date").addEventListener("click", () => { closeUpcomingMenu(); openSelectedTaskDatePicker(); });
document.querySelector("#upcoming-selection-delete").addEventListener("click", async () => {
  closeUpcomingMenu();
  await deleteSelectedTasks();
  renderUpcomingFeed();
});
let upcomingTaskGesture = null;
let upcomingSuppressTaskClick = false;
function moveUpcomingGhost(gesture, x, y) {
  if (!gesture.ghost) return;
  const follow = gesture.reducedMotion ? 1 : .42;
  gesture.previewX += (x - gesture.x - gesture.previewX) * follow;
  gesture.previewY += (y - gesture.y - gesture.previewY) * follow;
  gesture.ghost.style.transform = `translate3d(${gesture.previewX}px,${gesture.previewY}px,0)`;
}
async function finishUpcomingGhost(gesture, destination) {
  if (!gesture.ghost) return;
  restoreUpcomingDragRows(gesture);
  const rect = destination?.getBoundingClientRect()
    || gesture.source.getBoundingClientRect();
  const x = rect.left - gesture.sourceRect.left;
  const y = rect.top - gesture.sourceRect.top;
  if (!gesture.reducedMotion) {
    const animation = gesture.ghost.animate([
      { transform: gesture.ghost.style.transform, opacity: .94 },
      { transform: `translate3d(${x}px,${y}px,0) scale(.97)`, opacity: 0 }
    ], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    await animation.finished.catch(() => {});
  }
  gesture.ghost.remove();

}
function restoreUpcomingDragRows(gesture) {
  gesture.placeholder?.remove();
  for (const row of gesture.rows || []) row.classList.remove("drag-source");
}
function upcomingDropTarget(gesture, x, y) {
  const hit = document.elementFromPoint(x, y);
  const day = hit?.closest(".upcoming-feed-day,.upcoming-day");
  if (!day) return null;
  const date = day.dataset.date;
  if (date === gesture.date) {
    if (hit === gesture.placeholder) return gesture.target?.date === date ? gesture.target : null;
    const row = hit.closest(".swipe-row");
    if (!row || !upcoming.feed.contains(row) || gesture.ids.has(row.dataset.id)) return null;
    const bounds = row.getBoundingClientRect();
    const after = y >= bounds.top + bounds.height / 2;
    return { date, element: row, after, marker: after ? "drop-after" : "drop-before" };
  }
  return date >= localDateValue() ? { date, element: day, marker: "drop-target" } : null;
}
function highlightUpcomingDrop(gesture, target) {
  if (gesture.target?.element === target?.element && gesture.target?.marker === target?.marker) return;
  gesture.target?.element.classList.remove(gesture.target.marker);
  target?.element.classList.add(target.marker);
  gesture.target = target;
  const day = gesture.source.parentElement;
  if (!day) return;
  const previous = captureRows(day);
  if (target?.date !== gesture.date) gesture.rows[0].before(gesture.placeholder);
  else if (target.after) target.element.after(gesture.placeholder);
  else target.element.before(gesture.placeholder);
  animateRows(previous, day);
}
function scrollUpcomingDuringDrag() {
  const gesture = upcomingTaskGesture;
  if (!gesture?.dragging) return;
  const bounds = upcoming.feed.getBoundingClientRect();
  if (gesture.currentY < bounds.top + 45) {
    if (upcoming.feed.scrollTop <= 0) prependUpcomingDays();
    upcoming.feed.scrollBy(0, -12);
  } else if (gesture.currentY > bounds.bottom - 45) {
    if (upcoming.feed.scrollTop + upcoming.feed.clientHeight >= upcoming.feed.scrollHeight - 5 && upcoming.feed.children.length < 84)
      appendUpcomingDays(upcomingAdvance(upcomingEnd, 1));
    upcoming.feed.scrollBy(0, 12);
  }
  moveUpcomingGhost(gesture, gesture.currentX, gesture.currentY);
  if (gesture.scrollTop !== upcoming.feed.scrollTop) {
    gesture.scrollTop = upcoming.feed.scrollTop;
    highlightUpcomingDrop(gesture, upcomingDropTarget(gesture, gesture.currentX, gesture.currentY));
  }
  gesture.scrollFrame = requestAnimationFrame(scrollUpcomingDuringDrag);
}
upcoming.feed.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.button > 0 || event.target.closest(".toggle")) return;
  const row = event.target.closest(".swipe-row");
  if (!row) return;
  upcomingSuppressTaskClick = false;
  upcomingTaskGesture = { id: event.pointerId, taskId: row.dataset.id, x: event.clientX, y: event.clientY,
    date: row.closest(".upcoming-feed-day").dataset.date, ready: event.pointerType === "mouse" && selectedTaskIds.size > 0, dragging: false, target: null };
  upcomingTaskGesture.timer = setTimeout(() => {
    if (!upcomingTaskGesture || upcomingTaskGesture.id !== event.pointerId) return;
    upcomingTaskGesture.ready = true;
    upcomingSuppressTaskClick = true;
    if (!selectedTaskIds.has(row.dataset.id)) selectUpcomingTask(row.dataset.id, true);
  }, 450);
});
window.addEventListener("pointermove", event => {
  const gesture = upcomingTaskGesture;
  if (!gesture || gesture.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
  if (!gesture.ready && distance > 10) { clearTimeout(gesture.timer); return; }
  if (!gesture.ready || (!gesture.dragging && distance < 8)) return;
  gesture.currentX = event.clientX;
  gesture.currentY = event.clientY;
  if (!gesture.dragging) {
    const source = upcoming.feed.querySelector(`[data-id="${CSS.escape(gesture.taskId)}"]`);
    if (!source) return;
    clearTimeout(gesture.timer);
    gesture.ids = selectedTaskIds.has(gesture.taskId) ? new Set(selectedTaskIds) : new Set([gesture.taskId]);
    gesture.source = source;
    gesture.sourceRect = source.getBoundingClientRect();
    gesture.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gesture.previewX = 0;
    gesture.previewY = 0;
    const day = source.parentElement;
    gesture.rows = [...day.querySelectorAll(".swipe-row")].filter(row => gesture.ids.has(row.dataset.id));
    gesture.placeholder = document.createElement("div");
    gesture.placeholder.className = "drag-placeholder";
    gesture.placeholder.setAttribute("aria-hidden", "true");
    const height = gesture.rows.reduce((sum, row) => sum + row.getBoundingClientRect().height
      + parseFloat(getComputedStyle(row).marginBottom), 0);
    gesture.placeholder.style.height = `${height}px`;
    gesture.placeholder.style.borderRadius = "var(--radius)";
    gesture.rows[0].before(gesture.placeholder);
    gesture.rows.forEach(row => row.classList.add("drag-source"));
    gesture.ghost = document.createElement("div");
    gesture.ghost.className = "drag-preview";
    gesture.ghost.setAttribute("aria-hidden", "true");
    gesture.ghost.inert = true;
    gesture.ghost.style.left = `${gesture.sourceRect.left}px`;
    gesture.ghost.style.top = `${gesture.sourceRect.top}px`;
    gesture.ghost.style.width = `${gesture.sourceRect.width}px`;
    gesture.ghost.append(source.querySelector(".task-card").cloneNode(true));
    if (gesture.ids.size > 1) {
      const badge = document.createElement("span");
      badge.className = "drag-count";
      badge.textContent = gesture.ids.size;
      gesture.ghost.append(badge);
    }
    document.body.append(gesture.ghost);
    gesture.scrollFrame = requestAnimationFrame(scrollUpcomingDuringDrag);
  }
  gesture.dragging = true;
  upcomingSuppressTaskClick = true;
  gesture.scrollTop = upcoming.feed.scrollTop;
  highlightUpcomingDrop(gesture, upcomingDropTarget(gesture, event.clientX, event.clientY));
});
window.addEventListener("pointerup", async event => {
  const gesture = upcomingTaskGesture;
  if (!gesture || gesture.id !== event.pointerId) return;
  upcomingTaskGesture = null;
  clearTimeout(gesture.timer);
  cancelAnimationFrame(gesture.scrollFrame);
  if (!gesture.dragging) return;
  const drop = event.clientX === gesture.currentX && event.clientY === gesture.currentY
    ? gesture.target : upcomingDropTarget(gesture, event.clientX, event.clientY);
  gesture.target?.element.classList.remove(gesture.target.marker);
  if (!drop) { await finishUpcomingGhost(gesture, null); return; }
  const destination = drop.date;
  const reorder = destination === gesture.date;
  const changed = reorder
    ? reorderUpcomingTasks(upcomingTasks().filter(task => task.dueDate === destination),
      gesture.ids, drop.element.dataset.id, drop.after)
    : tasks.filter(task => gesture.ids.has(task.id) && task.dueDate !== destination)
      .map(task => ({ ...task, dueDate: destination, updatedAt: new Date().toISOString() }));
  if (!changed.length) { await finishUpcomingGhost(gesture, null); return; }
  try {
    await taskDb.putMany(changed);
    rememberUpcomingFeedScroll();
    selectedTaskIds = new Set();
    await refresh();
    const target = upcoming.feed.querySelector(`.upcoming-feed-day[data-date="${destination}"] [data-id="${CSS.escape(gesture.taskId)}"] .task-card`)
      || upcoming.feed.querySelector(`.upcoming-feed-day[data-date="${destination}"] h2`)
      || upcoming.week.querySelector(`[data-date="${destination}"]`);
    if (target) target.style.visibility = "hidden";
    try { await finishUpcomingGhost(gesture, target); }
    finally { if (target) target.style.visibility = ""; }
    toast(reorder ? "Порядок завдань збережено"
      : changed.length === 1 ? "Дату завдання змінено" : `Змінено дату завдань: ${changed.length}`);
  } catch (_error) {
    upcomingScrollRestore = null;
    await finishUpcomingGhost(gesture, null);
    await refresh();
    toast(reorder ? "Не вдалося змінити порядок завдань" : "Не вдалося змінити дату");
  }
});
window.addEventListener("pointercancel", event => {
  if (upcomingTaskGesture?.id !== event.pointerId) return;
  clearTimeout(upcomingTaskGesture.timer);
  cancelAnimationFrame(upcomingTaskGesture.scrollFrame);
  upcomingTaskGesture.target?.element.classList.remove(upcomingTaskGesture.target.marker);
  restoreUpcomingDragRows(upcomingTaskGesture);
  upcomingTaskGesture.ghost?.remove();
  upcomingTaskGesture = null;
});
upcoming.month.addEventListener("click", openUpcomingCalendar);
document.querySelector("#upcoming-today").addEventListener("click", () => selectUpcomingDate(localDateValue()));
document.querySelector("#upcoming-calendar-cancel").addEventListener("click", closeUpcomingCalendar);
document.querySelector("#upcoming-calendar-today").addEventListener("click", () => { closeUpcomingCalendar(); selectUpcomingDate(localDateValue()); });
for (const [id, direction] of [["upcoming-calendar-previous", -1], ["upcoming-calendar-next", 1]]) document.querySelector(`#${id}`).addEventListener("click", () => {
  upcomingCalendarMonth = new Date(upcomingCalendarMonth.getFullYear(), upcomingCalendarMonth.getMonth() + direction, 1, 12);
  renderUpcomingCalendar();
});
upcoming.grid.addEventListener("click", event => { const day = event.target.closest("[data-date]"); if (day) { closeUpcomingCalendar(); selectUpcomingDate(day.dataset.date); } });
upcoming.backdrop.addEventListener("click", event => { if (event.target === upcoming.backdrop) closeUpcomingCalendar(); });
upcoming.backdrop.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeUpcomingCalendar(); }
  if (event.key !== "Tab") return;
  const buttons = [...upcoming.backdrop.querySelectorAll("button")];
  if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
  if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
});
