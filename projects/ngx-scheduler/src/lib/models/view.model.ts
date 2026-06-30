export type ViewType =
  | 'dayGridMonth'
  | 'timeGridDay'
  | 'timeGridWeek'
  | 'resourceTimeline'
  | 'resourceTimelineDay'
  | 'resourceTimelineWeek'
  | 'resourceTimelineMonth';

export type SlotDuration = '00:15:00' | '00:30:00' | '01:00:00' | 'day' | 'week' | 'month';

export interface ViewConfig {
  type: ViewType;
  label: string;
  slotDuration: SlotDuration;
}

export interface SchedulerConfig {
  slotDuration: SlotDuration;
  resourceColumnWidth: number;
  rowHeight: number;
  slotWidth: number;
  weekStartsOn: 0 | 1;
  snapMinutes: number;
  locale: string;
  firstHour: number;
  lastHour: number;
  headerViews: ViewType[];
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  slotDuration: 'day',
  resourceColumnWidth: 200,
  rowHeight: 50,
  slotWidth: 60,
  weekStartsOn: 1,
  snapMinutes: 30,
  locale: 'en-US',
  firstHour: 0,
  lastHour: 24,
  headerViews: ['resourceTimeline', 'resourceTimelineWeek', 'resourceTimelineMonth'],
};
