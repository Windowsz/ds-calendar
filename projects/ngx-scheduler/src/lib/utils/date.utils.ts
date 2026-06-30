export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const start = startOfWeek(date, weekStartsOn);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== originalDay) {
    d.setDate(0); // Overflow: e.g. Jan 31 + 1 month → Feb 28
  }
  return d;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3600 * 1000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

export function dateDiffInMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60000;
}

export function dateDiffInDays(start: Date, end: Date): number {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000);
}

export function snapToInterval(date: Date, intervalMinutes: number): Date {
  const ms = intervalMinutes * 60000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date.getTime() < min.getTime()) return new Date(min);
  if (date.getTime() > max.getTime()) return new Date(max);
  return date;
}

export function generateDayRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(start);
  const last = startOfDay(end);
  while (current.getTime() <= last.getTime()) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

export function generateWeekMatrix(currentDate: Date, weekStartsOn: 0 | 1 = 1): Date[][] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  let gridStart = startOfWeek(monthStart, weekStartsOn);
  const weeks: Date[][] = [];
  let curr = new Date(gridStart);

  while (curr.getTime() <= monthEnd.getTime() || weeks.length < 4) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr));
      curr = addDays(curr, 1);
    }
    weeks.push(week);
    if (curr.getTime() > monthEnd.getTime() && weeks.length >= 4) break;
  }
  return weeks;
}

export function formatIntl(date: Date, options: Intl.DateTimeFormatOptions, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatSlotLabel(date: Date, slotDuration: string, locale = 'en-US'): string {
  switch (slotDuration) {
    case '00:15:00':
    case '00:30:00':
    case '01:00:00':
      return formatIntl(date, { hour: '2-digit', minute: '2-digit', hour12: false }, locale);
    case 'day':
      return formatIntl(date, { month: 'short', day: 'numeric' }, locale);
    case 'week':
      return formatIntl(date, { month: 'short', day: 'numeric' }, locale);
    case 'month':
      return formatIntl(date, { month: 'long', year: 'numeric' }, locale);
    default:
      return formatIntl(date, { month: 'short', day: 'numeric' }, locale);
  }
}

export function formatGroupLabel(date: Date, slotDuration: string, locale = 'en-US'): string {
  switch (slotDuration) {
    case '00:15:00':
    case '00:30:00':
    case '01:00:00':
      return formatIntl(date, { weekday: 'short', month: 'short', day: 'numeric' }, locale);
    case 'day':
    case 'week':
      return formatIntl(date, { month: 'long', year: 'numeric' }, locale);
    case 'month':
      return String(date.getFullYear());
    default:
      return formatIntl(date, { month: 'long', year: 'numeric' }, locale);
  }
}

export function formatHeaderTitle(date: Date, viewType: string, locale = 'en-US'): string {
  switch (viewType) {
    case 'timeGridDay':
    case 'resourceTimelineDay':
      return formatIntl(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }, locale);
    case 'timeGridWeek':
    case 'resourceTimelineWeek':
    case 'resourceTimeline': {
      const s = startOfWeek(date, 1);
      const e = endOfWeek(date, 1);
      return `${formatIntl(s, { month: 'short', day: 'numeric' }, locale)} – ${formatIntl(e, { month: 'short', day: 'numeric', year: 'numeric' }, locale)}`;
    }
    case 'dayGridMonth':
    case 'resourceTimelineMonth':
    default:
      return formatIntl(date, { month: 'long', year: 'numeric' }, locale);
  }
}
