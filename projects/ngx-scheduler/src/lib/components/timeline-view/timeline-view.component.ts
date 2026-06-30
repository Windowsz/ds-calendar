import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit,
  Output, TemplateRef, ViewChild,
} from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { NgxEvent } from '../../models/event.model';
import { NgxResource } from '../../models/resource.model';
import { ViewType, SlotDuration } from '../../models/view.model';
import { DragState, ResizeState } from '../../models/scheduler-state.model';
import { EventBlock, TimeSlot, TimeSlotGroup, DragPlaceholder } from '../../models/time-slot.model';
import { SchedulerStoreService } from '../../store/scheduler-store.service';
import { NgxDragPayload } from '../../directives/draggable.directive';
import { NgxResizePayload } from '../../directives/resizable.directive';
import {
  generateTimeSlots,
  generateTimeSlotGroups,
  getViewSlotDuration,
  slotDurationToMinutes,
  dateToPixels,
} from '../../utils/timeline.utils';
import { computeTimelineEventBlocks } from '../../utils/layout.utils';
import { snapToInterval } from '../../utils/date.utils';

export interface TimelineViewModel {
  resources: NgxResource[];
  slots: TimeSlot[];
  slotGroups: TimeSlotGroup[];
  visibleEvents: NgxEvent[];
  range: { start: Date; end: Date };
  totalGridWidth: number;
  slotWidth: number;
  slotDuration: SlotDuration;
  slotDurationMinutes: number;
}

export interface EventClickArg { event: NgxEvent; originalEvent: MouseEvent; }
export interface EventDropArg  { event: NgxEvent; oldStart: Date; oldEnd: Date; newStart: Date; newEnd: Date; newResourceId?: string; oldResourceId?: string; }
export interface EventResizeArg { event: NgxEvent; oldEnd: Date; newEnd: Date; }
export interface DateClickArg  { date: Date; resourceId?: string; }

