import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  EventEmitter, Input, OnChanges, OnDestroy, OnInit,
  Output, SimpleChanges, TemplateRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NgxEvent } from '../../models/event.model';
import { NgxResource } from '../../models/resource.model';
import { ViewType, SchedulerConfig, DEFAULT_CONFIG } from '../../models/view.model';
import { SchedulerStoreService } from '../../store/scheduler-store.service';
import { ViewOption } from '../scheduler-header/scheduler-header.component';
import {
  EventClickArg, EventDropArg, EventResizeArg, DateClickArg,
} from '../timeline-view/timeline-view.component';

export { EventClickArg, EventDropArg, EventResizeArg, DateClickArg };

@Component({
  selector: 'ngx-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // One SchedulerStoreService per component instance (not global singleton)
  providers: [SchedulerStoreService],
})
export class NgxSchedulerComponent implements OnInit, OnChanges, OnDestroy {
  // ── Data inputs ──────────────────────────────────────────────────────────────
  @Input() events: NgxEvent[] = [];
  @Input() resources: NgxResource[] = [];

  // ── Configuration inputs ─────────────────────────────────────────────────────
  @Input() viewType: ViewType = 'resourceTimeline';
  @Input() initialDate: Date = new Date();
  @Input() config: Partial<SchedulerConfig> = {};
  @Input() headerViews: ViewOption[] = [
    { type: 'resourceTimeline',      label: 'Week'   },
    { type: 'resourceTimelineMonth', label: 'Month'  },
    { type: 'resourceTimelineDay',   label: 'Day'    },
    { type: 'timeGridWeek',          label: 'Grid W' },
    { type: 'dayGridMonth',          label: 'Month G'},
  ];

  // ── Template slots ───────────────────────────────────────────────────────────
  @Input() eventTemplate?: TemplateRef<any>;
  @Input() resourceTemplate?: TemplateRef<any>;
  @Input() dayHeaderTemplate?: TemplateRef<any>;

  // ── Outputs ──────────────────────────────────────────────────────────────────
  @Output() eventClick        = new EventEmitter<EventClickArg>();
  @Output() eventDrop         = new EventEmitter<EventDropArg>();
  @Output() eventResize       = new EventEmitter<EventResizeArg>();
  @Output() dateClick         = new EventEmitter<DateClickArg>();
  @Output() viewChange        = new EventEmitter<ViewType>();
  @Output() dateRangeChange   = new EventEmitter<{ start: Date; end: Date }>();

  // ── View routing flags ───────────────────────────────────────────────────────
  isTimelineView = true;
  isCalendarView = false;
  isTimeGridView = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly store: SchedulerStoreService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Apply config
    this.store.setConfig({ ...DEFAULT_CONFIG, ...this.config });
    this.store.setCurrentDate(this.initialDate);
    this.store.setViewType(this.viewType);
    this.store.setEvents(this.events);
    this.store.setResources(this.resources);

    // React to view changes
    this.store.viewType$.pipe(takeUntil(this.destroy$)).subscribe(vt => {
      this.updateViewFlags(vt);
      this.viewChange.emit(vt);
      this.cdr.markForCheck();
    });

    // Emit range whenever it changes
    this.store.viewRange$.pipe(takeUntil(this.destroy$)).subscribe(range => {
      this.dateRangeChange.emit(range);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && !changes['events'].firstChange) {
      this.store.setEvents(this.events);
    }
    if (changes['resources'] && !changes['resources'].firstChange) {
      this.store.setResources(this.resources);
    }
    if (changes['viewType'] && !changes['viewType'].firstChange) {
      this.store.setViewType(this.viewType);
    }
    if (changes['initialDate'] && !changes['initialDate'].firstChange) {
      this.store.setCurrentDate(this.initialDate);
    }
    if (changes['config'] && !changes['config'].firstChange) {
      this.store.setConfig({ ...DEFAULT_CONFIG, ...this.config });
    }
  }

  private updateViewFlags(vt: ViewType): void {
    this.isTimelineView = vt.startsWith('resourceTimeline');
    this.isCalendarView = vt === 'dayGridMonth';
    this.isTimeGridView = vt === 'timeGridDay' || vt === 'timeGridWeek';
  }

  // ── Event forwarding ─────────────────────────────────────────────────────────

  onEventClick(arg: EventClickArg): void    { this.eventClick.emit(arg); }
  onEventDrop(arg: EventDropArg): void      { this.eventDrop.emit(arg); }
  onEventResize(arg: EventResizeArg): void  { this.eventResize.emit(arg); }
  onDateClick(arg: DateClickArg): void      { this.dateClick.emit(arg); }

  // ── Public API ───────────────────────────────────────────────────────────────

  /** Navigate to a specific date programmatically */
  goToDate(date: Date): void { this.store.setCurrentDate(date); }

  /** Switch view programmatically */
  changeView(viewType: ViewType): void { this.store.setViewType(viewType); }

  /** Add event programmatically */
  addEvent(event: NgxEvent): void { this.store.addEvent(event); }

  /** Update an event programmatically */
  updateEvent(event: NgxEvent): void { this.store.updateEvent(event); }

  /** Remove an event by id */
  removeEvent(id: string): void { this.store.removeEvent(id); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
