const calendarMonthNames = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жов", "лист", "груд"];
let calendarRangeMode = "month";
let pendingDateValue = null;
let pendingTimeValue = "";
let draftTimeHour = 0;
let draftTimeMinute = 0;
let timePickerPhase = "hour";
let timeDialogReturnFocus = null;
let visibleCalendarStart = null;
let datePickerReturnFocus = null;
let calendarTransition = null;

function dateFromValue(value) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function setPendingDate(value) {
  pendingDateValue = value || "";
  if (!pendingDateValue) pendingTimeValue = "";
  els.datePickerValue.textContent = value ? `${fullDateFormatter.format(dateFromValue(value))}${pendingTimeValue ? ` · ${pendingTimeValue}` : ""}` : "Без дати";
  els.timePickerOpen.disabled = !pendingDateValue;
  els.timePickerClear.disabled = !pendingDateValue || !pendingTimeValue;
  els.timePickerLabel.textContent = pendingTimeValue || "Додати час";
  document.querySelectorAll("[data-date-shortcut]").forEach(button => {
    const shortcutValue = button.dataset.dateShortcut === "today" ? localDateValue()
      : button.dataset.dateShortcut === "tomorrow" ? localDateValue(new Date(Date.now() + 86400000)) : "";
    button.classList.toggle("selected", shortcutValue === pendingDateValue);
    button.setAttribute("aria-pressed", String(shortcutValue === pendingDateValue));
  });
  renderCalendar();
}

function renderTimeDial({ preserveDisplay = false } = {}) {
  const value = timePickerPhase === "hour" ? draftTimeHour : draftTimeMinute;
  if (!preserveDisplay) {
    els.timeDisplayHour.value = String(draftTimeHour).padStart(2, "0");
    els.timeDisplayMinute.value = String(draftTimeMinute).padStart(2, "0");
  }
  els.timeDisplayHour.classList.toggle("active", timePickerPhase === "hour");
  els.timeDisplayMinute.classList.toggle("active", timePickerPhase === "minute");
  els.timeDial.dataset.phase = timePickerPhase;
  const values = timePickerPhase === "hour" ? Array.from({ length: 24 }, (_, index) => index) : Array.from({ length: 12 }, (_, index) => index * 5);
  const options = values.map(optionValue => {
    const button = document.createElement("button");
    const angle = (timePickerPhase === "hour" ? optionValue % 12 : optionValue / 5) * 30;
    const radius = timePickerPhase === "hour" && optionValue >= 12 ? 74 : 108;
    button.type = "button";
    button.dataset.timeValue = String(optionValue);
    button.style.setProperty("--dial-angle", `${angle}deg`);
    button.style.setProperty("--dial-radius", `${radius}px`);
    button.textContent = timePickerPhase === "minute" ? String(optionValue).padStart(2, "0") : String(optionValue);
    button.classList.toggle("selected", optionValue === value);
    button.setAttribute("aria-label", timePickerPhase === "hour" ? `${optionValue} година` : `${optionValue} хвилин`);
    button.setAttribute("aria-pressed", String(optionValue === value));
    return button;
  });
  const handAngle = (timePickerPhase === "hour" ? draftTimeHour % 12 : draftTimeMinute / 5) * 30;
  const handRadius = timePickerPhase === "hour" && draftTimeHour >= 12 ? 74 : 108;
  els.timeDial.style.setProperty("--hand-angle", `${handAngle}deg`);
  els.timeDial.style.setProperty("--hand-radius", `${handRadius}px`);
  els.timeDialOptions.replaceChildren(...options);
}

function updateDraftTimeInput(input, phase) {
  const maximum = phase === "hour" ? 23 : 59;
  const digits = input.value.replace(/\D/g, "").slice(0, 2);
  input.value = digits;
  if (!digits) return;
  const value = Math.min(Number(digits), maximum);
  input.value = String(value);
  timePickerPhase = phase;
  if (phase === "hour") draftTimeHour = value;
  else draftTimeMinute = value;
  renderTimeDial({ preserveDisplay: true });
  if (phase === "hour" && digits.length === 2) {
    requestAnimationFrame(() => {
      els.timeDisplayMinute.focus();
      els.timeDisplayMinute.select();
    });
  }
}

