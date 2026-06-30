import { NgxEvent } from './event.model';

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
  key: string;
  isWeekend: boolean;
  isToday: boolean;
}

export interface TimeSlotGroup {
  label: string;
  key: string;
  slots: TimeSlot[];
  colSpan: number;
}

export interface EventBlock {
  event: NgxEvent;
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  column: number;
  totalColumns: number;
}

export interface DragPlaceholder {
  left: number;
  top: number;
  width: number;
  height: number;
  resourceId: string;
}
