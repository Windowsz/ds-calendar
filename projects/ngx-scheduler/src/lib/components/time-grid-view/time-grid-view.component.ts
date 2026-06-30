import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef,
} from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { NgxEvent } from '../../models/event.model';
import { EventBlock } from '../../models/time-slot.model';
import { SchedulerStoreService } from '../../store/scheduler-store.service';
import { computeTimeGridEventBlocks } from '../../utils/layout.utils';
import { generateDayRange, isToday, isWeekend, formatIntl } from '../../utils/date.utils';
import { generateHourSlots, formatHourLabel } from '../../utils/timeline.utils';

export interface TimeGridColumn {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  label: string;
  key: string;
}

export interface TimeGridViewModel {
  columns: TimeGridColumn[];
  hourSlots: number[];
  totalMinutes: number;
  hourHeightPx: number;
  containerHeightPx: number;
  visibleEvents: NgxEvent[];
}

@Component({
  selector: 'ngx-time-grid-view',
  templateUrl: './time-grid-view.component.html',
  styleUrls: ['./time-grid-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxTimeGridViewComponent implements OnInit, OnDestroy {
  @Input() hourHeightPx = 60;
  @Input() firstHour = 0;
  @Input() lastHour = 24;
  @Input() locale = 'en-US';
  @Input() eventTemplate?: TemplateRef<any>;

  @Output() eventClick = new EventEmitter<{ event: NgxEvent; originalEvent: MouseEvent }>();
  @Output() dateClick  = new EventEmitter<{ date: Date }>();

  vm$!: Observable<TimeGridViewModel>;
  private readonly destroy$ = new Subject<void>();

  constructor(private store: SchedulerStoreService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.vm$ = combineLatest([
      this.store.viewRange$,
      this.store.visibleEvents$,
      this.store.config$,
    ]).pipe(
      map(([range, visibleEvents, config]) =>
        this.buildViewModel(range, visibleEvents, config.locale || this.locale, config.firstHour, config.lastHour)
      ),
    );
  }

  private buildViewModel(
    range: { start: Date; end: Date },
    visibleEvents: NgxEvent[],
    locale: string,
    firstHour: number,
    lastHour: number,
  ): TimeGridViewModel {
    const days = generateDayRange(range.start, range.end);
    const hourSlots = generateHourSlots(firstHour, lastHour);
    const totalMinutes = (lastHour - firstHour) * 60;
    const containerHeightPx = hourSlots.length * this.hourHeightPx;

    const columns: TimeGridColumn[] = days.map(date => ({
      date,
      isToday:   isToday(date),
      isWeekend: isWeekend(date),
      label:     formatIntl(date, { weekday: 'short', month: 'short', day: 'numeric' }, locale),
      key:       date.toISOString(),
    }));

    return { columns, hourSlots, totalMinutes, hourHeightPx: this.hourHeightPx, containerHeightPx, visibleEvents };
  }

  getEventBlocks(column: TimeGridColumn, vm: TimeGridViewModel): EventBlock[] {
    const dayStart = new Date(column.date);
    dayStart.setHours(this.firstHour, 0, 0, 0);
    const dayEnd = new Date(column.date);
    dayEnd.setHours(this.lastHour, 0, 0, 0);

    return computeTimeGridEventBlocks({
      events: vm.visibleEvents,
      dayStart,
      dayEnd,
      totalMinutes: vm.totalMinutes,
      containerHeightPx: vm.containerHeightPx,
    });
  }

  getEventStyle(block: EventBlock, vm: TimeGridViewModel): { [key: string]: string } {
    const event = block.event;
    return {
      top:              `${(block.top / 100) * vm.containerHeightPx}px`,
      height:           `${Math.max((block.height / 100) * vm.containerHeightPx, 20)}px`,
      left:             `${block.left}%`,
      width:            `${block.width}%`,
      'z-index':        `${block.zIndex}`,
      'background-color':  event.backgroundColor || event.color || '#3b82f6',
      'border-left-color': event.borderColor || event.color || '#2563eb',
      color:               event.textColor || '#ffffff',
    };
  }

  getCurrentTimeTop(vm: TimeGridViewModel): number {
    const now = new Date();
    const minutesSinceFirst = now.getHours() * 60 + now.getMinutes() - this.firstHour * 60;
    return (minutesSinceFirst / vm.totalMinutes) * vm.containerHeightPx;
  }

  onEventClick(event: NgxEvent, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.store.selectEvent(event.id);
    this.eventClick.emit({ event, originalEvent: mouseEvent });
  }

  onColumnClick(column: TimeGridColumn, offsetY: number, vm: TimeGridViewModel): void {
    const minuteOffset = (offsetY / vm.containerHeightPx) * vm.totalMinutes;
    const clickedDate = new Date(column.date);
    clickedDate.setHours(this.firstHour, Math.floor(minuteOffset), 0, 0);
    this.dateClick.emit({ date: clickedDate });
  }

  // Expose utility to template (required for OnPush — cannot call bare module fn in template)
  formatHour(h: number): string {
    return formatHourLabel(h);
  }

  trackByColumn = (_: number, c: TimeGridColumn): string => c.key;
  trackByHour   = (_: number, h: number): number => h;
  trackByBlock  = (_: number, b: EventBlock): string => `${b.event.id}_${b.column}`;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