function normalizeDraftTimeInputs() {
  const hour = Number(els.timeDisplayHour.value);
  const minute = Number(els.timeDisplayMinute.value);
  if (els.timeDisplayHour.value !== "" && Number.isFinite(hour)) draftTimeHour = Math.min(Math.max(hour, 0), 23);
  if (els.timeDisplayMinute.value !== "" && Number.isFinite(minute)) draftTimeMinute = Math.min(Math.max(minute, 0), 59);
  renderTimeDial();
}

function openTimeDialog() {
  if (!pendingDateValue) return;
  const now = new Date();
  const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5;
  const [hour, minute] = pendingTimeValue ? pendingTimeValue.split(":").map(Number) : [(now.getHours() + (roundedMinutes === 60 ? 1 : 0)) % 24, roundedMinutes % 60];
  draftTimeHour = hour;
  draftTimeMinute = minute;
  timePickerPhase = "hour";
  timeDialogReturnFocus = document.activeElement;
  renderTimeDial();
  els.timeDialogBackdrop.hidden = false;
  document.body.classList.add("time-dialog-open");
  requestAnimationFrame(() => {
    els.timeDisplayHour.focus({ preventScroll: true });
    els.timeDisplayHour.select();
  });
}

async function closeTimeDialog({ restoreFocus = true, animate = false } = {}) {
  if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const closing = els.timeDialog.animate([
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 0, transform: "translateY(18px) scale(.97)" }
    ], { duration: 200, easing: "cubic-bezier(.4,0,1,1)" });
    await closing.finished.catch(() => {});
  }
  els.timeDialogBackdrop.hidden = true;
  document.body.classList.remove("time-dialog-open");
  if (restoreFocus) timeDialogReturnFocus?.focus();
}

async function saveTimeDialog() {
  normalizeDraftTimeInputs();
  pendingTimeValue = `${String(draftTimeHour).padStart(2, "0")}:${String(draftTimeMinute).padStart(2, "0")}`;
  setPendingDate(pendingDateValue);
  await closeTimeDialog({ restoreFocus: false, animate: true });
  await savePendingDateSelection();
}

function calendarWeekStart(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  return start;
}

function calendarRangeEnd(start) {
  const end = new Date(start);
  if (calendarRangeMode === "month") {
    const nextMonth = new Date(start.getFullYear(), start.getMonth() + 2, 0, 12);
    end.setMonth(end.getMonth() + 1, 1);
    end.setDate(Math.min(start.getDate(), nextMonth.getDate()));
  }
  else end.setDate(end.getDate() + ({ "1-week": 2, "2-weeks": 3, "3-weeks": 4 }[calendarRangeMode] || 2) * 7);
  end.setDate(end.getDate() - 1);
  return end;
}

function shiftCalendarRange(direction) {
  calendarTransition?.();
  calendarTransition = null;
  const grid = els.calendarGrid;
  const panel = grid.closest(".calendar-panel");
  const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches && !els.datePickerBackdrop.hidden;
  const previous = animate ? grid.cloneNode(true) : null;
  const oldHeight = grid.offsetHeight;
  if (calendarRangeMode === "month") {
    const target = new Date(visibleCalendarStart.getFullYear(), visibleCalendarStart.getMonth() + direction, 1, 12);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
    target.setDate(Math.min(visibleCalendarStart.getDate(), lastDay));
    visibleCalendarStart = target;
  }
  else visibleCalendarStart.setDate(visibleCalendarStart.getDate() + direction * ({ "1-week": 2, "2-weeks": 3, "3-weeks": 4 }[calendarRangeMode] || 2) * 7);
  renderCalendar();
  if (!previous) return;
  previous.removeAttribute("id");
  previous.setAttribute("aria-hidden", "true");
  previous.style.cssText = `position:absolute;top:${grid.offsetTop}px;left:${grid.offsetLeft}px;width:${grid.offsetWidth}px;height:${oldHeight}px;pointer-events:none;`;
  panel.append(previous);
  const distance = grid.offsetWidth * .28 * direction;
  const options = { duration: 270, easing: "cubic-bezier(.22,1,.36,1)" };
  const outgoing = previous.animate([
    { transform: "translateX(0)", opacity: 1 },
    { transform: `translateX(${-distance}px)`, opacity: 0 }
  ], options);
  const incoming = grid.animate([
    { transform: `translateX(${distance}px)`, opacity: 0 },
    { transform: "translateX(0)", opacity: 1 }
  ], options);
  const cleanup = () => {
    outgoing.cancel();
    incoming.cancel();
    previous.remove();
    if (calendarTransition === cleanup) calendarTransition = null;
  };
  calendarTransition = cleanup;
  incoming.addEventListener("finish", cleanup, { once: true });
}

