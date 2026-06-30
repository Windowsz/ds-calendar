import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

// Directives
import { NgxDraggableDirective }  from './directives/draggable.directive';
import { NgxResizableDirective }  from './directives/resizable.directive';

// Components
import { NgxSchedulerComponent }        from './components/scheduler/scheduler.component';
import { NgxSchedulerHeaderComponent }  from './components/scheduler-header/scheduler-header.component';
import { NgxTimelineViewComponent }     from './components/timeline-view/timeline-view.component';
import { NgxCalendarViewComponent }     from './components/calendar-view/calendar-view.component';
import { NgxTimeGridViewComponent }     from './components/time-grid-view/time-grid-view.component';

const DIRECTIVES = [
  NgxDraggableDirective,
  NgxResizableDirective,
];

const COMPONENTS = [
  NgxSchedulerComponent,
  NgxSchedulerHeaderComponent,
  NgxTimelineViewComponent,
  NgxCalendarViewComponent,
  NgxTimeGridViewComponent,
];

@NgModule({
  imports: [CommonModule],
  declarations: [...DIRECTIVES, ...COMPONENTS],
  exports:      [...DIRECTIVES, ...COMPONENTS],
})
export class NgxSchedulerModule {}
