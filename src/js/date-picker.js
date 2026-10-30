const calendarMonthNames = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жов", "лист", "груд"];
let calendarRangeMode = "month";
let pendingDateValue = null;
let pendingTimeValue = "";
let draftTimeHour = 0;
let draftTimeMinute = 0;
let timePickerPhase = "hour";
let timeDialogReturnFocus = null;
let visibleCalendarEnd = null;
let calendarAnchorDay = null;
let datePickerReturnFocus = null;

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
  requestAnimationFrame(() => els.timeDialog.focus());
}

function closeTimeDialog({ restoreFocus = true } = {}) {
  els.timeDialogBackdrop.hidden = true;
  document.body.classList.remove("time-dialog-open");
  if (restoreFocus) timeDialogReturnFocus?.focus();
}

function saveTimeDialog() {
  normalizeDraftTimeInputs();
  pendingTimeValue = `${String(draftTimeHour).padStart(2, "0")}:${String(draftTimeMinute).padStart(2, "0")}`;
  setPendingDate(pendingDateValue);
  closeTimeDialog();
}

function calendarRangeStart(end) {
  if (calendarRangeMode !== "month") {
    const days = { "1-week": 7, "2-weeks": 14, "3-weeks": 21 }[calendarRangeMode];
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    return start;
  }
  const start = new Date(end.getFullYear(), end.getMonth() - 1, 1, 12);
  start.setDate(Math.min(end.getDate(), new Date(end.getFullYear(), end.getMonth(), 0).getDate()));
  return start;
}

function shiftCalendarRange(direction) {
  if (calendarRangeMode === "month") {
    const target = new Date(visibleCalendarEnd.getFullYear(), visibleCalendarEnd.getMonth() + direction, 1, 12);
    target.setDate(Math.min(calendarAnchorDay, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    visibleCalendarEnd = target;
  } else {
    const days = { "1-week": 7, "2-weeks": 14, "3-weeks": 21 }[calendarRangeMode];
    visibleCalendarEnd.setDate(visibleCalendarEnd.getDate() + direction * days);
  }
  renderCalendar();
}

function showCalendarDate(value) {
  visibleCalendarEnd = dateFromValue(value);
  calendarAnchorDay = visibleCalendarEnd.getDate();
  renderCalendar();
}

function calendarRangeLabel(start, end) {
  const crossesYear = start.getFullYear() !== end.getFullYear();
  const label = date => `${date.getDate()} ${calendarMonthNames[date.getMonth()]}${crossesYear ? ` ${date.getFullYear()}` : ""}`;
  return `${label(start)} – ${label(end)}`;
}

function renderCalendar() {
  if (!visibleCalendarEnd) return;
  const todayValue = localDateValue();
  const start = calendarRangeStart(visibleCalendarEnd);
  els.calendarPrevious.disabled = false;
  els.calendarMonth.textContent = calendarRangeLabel(start, visibleCalendarEnd);
  const firstWeekday = (start.getDay() + 6) % 7;
  const cells = Array.from({ length: firstWeekday }, () => {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    return spacer;
  });
  for (const date = new Date(start); date <= visibleCalendarEnd; date.setDate(date.getDate() + 1)) {
    const value = localDateValue(date);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = value;
    button.textContent = date.getDate();
    button.classList.toggle("outside-month", date.getMonth() !== visibleCalendarEnd.getMonth() || date.getFullYear() !== visibleCalendarEnd.getFullYear());
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
  const initial = initialValue || localDateValue();
  const today = new Date();
  const initialDate = dateFromValue(initial);
  const currentEnd = dateFromValue(localDateValue());
  visibleCalendarEnd = initialDate > currentEnd ? initialDate : currentEnd;
  if (initialDate < calendarRangeStart(visibleCalendarEnd)) visibleCalendarEnd = initialDate;
  calendarAnchorDay = visibleCalendarEnd.getDate();
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
