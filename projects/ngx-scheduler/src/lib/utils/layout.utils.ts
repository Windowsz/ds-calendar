import { NgxEvent } from '../models/event.model';
import { EventBlock } from '../models/time-slot.model';

export interface TimelineEventBlockOptions {
  events: NgxEvent[];
  viewStart: Date;
  viewEnd: Date;
  slotWidthPx: number;
  slotDurationMinutes: number;
  rowHeightPx: number;
  resourceId: string;
}

export interface TimeGridEventBlockOptions {
  events: NgxEvent[];
  dayStart: Date;
  dayEnd: Date;
  totalMinutes: number;
  containerHeightPx: number;
}

/**
 * Computes absolutely-positioned event blocks for the Resource Timeline grid.
 * Returns left/width in pixels, top/height in pixels (within the row).
 */
export function computeTimelineEventBlocks(opts: TimelineEventBlockOptions): EventBlock[] {
  const { events, viewStart, viewEnd, slotWidthPx, slotDurationMinutes, rowHeightPx, resourceId } = opts;

  const visible = events.filter(e =>
    e.resourceId === resourceId &&
    e.end.getTime() > viewStart.getTime() &&
    e.start.getTime() < viewEnd.getTime()
  );

  if (visible.length === 0) return [];

  const sorted = [...visible].sort((a, b) => a.start.getTime() - b.start.getTime());
  const columns = assignColumnsChronological(sorted);
  const totalCols = columns.length;
  const colHeight = rowHeightPx / Math.max(totalCols, 1);
  const blocks: EventBlock[] = [];

  columns.forEach((col, colIdx) => {
    for (const event of col) {
      const clampedStart = event.start.getTime() < viewStart.getTime() ? viewStart : event.start;
      const clampedEnd   = event.end.getTime()   > viewEnd.getTime()   ? viewEnd   : event.end;

      const startMin = (clampedStart.getTime() - viewStart.getTime()) / 60000;
      const endMin   = (clampedEnd.getTime()   - viewStart.getTime()) / 60000;

      const left  = (startMin / slotDurationMinutes) * slotWidthPx;
      const width = Math.max(((endMin - startMin) / slotDurationMinutes) * slotWidthPx - 2, 4);

      blocks.push({
        event,
        left,
        width,
        top:    colIdx * colHeight,
        height: colHeight - 2,
        zIndex: colIdx + 1,
        column: colIdx,
        totalColumns: totalCols,
      });
    }
  });

  return blocks;
}

/**
 * Computes percentage-based event blocks for the Time Grid (day/week) view.
 * top/height are % of the total container height.
 * left/width are % of the column width.
 */
export function computeTimeGridEventBlocks(opts: TimeGridEventBlockOptions): EventBlock[] {
  const { events, dayStart, dayEnd, totalMinutes, containerHeightPx: _ } = opts;

  const visible = events.filter(e =>
    e.end.getTime() > dayStart.getTime() &&
    e.start.getTime() < dayEnd.getTime()
  );

  if (visible.length === 0) return [];

  const sorted = [...visible].sort((a, b) => a.start.getTime() - b.start.getTime());
  const groups = groupOverlapping(sorted);
  const blocks: EventBlock[] = [];

  for (const group of groups) {
    const columns = assignColumnsChronological(group);
    const totalCols = columns.length;
    const colWidthPct = 100 / totalCols;

    columns.forEach((col, colIdx) => {
      for (const event of col) {
        const clampedStart = event.start.getTime() < dayStart.getTime() ? dayStart : event.start;
        const clampedEnd   = event.end.getTime()   > dayEnd.getTime()   ? dayEnd   : event.end;

        const startMin = (clampedStart.getTime() - dayStart.getTime()) / 60000;
        const endMin   = (clampedEnd.getTime()   - dayStart.getTime()) / 60000;

        const top    = (startMin / totalMinutes) * 100;
        const height = Math.max(((endMin - startMin) / totalMinutes) * 100, 1.5);

        blocks.push({
          event,
          top,
          height,
          left:   colIdx * colWidthPct + 0.5,
          width:  colWidthPct - 1,
          zIndex: colIdx + 1,
          column: colIdx,
          totalColumns: totalCols,
        });
      }
    });
  }

  return blocks;
}

// ---- Internal helpers ----

function eventsOverlap(a: NgxEvent, b: NgxEvent): boolean {
  return a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime();
}

function groupOverlapping(events: NgxEvent[]): NgxEvent[][] {
  const groups: NgxEvent[][] = [];
  for (const event of events) {
    let placed = false;
    for (const group of groups) {
      if (group.some(e => eventsOverlap(event, e))) {
        group.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([event]);
  }
  return groups;
}

function assignColumnsChronological(events: NgxEvent[]): NgxEvent[][] {
  const columns: NgxEvent[][] = [];
  for (const event of events) {
    let placed = false;
    for (const col of columns) {
      if (!eventsOverlap(event, col[col.length - 1])) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  }
  return columns;
}