@Component({
  selector: 'ngx-timeline-view',
  templateUrl: './timeline-view.component.html',
  styleUrls: ['./timeline-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxTimelineViewComponent implements OnInit, OnDestroy {
  @Input() slotWidth = 60;
  @Input() rowHeight = 50;
  @Input() resourceColumnWidth = 200;
  @Input() snapMinutes = 30;
  @Input() locale = 'en-US';

  @Input() eventTemplate?: TemplateRef<any>;
  @Input() resourceTemplate?: TemplateRef<any>;

  @Output() eventClick   = new EventEmitter<EventClickArg>();
  @Output() eventDrop    = new EventEmitter<EventDropArg>();
  @Output() eventResize  = new EventEmitter<EventResizeArg>();
  @Output() dateClick    = new EventEmitter<DateClickArg>();

  @ViewChild('mainGrid',         { static: false }) mainGridRef!:         ElementRef<HTMLDivElement>;
  @ViewChild('slotGroupsHeader', { static: false }) slotGroupsHeaderRef!: ElementRef<HTMLDivElement>;
  @ViewChild('resourceList',     { static: false }) resourceListRef!:     ElementRef<HTMLDivElement>;

  vm$!: Observable<TimelineViewModel>;
  dragPlaceholder$!: Observable<DragPlaceholder | null>;

  private dragOriginResourceId: string | null = null;
  private dragOriginResourceIdx = -1;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public store: SchedulerStoreService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.vm$ = combineLatest([
      this.store.resources$,
      this.store.visibleEvents$,
      this.store.viewRange$,
      this.store.viewType$,
      this.store.config$,
    ]).pipe(
      map(([resources, visibleEvents, range, viewType, config]) =>
        this.buildViewModel(resources, visibleEvents, range, viewType, config.locale || this.locale)
      ),
    );

    this.dragPlaceholder$ = combineLatest([
      this.store.dragState$,
      this.store.resources$,
      this.store.viewRange$,
      this.store.viewType$,
    ]).pipe(
      map(([drag, resources, range, viewType]) => {
        if (!drag) return null;
        return this.buildPlaceholder(drag, resources, range, viewType);
      }),
    );
  }

  // ── ViewModel builder ────────────────────────────────────────────────────────

  private buildViewModel(
    resources: NgxResource[],
    visibleEvents: NgxEvent[],
    range: { start: Date; end: Date },
    viewType: ViewType,
    locale: string,
  ): TimelineViewModel {
    const slotDuration = getViewSlotDuration(viewType);
    const slotDurationMinutes = slotDurationToMinutes(slotDuration);
    const slots = generateTimeSlots(range.start, range.end, slotDuration, locale);
    const slotGroups = generateTimeSlotGroups(range.start, range.end, slotDuration, locale);
    const totalGridWidth = slots.length * this.slotWidth;

    return {
      resources,
      slots,
      slotGroups,
      visibleEvents,
      range,
      totalGridWidth,
      slotWidth: this.slotWidth,
      slotDuration,
      slotDurationMinutes,
    };
  }

  private buildPlaceholder(
    drag: DragState,
    resources: NgxResource[],
    range: { start: Date; end: Date },
    viewType: ViewType,
  ): DragPlaceholder | null {
    const slotDuration = getViewSlotDuration(viewType);
    const slotDurationMinutes = slotDurationToMinutes(slotDuration);

    const left  = dateToPixels(drag.currentStart, range.start, slotDurationMinutes, this.slotWidth);
    const width = dateToPixels(drag.currentEnd,   range.start, slotDurationMinutes, this.slotWidth) - left;
    const resourceIdx = resources.findIndex(r => r.id === drag.currentResourceId);
    const top = resourceIdx >= 0 ? resourceIdx * this.rowHeight : -999;

    return { left, top, width: Math.max(width, 10), height: this.rowHeight - 2, resourceId: drag.currentResourceId ?? '' };
  }

  // ── Event block computation (called per-resource-row in template) ────────────

  getEventBlocks(resourceId: string, vm: TimelineViewModel): EventBlock[] {
    return computeTimelineEventBlocks({
      events: vm.visibleEvents,
      viewStart: vm.range.start,
      viewEnd:   vm.range.end,
      slotWidthPx: this.slotWidth,
      slotDurationMinutes: vm.slotDurationMinutes,
      rowHeightPx: this.rowHeight,
      resourceId,
    });
  }

  isDragging(eventId: string): boolean {
    return this.store.snapshot.dragState?.eventId === eventId;
  }

  isResizing(eventId: string): boolean {
    return this.store.snapshot.resizeState?.eventId === eventId;
  }

  getEventStyle(block: EventBlock): { [key: string]: string } {
    const event = block.event;
    const bg    = event.backgroundColor || event.color || '#3b82f6';
    const border = event.borderColor    || event.color || '#2563eb';
    const text   = event.textColor                     || '#ffffff';
    return {
      left:             `${block.left}px`,
      width:            `${block.width}px`,
      top:              `${block.top}px`,
      height:           `${block.height}px`,
      'z-index':        `${block.zIndex}`,
      'background-color': bg,
      'border-left-color': border,
      color:            text,
    };
  }

  // ── Scroll synchronisation ───────────────────────────────────────────────────

  onGridScroll(event: Event): void {
    const el = event.target as HTMLDivElement;
    this.zone.runOutsideAngular(() => {
      if (this.slotGroupsHeaderRef) {
        this.slotGroupsHeaderRef.nativeElement.scrollLeft = el.scrollLeft;
      }
      if (this.resourceListRef) {
        this.resourceListRef.nativeElement.scrollTop = el.scrollTop;
      }
    });
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────

  onDragStart(payload: NgxDragPayload, resourceId: string, block: EventBlock, vm: TimelineViewModel): void {
    this.dragOriginResourceId  = resourceId;
    this.dragOriginResourceIdx = vm.resources.findIndex(r => r.id === resourceId);

    this.store.startDrag({
      eventId:            block.event.id,
      originalStart:      new Date(block.event.start),
      originalEnd:        new Date(block.event.end),
      currentStart:       new Date(block.event.start),
      currentEnd:         new Date(block.event.end),
      currentResourceId:  resourceId,
      originalResourceId: resourceId,
    });
  }

  onDragMove(payload: NgxDragPayload, vm: TimelineViewModel): void {
    const drag = this.store.snapshot.dragState;
    if (!drag) return;

    // Time position: deltaX → minutes → new start
    const deltaMinutes = (payload.deltaX / this.slotWidth) * vm.slotDurationMinutes;
    let newStart = new Date(drag.originalStart.getTime() + deltaMinutes * 60000);
    newStart = snapToInterval(newStart, this.snapMinutes);
    const duration  = drag.originalEnd.getTime() - drag.originalStart.getTime();
    const newEnd    = new Date(newStart.getTime() + duration);

    // Resource row: deltaY → row index shift
    const rowShift = Math.round(payload.deltaY / this.rowHeight);
    const newIdx   = Math.max(0, Math.min(this.dragOriginResourceIdx + rowShift, vm.resources.length - 1));
    const newResourceId = vm.resources[newIdx]?.id ?? drag.currentResourceId;

    this.store.updateDrag({ currentStart: newStart, currentEnd: newEnd, currentResourceId: newResourceId });
  }

  onDragEnd(payload: NgxDragPayload, vm: TimelineViewModel): void {
    const drag = this.store.snapshot.dragState;
    if (!drag) return;

    // Final snap
    const deltaMinutes = (payload.deltaX / this.slotWidth) * vm.slotDurationMinutes;
    let newStart = new Date(drag.originalStart.getTime() + deltaMinutes * 60000);
    newStart = snapToInterval(newStart, this.snapMinutes);
    const duration = drag.originalEnd.getTime() - drag.originalStart.getTime();
    const newEnd   = new Date(newStart.getTime() + duration);
    const rowShift = Math.round(payload.deltaY / this.rowHeight);
    const newIdx   = Math.max(0, Math.min(this.dragOriginResourceIdx + rowShift, vm.resources.length - 1));
    const newResourceId = vm.resources[newIdx]?.id ?? drag.currentResourceId;

    this.store.updateDrag({ currentStart: newStart, currentEnd: newEnd, currentResourceId: newResourceId });

    const event = this.store.snapshot.events.find(e => e.id === drag.eventId);
    if (event) {
      this.eventDrop.emit({
        event,
        oldStart:      drag.originalStart,
        oldEnd:        drag.originalEnd,
        newStart,
        newEnd,
        oldResourceId: drag.originalResourceId,
        newResourceId,
      });
    }

    this.store.commitDrag();
    this.dragOriginResourceId  = null;
    this.dragOriginResourceIdx = -1;
  }

  // ── Resize handlers ──────────────────────────────────────────────────────────

  onResizeStart(payload: NgxResizePayload, block: EventBlock): void {
    this.store.startResize({
      eventId:       block.event.id,
      originalStart: new Date(block.event.start),
      originalEnd:   new Date(block.event.end),
      currentEnd:    new Date(block.event.end),
      edge:          payload.edge,
    });
  }

  onResizeMove(payload: NgxResizePayload, vm: TimelineViewModel): void {
    const resize = this.store.snapshot.resizeState;
    if (!resize) return;

    const deltaMinutes = (payload.deltaX / this.slotWidth) * vm.slotDurationMinutes;
    let newEnd = new Date(resize.originalEnd.getTime() + deltaMinutes * 60000);
    newEnd = snapToInterval(newEnd, this.snapMinutes);

    // Guard: end must be at least one snap interval after start
    const event = this.store.snapshot.events.find(e => e.id === resize.eventId);
    if (event) {
      const minEnd = new Date(event.start.getTime() + this.snapMinutes * 60000);
      if (newEnd.getTime() < minEnd.getTime()) newEnd = minEnd;
    }

    this.store.updateResize({ currentEnd: newEnd });
  }

  onResizeEnd(payload: NgxResizePayload): void {
    const resize = this.store.snapshot.resizeState;
    if (!resize) return;

    const event = this.store.snapshot.events.find(e => e.id === resize.eventId);
    if (event) {
      this.eventResize.emit({ event, oldEnd: resize.originalEnd, newEnd: resize.currentEnd });
    }
    this.store.commitResize();
  }

  // ── User interaction ─────────────────────────────────────────────────────────

  onEventClick(block: EventBlock, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.store.selectEvent(block.event.id);
    this.eventClick.emit({ event: block.event, originalEvent: mouseEvent });
  }

  onCellClick(slot: TimeSlot, resource: NgxResource): void {
    this.dateClick.emit({ date: slot.start, resourceId: resource.id });
  }

  // ── TrackBy functions ────────────────────────────────────────────────────────

  trackByResource  = (_: number, r: NgxResource): string => r.id;
  trackBySlot      = (_: number, s: TimeSlot):    string => s.key;
  trackBySlotGroup = (_: number, g: TimeSlotGroup): string => g.key;
  trackByBlock     = (_: number, b: EventBlock):  string => b.event.id + '_' + b.column;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
