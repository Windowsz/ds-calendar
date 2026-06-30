import { TimeSlot, TimeSlotGroup } from '../models/time-slot.model';
import { SlotDuration, ViewType } from '../models/view.model';
import {
  addMinutes, addHours, addDays, addWeeks, addMonths,
  startOfWeek, startOfMonth, endOfMonth,
  isWeekend, isToday, formatSlotLabel, formatGroupLabel,
} from './date.utils';

export function slotDurationToMinutes(slotDuration: SlotDuration): number {
  switch (slotDuration) {
    case '00:15:00': return 15;
    case '00:30:00': return 30;
    case '01:00:00': return 60;
    case 'day':      return 1440;
    case 'week':     return 10080;
    case 'month':    return 43200;
    default:         return 60;
  }
}

export function getViewSlotDuration(viewType: ViewType): SlotDuration {
  switch (viewType) {
    case 'resourceTimelineDay':
    case 'timeGridDay':    return '01:00:00';
    case 'timeGridWeek':   return '01:00:00';
    case 'resourceTimeline':
    case 'resourceTimelineWeek': return 'day';
    case 'resourceTimelineMonth':
    case 'dayGridMonth':   return 'day';
    default:               return 'day';
  }
}

export function getViewRange(viewType: ViewType, currentDate: Date, weekStartsOn: 0 | 1 = 1): { start: Date; end: Date } {
  switch (viewType) {
    case 'timeGridDay':
    case 'resourceTimelineDay': {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'timeGridWeek':
    case 'resourceTimeline':
    case 'resourceTimelineWeek': {
      const start = startOfWeek(currentDate, weekStartsOn);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'dayGridMonth':
    case 'resourceTimelineMonth':
    default: {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
  }
}

export function generateTimeSlots(
  viewStart: Date,
  viewEnd: Date,
  slotDuration: SlotDuration,
  locale = 'en-US',
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = new Date(viewStart);

  while (current.getTime() < viewEnd.getTime()) {
    let next: Date;
    switch (slotDuration) {
      case '00:15:00': next = addMinutes(current, 15);  break;
      case '00:30:00': next = addMinutes(current, 30);  break;
      case '01:00:00': next = addHours(current, 1);     break;
      case 'day':      next = addDays(current, 1);      break;
      case 'week':     next = addWeeks(current, 1);     break;
      case 'month':    next = addMonths(current, 1);    break;
      default:         next = addHours(current, 1);
    }
    // Clamp next to viewEnd so we don't overshoot
    if (next.getTime() > viewEnd.getTime()) {
      next = new Date(viewEnd);
    }

    slots.push({
      start: new Date(current),
      end:   new Date(next),
      label: formatSlotLabel(current, slotDuration, locale),
      key:   current.toISOString(),
      isWeekend: isWeekend(current),
      isToday:   isToday(current),
    });
    current = next;
  }

  return slots;
}

export function generateTimeSlotGroups(
  viewStart: Date,
  viewEnd: Date,
  slotDuration: SlotDuration,
  locale = 'en-US',
): TimeSlotGroup[] {
  const slots = generateTimeSlots(viewStart, viewEnd, slotDuration, locale);
  const groups: TimeSlotGroup[] = [];
  const groupMap = new Map<string, { label: string; slots: TimeSlot[] }>();

  for (const slot of slots) {
    const key = buildGroupKey(slot.start, slotDuration);
    if (!groupMap.has(key)) {
      groupMap.set(key, { label: formatGroupLabel(slot.start, slotDuration, locale), slots: [] });
    }
    groupMap.get(key)!.slots.push(slot);
  }

  groupMap.forEach(({ label, slots: groupSlots }, key) => {
    groups.push({ label, key, slots: groupSlots, colSpan: groupSlots.length });
  });

  return groups;
}

function buildGroupKey(date: Date, slotDuration: SlotDuration): string {
  switch (slotDuration) {
    case '00:15:00':
    case '00:30:00':
    case '01:00:00':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    case 'day':
    case 'week':
      return `${date.getFullYear()}-${date.getMonth()}`;
    case 'month':
      return `${date.getFullYear()}`;
    default:
      return `${date.getFullYear()}-${date.getMonth()}`;
  }
}

export function dateToPixels(
  date: Date,
  viewStart: Date,
  slotDurationMinutes: number,
  slotWidthPx: number,
): number {
  const minutesFromStart = (date.getTime() - viewStart.getTime()) / 60000;
  return (minutesFromStart / slotDurationMinutes) * slotWidthPx;
}

export function pixelsToDate(
  pixels: number,
  viewStart: Date,
  slotDurationMinutes: number,
  slotWidthPx: number,
): Date {
  const minutesFromStart = (pixels / slotWidthPx) * slotDurationMinutes;
  return new Date(viewStart.getTime() + minutesFromStart * 60000);
}

export function generateHourSlots(firstHour: number, lastHour: number): number[] {
  const hours: number[] = [];
  for (let h = firstHour; h < lastHour; h++) {
    hours.push(h);
  }
  return hours;
}

export function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatHourLabel(hour: number): string {
  return `${padZero(hour)}:00`;
}
