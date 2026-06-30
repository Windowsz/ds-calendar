import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { NgxEvent } from '../models/event.model';
import { NgxResource } from '../models/resource.model';
import { ViewType, SchedulerConfig, DEFAULT_CONFIG } from '../models/view.model';
import { DragState, ResizeState, SchedulerState, INITIAL_STATE } from '../models/scheduler-state.model';
import { getViewRange } from '../utils/timeline.utils';
import { addDays, addWeeks, addMonths } from '../utils/date.utils';

@Injectable()
export class SchedulerStoreService implements OnDestroy {
  private readonly _state$ = new BehaviorSubject<SchedulerState>({ ...INITIAL_STATE, currentDate: new Date() });
  private readonly _destroy$ = new Subject<void>();

  // ── Root stream ──────────────────────────────────────────────────────────────
  readonly state$: Observable<SchedulerState> = this._state$.asObservable();

  // ── Derived atomic streams ───────────────────────────────────────────────────
  readonly currentDate$: Observable<Date> = this.state$.pipe(
    map(s => s.currentDate),
    distinctUntilChanged((a, b) => a.getTime() === b.getTime()),
  );

  readonly viewType$: Observable<ViewType> = this.state$.pipe(
    map(s => s.viewType),
    distinctUntilChanged(),
  );

  readonly events$: Observable<NgxEvent[]> = this.state$.pipe(
    map(s => s.events),
    distinctUntilChanged(),
  );

  readonly resources$: Observable<NgxResource[]> = this.state$.pipe(
    map(s => s.resources),
    distinctUntilChanged(),
  );

  readonly config$: Observable<SchedulerConfig> = this.state$.pipe(
    map(s => s.config),
    distinctUntilChanged(),
  );

  readonly loading$: Observable<boolean> = this.state$.pipe(
    map(s => s.loading),
    distinctUntilChanged(),
  );

  readonly dragState$: Observable<DragState | null> = this.state$.pipe(
    map(s => s.dragState),
    distinctUntilChanged(),
  );

  readonly resizeState$: Observable<ResizeState | null> = this.state$.pipe(
    map(s => s.resizeState),
    distinctUntilChanged(),
  );

  readonly selectedEventId$: Observable<string | null> = this.state$.pipe(
    map(s => s.selectedEventId),
    distinctUntilChanged(),
  );

  // ── Compound derived streams ─────────────────────────────────────────────────
  readonly viewRange$: Observable<{ start: Date; end: Date }> = combineLatest([
    this.currentDate$,
    this.viewType$,
    this.config$,
  ]).pipe(
    map(([date, viewType, config]) => getViewRange(viewType, date, config.weekStartsOn)),
    distinctUntilChanged((a, b) =>
      a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime()
    ),
  );

  readonly visibleEvents$: Observable<NgxEvent[]> = combineLatest([
    this.events$,
    this.viewRange$,
  ]).pipe(
    map(([events, range]) =>
      events.filter(e => e.end.getTime() > range.start.getTime() && e.start.getTime() < range.end.getTime())
    ),
  );

  readonly selectedEvent$: Observable<NgxEvent | null> = combineLatest([
    this.events$,
    this.selectedEventId$,
  ]).pipe(
    map(([events, id]) => (id ? (events.find(e => e.id === id) ?? null) : null)),
  );

  // ── Snapshot accessor (use sparingly, prefer streams) ───────────────────────
  get snapshot(): SchedulerState {
    return this._state$.getValue();
  }

  // ── Private patcher ──────────────────────────────────────────────────────────
  private patch(partial: Partial<SchedulerState>): void {
    this._state$.next(Object.assign({}, this._state$.getValue(), partial));
  }

  // ── Configuration ────────────────────────────────────────────────────────────
  setConfig(config: Partial<SchedulerConfig>): void {
    this.patch({ config: Object.assign({}, this.snapshot.config, config) });
  }

  // ── Event mutations ──────────────────────────────────────────────────────────
  setEvents(events: NgxEvent[]): void {
    this.patch({ events: events.slice() });
  }

