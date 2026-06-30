// Module
export { NgxSchedulerModule } from './lib/ngx-scheduler.module';

// Models
export { NgxEvent }                  from './lib/models/event.model';
export { NgxResource }               from './lib/models/resource.model';
export {
  ViewType, SlotDuration, ViewConfig,
  SchedulerConfig, DEFAULT_CONFIG,
}                                    from './lib/models/view.model';
export {
  TimeSlot, TimeSlotGroup,
  EventBlock, DragPlaceholder,
}                                    from './lib/models/time-slot.model';
export {
  DragState, ResizeState,
  SchedulerState, INITIAL_STATE,
}                                    from './lib/models/scheduler-state.model';

// Store
export { SchedulerStoreService }     from './lib/store/scheduler-store.service';

// Directives
export { NgxDraggableDirective, NgxDragPayload }   from './lib/directives/draggable.directive';
export { NgxResizableDirective, NgxResizePayload } from './lib/directives/resizable.directive';

// Components
export { NgxSchedulerComponent }       from './lib/components/scheduler/scheduler.component';
export { NgxSchedulerHeaderComponent, ViewOption } from './lib/components/scheduler-header/scheduler-header.component';
export { NgxTimelineViewComponent }    from './lib/components/timeline-view/timeline-view.component';
export { NgxCalendarViewComponent }    from './lib/components/calendar-view/calendar-view.component';
export { NgxTimeGridViewComponent }    from './lib/components/time-grid-view/time-grid-view.component';

// Output argument types
export {
  EventClickArg, EventDropArg,
  EventResizeArg, DateClickArg,
}                                      from './lib/components/scheduler/scheduler.component';

// Utils (tree-shakeable helpers for consumers)
export {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  addDays, addWeeks, addMonths, addHours, addMinutes,
  isSameDay, isSameMonth, isWeekend, isToday,
  dateDiffInMinutes, dateDiffInDays,
  snapToInterval, generateDayRange, generateWeekMatrix,
}                                      from './lib/utils/date.utils';
export {
  generateTimeSlots, generateTimeSlotGroups,
  getViewRange, getViewSlotDuration,
  slotDurationToMinutes, dateToPixels, pixelsToDate,
}                                      from './lib/utils/timeline.utils';
export {
  computeTimelineEventBlocks,
  computeTimeGridEventBlocks,
}                                      from './lib/utils/layout.utils';
