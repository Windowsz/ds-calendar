import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef,
} from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { NgxEvent } from '../../models/event.model';
import { SchedulerStoreService } from '../../store/scheduler-store.service';
import { generateWeekMatrix, isSameMonth, isToday, isWeekend, formatIntl } from '../../utils/date.utils';

export interface CalendarCell {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
  events: NgxEvent[];
  key: string;
}

export interface CalendarViewModel {
  weeks: CalendarCell[][];
  weekDayLabels: string[];
  currentMonth: Date;
}

@Component({
  selector: 'ngx-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxCalendarViewComponent implements OnInit, OnDestroy {
  @Input() locale = 'en-US';
  @Input() maxEventsPerCell = 3;
  @Input() eventTemplate?: TemplateRef<any>;

  @Output() dateClick  = new EventEmitter<{ date: Date }>();
  @Output() eventClick = new EventEmitter<{ event: NgxEvent; originalEvent: MouseEvent }>();
  @Output() moreClick  = new EventEmitter<{ date: Date; events: NgxEvent[] }>();

  vm$!: Observable<CalendarViewModel>;
  private readonly destroy$ = new Subject<void>();

  constructor(private store: SchedulerStoreService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.vm$ = combineLatest([
      this.store.currentDate$,
      this.store.visibleEvents$,
      this.store.config$,
    ]).pipe(
      map(([currentDate, events, config]) =>
        this.buildViewModel(currentDate, events, config.weekStartsOn, config.locale || this.locale)
      ),
    );
  }

  private buildViewModel(
    currentDate: Date,
    events: NgxEvent[],
    weekStartsOn: 0 | 1,
    locale: string,
  ): CalendarViewModel {
    const matrix = generateWeekMatrix(currentDate, weekStartsOn);

    const weeks: CalendarCell[][] = matrix.map(week =>
      week.map(date => ({
        date,
        isToday:         isToday(date),
        isWeekend:       isWeekend(date),
        isCurrentMonth:  isSameMonth(date, currentDate),
        events:          this.getDayEvents(date, events),
        key:             date.toISOString(),
      }))
    );

    // Build weekday header labels starting from weekStartsOn
    const refDay = new Date(2023, 0, 1); // Jan 1 2023 is a Sunday
    const startOffset = weekStartsOn === 1 ? 1 : 0;
    const weekDayLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(refDay);
      d.setDate(refDay.getDate() + startOffset + i);
      return formatIntl(d, { weekday: 'short' }, locale);
    });

    return { weeks, weekDayLabels, currentMonth: currentDate };
  }

  private getDayEvents(date: Date, events: NgxEvent[]): NgxEvent[] {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return events
      .filter(e => e.start.getTime() <= dayEnd.getTime() && e.end.getTime() >= dayStart.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  getVisibleEvents(cell: CalendarCell): NgxEvent[] {
    return cell.events.slice(0, this.maxEventsPerCell);
  }

  getHiddenCount(cell: CalendarCell): number {
    return Math.max(0, cell.events.length - this.maxEventsPerCell);
  }

  onDateClick(cell: CalendarCell): void {
    this.dateClick.emit({ date: cell.date });
  }

  onEventClick(event: NgxEvent, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.store.selectEvent(event.id);
    this.eventClick.emit({ event, originalEvent: mouseEvent });
  }

  onMoreClick(cell: CalendarCell, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.moreClick.emit({ date: cell.date, events: cell.events });
  }

  getEventColor(event: NgxEvent): string {
    return event.backgroundColor || event.color || '#3b82f6';
  }

  trackByWeek  = (i: number): number => i;
  trackByCell  = (_: number, c: CalendarCell): string => c.key;
  trackByEvent = (_: number, e: NgxEvent): string => e.id;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
