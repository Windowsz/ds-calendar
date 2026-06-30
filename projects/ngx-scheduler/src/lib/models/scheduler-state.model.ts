import { NgxEvent } from './event.model';
import { NgxResource } from './resource.model';
import { ViewType, SchedulerConfig, DEFAULT_CONFIG } from './view.model';

export interface DragState {
  eventId: string;
  originalStart: Date;
  originalEnd: Date;
  currentStart: Date;
  currentEnd: Date;
  currentResourceId?: string;
  originalResourceId?: string;
}

export interface ResizeState {
  eventId: string;
  originalStart: Date;
  originalEnd: Date;
  currentEnd: Date;
  edge: 'start' | 'end';
}

export interface SchedulerState {
  currentDate: Date;
  viewType: ViewType;
  events: NgxEvent[];
  resources: NgxResource[];
  selectedEventId: string | null;
  dragState: DragState | null;
  resizeState: ResizeState | null;
  loading: boolean;
  config: SchedulerConfig;
}

export const INITIAL_STATE: SchedulerState = {
  currentDate: new Date(),
  viewType: 'resourceTimeline',
  events: [],
  resources: [],
  selectedEventId: null,
  dragState: null,
  resizeState: null,
  loading: false,
  config: { ...DEFAULT_CONFIG },
};