  addEvent(event: NgxEvent): void {
    this.patch({ events: [...this.snapshot.events, { ...event }] });
  }

  updateEvent(updated: NgxEvent): void {
    this.patch({
      events: this.snapshot.events.map(e => (e.id === updated.id ? { ...updated } : e)),
    });
  }

  removeEvent(id: string): void {
    this.patch({ events: this.snapshot.events.filter(e => e.id !== id) });
  }

  // ── Resource mutations ───────────────────────────────────────────────────────
  setResources(resources: NgxResource[]): void {
    this.patch({ resources: resources.slice() });
  }

  // ── View & navigation ────────────────────────────────────────────────────────
  setViewType(viewType: ViewType): void {
    this.patch({ viewType });
  }

  setCurrentDate(date: Date): void {
    this.patch({ currentDate: new Date(date) });
  }

  navigateToday(): void {
    this.patch({ currentDate: new Date() });
  }

  navigatePrev(): void {
    const { currentDate, viewType, config } = this.snapshot;
    this.patch({ currentDate: this.shiftDate(currentDate, viewType, config.weekStartsOn, -1) });
  }

  navigateNext(): void {
    const { currentDate, viewType, config } = this.snapshot;
    this.patch({ currentDate: this.shiftDate(currentDate, viewType, config.weekStartsOn, 1) });
  }

  private shiftDate(date: Date, viewType: ViewType, _weekStartsOn: 0 | 1, direction: 1 | -1): Date {
    switch (viewType) {
      case 'timeGridDay':
      case 'resourceTimelineDay':
        return addDays(date, direction);
      case 'timeGridWeek':
      case 'resourceTimeline':
      case 'resourceTimelineWeek':
        return addWeeks(date, direction);
      default:
        return addMonths(date, direction);
    }
  }

  // ── Selection ────────────────────────────────────────────────────────────────
  selectEvent(id: string | null): void {
    this.patch({ selectedEventId: id });
  }

  // ── Loading flag ─────────────────────────────────────────────────────────────
  setLoading(loading: boolean): void {
    this.patch({ loading });
  }

  // ── Drag lifecycle ───────────────────────────────────────────────────────────
  startDrag(drag: DragState): void {
    this.patch({ dragState: { ...drag } });
  }

  updateDrag(partial: Partial<DragState>): void {
    const current = this.snapshot.dragState;
    if (!current) return;
    this.patch({ dragState: { ...current, ...partial } });
  }

  commitDrag(): NgxEvent | null {
    const drag = this.snapshot.dragState;
    if (!drag) return null;

    const event = this.snapshot.events.find(e => e.id === drag.eventId);
    if (event) {
      const duration = event.end.getTime() - event.start.getTime();
      const updated: NgxEvent = {
        ...event,
        start: drag.currentStart,
        end:   new Date(drag.currentStart.getTime() + duration),
        resourceId: drag.currentResourceId ?? event.resourceId,
      };
      this.updateEvent(updated);
      this.patch({ dragState: null });
      return updated;
    }

    this.patch({ dragState: null });
    return null;
  }

  cancelDrag(): void {
    this.patch({ dragState: null });
  }

  // ── Resize lifecycle ─────────────────────────────────────────────────────────
  startResize(resize: ResizeState): void {
    this.patch({ resizeState: { ...resize } });
  }

  updateResize(partial: Partial<ResizeState>): void {
    const current = this.snapshot.resizeState;
    if (!current) return;
    this.patch({ resizeState: { ...current, ...partial } });
  }

  commitResize(): NgxEvent | null {
    const resize = this.snapshot.resizeState;
    if (!resize) return null;

    const event = this.snapshot.events.find(e => e.id === resize.eventId);
    if (event) {
      const updated: NgxEvent = {
        ...event,
        start: resize.edge === 'start' ? resize.currentEnd : event.start,
        end:   resize.edge === 'end'   ? resize.currentEnd : event.end,
      };
      this.updateEvent(updated);
      this.patch({ resizeState: null });
      return updated;
    }

    this.patch({ resizeState: null });
    return null;
  }

  cancelResize(): void {
    this.patch({ resizeState: null });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._state$.complete();
  }
}