function enableCalendarSwipe() {
  const panel = els.calendarGrid.closest(".calendar-panel");
  let gesture = null;
  let suppressClick = false;

  panel.addEventListener("pointerdown", event => {
    suppressClick = false;
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)
      || event.target.closest(".calendar-toolbar button")) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  window.addEventListener("pointerup", event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (els.datePickerBackdrop.hidden || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    suppressClick = true;
    shiftCalendarRange(dx > 0 ? -1 : 1);
  });

  window.addEventListener("pointercancel", event => {
    if (gesture?.id === event.pointerId) gesture = null;
  });

  panel.addEventListener("click", event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
}

function enableCalendarLongPress() {
  const grid = els.calendarGrid;
  let press = null;
  let suppressClick = false;
  const cancel = () => {
    if (press) clearTimeout(press.timer);
    press = null;
  };
  grid.addEventListener("pointerdown", event => {
    const button = event.target.closest("button[data-date]");
    if (!button || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    suppressClick = false;
    cancel();
    press = { id: event.pointerId, x: event.clientX, y: event.clientY,
      timer: setTimeout(() => {
        if (els.datePickerBackdrop.hidden) return;
        suppressClick = true;
        setPendingDate(button.dataset.date);
        openTimeDialog();
        press = null;
      }, 550) };
  });
  window.addEventListener("pointermove", event => {
    if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) cancel();
  });
  window.addEventListener("pointerup", event => { if (press?.id === event.pointerId) cancel(); });
  window.addEventListener("pointercancel", event => { if (press?.id === event.pointerId) cancel(); });
  grid.addEventListener("contextmenu", event => {
    if (event.target.closest("button[data-date]")) event.preventDefault();
  });
  grid.addEventListener("click", event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
}

function showCalendarDate(value) {
  visibleCalendarStart = calendarWeekStart(dateFromValue(value));
  renderCalendar();
}

function calendarRangeLabel(start, end) {
  const crossesYear = start.getFullYear() !== end.getFullYear();
  const label = date => `${date.getDate()} ${calendarMonthNames[date.getMonth()]}${crossesYear ? ` ${date.getFullYear()}` : ""}`;
  return `${label(start)} – ${label(end)}`;
}

function renderCalendar() {
  if (!visibleCalendarStart) return;
  const todayValue = localDateValue();
  const start = visibleCalendarStart;
  const end = calendarRangeEnd(start);
  els.calendarPrevious.disabled = false;
  els.calendarMonth.textContent = calendarRangeLabel(start, end);
  const firstWeekday = (start.getDay() + 6) % 7;
  const cells = Array.from({ length: firstWeekday }, () => {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    return spacer;
  });
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const value = localDateValue(date);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = value;
    button.textContent = date.getDate();
    button.classList.toggle("outside-month", date.getMonth() !== start.getMonth() || date.getFullYear() !== start.getFullYear());
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", fullDateFormatter.format(dateFromValue(value)));
    if (value === todayValue) { button.classList.add("today"); button.setAttribute("aria-current", "date"); }
    if (value === pendingDateValue) { button.classList.add("selected"); button.setAttribute("aria-selected", "true"); }
    cells.push(button);
  }
  els.calendarGrid.replaceChildren(...cells);
}

function openDatePicker(initialValue = els.date.value, initialTime = els.time.value) {
  datePickerReturnFocus = document.activeElement;
  const today = new Date();
  visibleCalendarStart = calendarWeekStart(dateFromValue(localDateValue()));
  els.todayWeekday.textContent = weekdayFormatter.format(today);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  els.tomorrowWeekday.textContent = weekdayFormatter.format(tomorrow);
  els.datePickerBackdrop.hidden = false;
  document.body.classList.add("date-picker-open");
  pendingTimeValue = initialValue ? (initialTime || "") : "";
  setPendingDate(initialValue);
  requestAnimationFrame(() => els.datePicker.focus());
}

function closeDatePicker() {
  els.datePickerBackdrop.hidden = true;
  document.body.classList.remove("date-picker-open");
  datePickerReturnFocus?.focus();
}
