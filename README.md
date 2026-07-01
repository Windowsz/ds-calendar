# ngx-scheduler

A zero-dependency, high-performance Angular 12+ Calendar & Resource Timeline Library built as a drop-in replacement for FullCalendar.

- **No external dependencies** — pure Angular + RxJS
- **Angular 12 through latest** — Ivy partial compilation, no Signals, no `@if/@for`
- **`OnPush` everywhere** — every component is change-detection optimized
- **Premium Resource Timeline** — fixed resource column, scrollable time grid, pixel-perfect sync
- **Native Pointer Events** drag & drop and resize — no CDK, no HTML5 DnD
- **Fully customizable** — inject your own templates via `TemplateRef`

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Views](#views)
- [API Reference](#api-reference)
  - [NgxSchedulerComponent](#ngxschedulercomponent)
  - [NgxTimelineViewComponent](#ngxtimelineviewcomponent)
  - [NgxSchedulerHeaderComponent](#ngxschedulerheadercomponent)
- [Models](#models)
- [SchedulerStoreService](#schedulerstoreservice)
- [Custom Templates](#custom-templates)
- [Directives](#directives)
- [Utility Functions](#utility-functions)
- [Architecture Overview](#architecture-overview)

---

## Installation

```bash
npm install ngx-scheduler
```

Import the module in your Angular application:

```typescript
// app.module.ts
import { NgxSchedulerModule } from 'ngx-scheduler';

@NgModule({
  imports: [NgxSchedulerModule],
})
export class AppModule {}
```

---

## Quick Start

**Minimal usage — Resource Timeline:**

```html
<!-- app.component.html -->
<ngx-scheduler
  [events]="events"
  [resources]="resources"
  viewType="resourceTimeline"
  style="height: 600px; display: block;">
</ngx-scheduler>
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { NgxEvent, NgxResource } from 'ngx-scheduler';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent {
  resources: NgxResource[] = [
    { id: 'r1', title: 'Alice' },
    { id: 'r2', title: 'Bob',  color: '#10b981' },
    { id: 'r3', title: 'Carol' },
  ];

  events: NgxEvent[] = [
    {
      id: 'e1',
      title: 'Project Kickoff',
      start: new Date(2024, 2, 11, 9, 0),
      end:   new Date(2024, 2, 13, 17, 0),
      resourceId: 'r1',
      color: '#3b82f6',
    },
    {
      id: 'e2',
      title: 'Design Review',
      start: new Date(2024, 2, 12, 10, 0),
      end:   new Date(2024, 2, 14, 12, 0),
      resourceId: 'r2',
    },
  ];
}
```

---

## Views

| `viewType` | Description |
|---|---|
| `resourceTimeline` | Resource Timeline — weekly slot resolution (default) |
| `resourceTimelineDay` | Resource Timeline — single day, hourly slots |
| `resourceTimelineWeek` | Resource Timeline — weekly range, daily slots |
| `resourceTimelineMonth` | Resource Timeline — monthly range, daily slots |
| `timeGridDay` | Time Grid — single day column |
| `timeGridWeek` | Time Grid — Monday–Sunday columns |
| `dayGridMonth` | Month calendar grid |

Switch views programmatically:

```typescript
// Via @Input binding
this.currentView = 'resourceTimelineMonth';

// Or via the public API
@ViewChild(NgxSchedulerComponent) scheduler!: NgxSchedulerComponent;
this.scheduler.changeView('dayGridMonth');
```

---

## API Reference

### NgxSchedulerComponent

**Selector:** `<ngx-scheduler>`

#### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `events` | `NgxEvent[]` | `[]` | Array of calendar events |
| `resources` | `NgxResource[]` | `[]` | Array of resources (timeline views only) |
| `viewType` | `ViewType` | `'resourceTimeline'` | Active view |
| `initialDate` | `Date` | `new Date()` | Date to open the calendar at |
| `config` | `Partial<SchedulerConfig>` | `{}` | Global configuration overrides |
| `headerViews` | `ViewOption[]` | see below | View buttons shown in the toolbar |
| `eventTemplate` | `TemplateRef<any>` | — | Custom event rendering template |
| `resourceTemplate` | `TemplateRef<any>` | — | Custom resource row template |

Default `headerViews`:
```typescript
[
  { type: 'resourceTimeline',      label: 'Week'   },
  { type: 'resourceTimelineMonth', label: 'Month'  },
  { type: 'resourceTimelineDay',   label: 'Day'    },
  { type: 'timeGridWeek',          label: 'Grid W' },
  { type: 'dayGridMonth',          label: 'Month G'},
]
```

#### Outputs

| Output | Payload | Description |
|---|---|---|
| `eventClick` | `EventClickArg` | User clicked an event |
| `eventDrop` | `EventDropArg` | Drag & drop completed |
| `eventResize` | `EventResizeArg` | Resize handle released |
| `dateClick` | `DateClickArg` | User clicked an empty cell |
| `viewChange` | `ViewType` | Active view changed |
| `dateRangeChange` | `{ start: Date; end: Date }` | Visible date range changed |

#### Public Methods

```typescript
scheduler.goToDate(date: Date): void        // Navigate to a specific date
scheduler.changeView(view: ViewType): void  // Switch view programmatically
scheduler.addEvent(event: NgxEvent): void   // Add event to the store
scheduler.updateEvent(event: NgxEvent): void
scheduler.removeEvent(id: string): void
```

#### Full Example with Outputs

```html
<ngx-scheduler
  [events]="events"
  [resources]="resources"
  viewType="resourceTimeline"
  [initialDate]="today"
  [config]="schedulerConfig"
  (eventClick)="onEventClick($event)"
  (eventDrop)="onEventDrop($event)"
  (eventResize)="onEventResize($event)"
  (dateClick)="onDateClick($event)"
  (dateRangeChange)="onRangeChange($event)">
</ngx-scheduler>
```

```typescript
import { EventClickArg, EventDropArg, EventResizeArg, DateClickArg } from 'ngx-scheduler';

onEventClick({ event, originalEvent }: EventClickArg): void {
  console.log('Clicked:', event.title);
}

onEventDrop({ event, oldStart, newStart, newResourceId }: EventDropArg): void {
  // Persist changes to your backend here.
  // The store has already applied the move optimistically.
  this.api.updateEvent({ ...event, start: newStart });
}

onEventResize({ event, oldEnd, newEnd }: EventResizeArg): void {
  this.api.updateEvent({ ...event, end: newEnd });
}

onDateClick({ date, resourceId }: DateClickArg): void {
  // Open a "create event" dialog at this slot
}
```

---

### NgxTimelineViewComponent

Use this component directly when you want the timeline without the built-in header toolbar.

**Selector:** `<ngx-timeline-view>`

> **Note:** Must be a descendant of `<ngx-scheduler>` (requires the injected `SchedulerStoreService`).

| Input | Type | Default | Description |
|---|---|---|---|
| `slotWidth` | `number` | `60` | Width in pixels of each time slot column |
| `rowHeight` | `number` | `50` | Height in pixels of each resource row |
| `resourceColumnWidth` | `number` | `200` | Width of the fixed resource panel |
| `snapMinutes` | `number` | `30` | Snap interval in minutes during drag/resize |
| `locale` | `string` | `'en-US'` | Locale for date formatting |
| `eventTemplate` | `TemplateRef<any>` | — | Custom event template |
| `resourceTemplate` | `TemplateRef<any>` | — | Custom resource label template |

---

### NgxSchedulerHeaderComponent

**Selector:** `<ngx-scheduler-header>`

| Input | Type | Description |
|---|---|---|
| `viewOptions` | `ViewOption[]` | Buttons to show in the view switcher |
| `locale` | `string` | Locale for the title string |

---

## Models

### NgxEvent

```typescript
interface NgxEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;       // Which resource row this event belongs to
  color?: string;            // Shorthand — sets background + border color
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  allDay?: boolean;
  editable?: boolean;        // Overrides global editable setting
  draggable?: boolean;       // false → disable drag for this event
  resizable?: boolean;       // false → disable resize for this event
  className?: string | string[];
  extendedProps?: Record<string, any>; // Your custom data
}
```

### NgxResource

```typescript
interface NgxResource {
  id: string;
  title: string;
  parentId?: string;         // For future nested/grouped resources
  children?: NgxResource[];
  color?: string;            // Dot color in the resource label
  order?: number;
  extendedProps?: Record<string, any>;
}
```

### SchedulerConfig

```typescript
interface SchedulerConfig {
  slotDuration: SlotDuration;   // '00:15:00' | '00:30:00' | '01:00:00' | 'day' | 'week' | 'month'
  resourceColumnWidth: number;  // default: 200
  rowHeight: number;            // default: 50
  slotWidth: number;            // default: 60
  weekStartsOn: 0 | 1;         // 0 = Sunday, 1 = Monday (default)
  snapMinutes: number;          // default: 30
  locale: string;               // default: 'en-US'
  firstHour: number;            // default: 0  (time grid views)
  lastHour: number;             // default: 24 (time grid views)
  headerViews: ViewType[];
}
```

Pass a partial config to `<ngx-scheduler [config]="...">`:

```typescript
schedulerConfig: Partial<SchedulerConfig> = {
  rowHeight: 60,
  slotWidth: 80,
  snapMinutes: 15,
  weekStartsOn: 0,  // Sunday first
  locale: 'th-TH',
};
```

---

## SchedulerStoreService

Each `<ngx-scheduler>` creates its own isolated store instance. Child components access it via Angular DI. You can inject it in your own components if they live inside the `<ngx-scheduler>` view hierarchy:

```typescript
import { SchedulerStoreService } from 'ngx-scheduler';

@Component({ ... })
export class MyCustomEventComponent {
  constructor(private store: SchedulerStoreService) {}

  get selectedEvent$() {
    return this.store.selectedEvent$;
  }
}
```

### Available Streams

| Stream | Type | Description |
|---|---|---|
| `state$` | `Observable<SchedulerState>` | Full state snapshot stream |
| `currentDate$` | `Observable<Date>` | Current navigation date |
| `viewType$` | `Observable<ViewType>` | Active view |
| `events$` | `Observable<NgxEvent[]>` | All events |
| `resources$` | `Observable<NgxResource[]>` | All resources |
| `visibleEvents$` | `Observable<NgxEvent[]>` | Events in the current view range |
| `viewRange$` | `Observable<{start,end}>` | Current view's date boundaries |
| `selectedEvent$` | `Observable<NgxEvent \| null>` | Currently selected event |
| `dragState$` | `Observable<DragState \| null>` | Live drag state |
| `resizeState$` | `Observable<ResizeState \| null>` | Live resize state |
| `loading$` | `Observable<boolean>` | Loading flag |

### Mutation Methods

```typescript
store.setEvents(events: NgxEvent[]): void
store.addEvent(event: NgxEvent): void
store.updateEvent(event: NgxEvent): void
store.removeEvent(id: string): void

store.setResources(resources: NgxResource[]): void

store.setViewType(view: ViewType): void
store.setCurrentDate(date: Date): void
store.navigatePrev(): void
store.navigateNext(): void
store.navigateToday(): void

store.selectEvent(id: string | null): void
store.setLoading(loading: boolean): void
store.setConfig(config: Partial<SchedulerConfig>): void
```

---

## Custom Templates

### Custom Event

```html
<ngx-scheduler [events]="events" [resources]="resources" [eventTemplate]="myEvent">
</ngx-scheduler>

<ng-template #myEvent let-event let-block="block">
  <div style="padding: 2px 6px; display: flex; align-items: center; gap: 6px;">
    <span style="font-weight: 700; font-size: 12px;">{{ event.title }}</span>
    <span style="font-size: 11px; opacity: 0.8;">
      {{ event.start | date:'HH:mm' }} – {{ event.end | date:'HH:mm' }}
    </span>
  </div>
</ng-template>
```

The template context exposes:
- `$implicit` → `NgxEvent` (the event data)
- `block` → `EventBlock` (computed layout: `left`, `width`, `top`, `height`, `column`, `totalColumns`)

### Custom Resource Label

```html
<ngx-scheduler
  [resources]="resources"
  [resourceTemplate]="myResource">
</ngx-scheduler>

<ng-template #myResource let-resource>
  <div style="display: flex; align-items: center; gap: 8px; padding: 0 8px;">
    <img [src]="resource.extendedProps?.avatar" width="28" height="28"
         style="border-radius: 50%;" [alt]="resource.title" />
    <div>
      <div style="font-weight: 600; font-size: 13px;">{{ resource.title }}</div>
      <div style="font-size: 11px; color: #64748b;">{{ resource.extendedProps?.role }}</div>
    </div>
  </div>
</ng-template>
```

---

## Directives

The drag and resize directives are exported from the module and can be used on any element.

### `[ngxDraggable]`

```html
<div
  [ngxDraggable]="myEventId"
  [dragEnabled]="true"
  dragHandleSelector=".handle"
  (dragStart)="onStart($event)"
  (dragMove)="onMove($event)"
  (dragEnd)="onEnd($event)">
  <span class="handle">⠿</span>
  Drag me
</div>
```

| Input | Type | Description |
|---|---|---|
| `ngxDraggable` | `string` | Event ID passed back in all drag payloads |
| `dragEnabled` | `boolean` | Toggle drag on/off without removing the directive |
| `dragHandleSelector` | `string` | CSS selector for drag handle within the element |

**Payload** (`NgxDragPayload`):

```typescript
interface NgxDragPayload {
  eventId: string;
  deltaX: number;   // px from drag origin
  deltaY: number;
  clientX: number;  // absolute pointer position
  clientY: number;
}
```

### `[ngxResizable]`

```html
<div
  [ngxResizable]="myEventId"
  resizeEdge="both"
  [resizeEnabled]="true"
  (resizeStart)="onResizeStart($event)"
  (resizeMove)="onResizeMove($event)"
  (resizeEnd)="onResizeEnd($event)">
</div>
```

| Input | Type | Description |
|---|---|---|
| `ngxResizable` | `string` | Event ID passed back in payloads |
| `resizeEdge` | `'start' \| 'end' \| 'both'` | Which edges get resize handles |
| `resizeEnabled` | `boolean` | Toggle resize on/off |

**Payload** (`NgxResizePayload`):

```typescript
interface NgxResizePayload {
  eventId: string;
  deltaX: number;          // px delta from resize origin
  edge: 'start' | 'end';  // which handle is being dragged
}
```

---

## Utility Functions

All utility functions are tree-shakeable and exported from the library root:

### Date Utilities

```typescript
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  addDays, addWeeks, addMonths, addHours, addMinutes,
  isSameDay, isSameMonth,
  isWeekend, isToday,
  dateDiffInMinutes, dateDiffInDays,
  snapToInterval,
  generateDayRange,
  generateWeekMatrix,
} from 'ngx-scheduler';

// Snap a date to the nearest 30-minute boundary
const snapped = snapToInterval(new Date(), 30);

// Generate a 6-week calendar matrix for a given month
const weeks: Date[][] = generateWeekMatrix(new Date(), 1 /* Monday */);
```

### Timeline Utilities

```typescript
import {
  generateTimeSlots,
  generateTimeSlotGroups,
  getViewRange,
  slotDurationToMinutes,
  dateToPixels,
  pixelsToDate,
} from 'ngx-scheduler';

// Convert a date to its pixel offset within a timeline
const px = dateToPixels(eventStart, viewStart, 1440 /* day in minutes */, 60 /* slot width */);

// Generate all slots for a week timeline
const slots = generateTimeSlots(weekStart, weekEnd, 'day', 'en-US');
```

### Layout Utilities

```typescript
import {
  computeTimelineEventBlocks,
  computeTimeGridEventBlocks,
} from 'ngx-scheduler';

// Compute positioned event blocks for a resource row
const blocks = computeTimelineEventBlocks({
  events,
  viewStart, viewEnd,
  slotWidthPx: 60,
  slotDurationMinutes: 1440,
  rowHeightPx: 50,
  resourceId: 'r1',
});
```

---

## Architecture Overview

```
NgxSchedulerComponent            ← Orchestrator, provides SchedulerStoreService
│
├── SchedulerStoreService         ← Scoped RxJS store (one per <ngx-scheduler>)
│   ├── BehaviorSubject<State>
│   ├── Derived streams (combineLatest / distinctUntilChanged)
│   └── Immutable patch mutations
│
├── NgxSchedulerHeaderComponent   ← Toolbar (today/prev/next, view switcher)
│
└── [active view] ─────────────────────────────────────────────────────────
    │
    ├── NgxTimelineViewComponent  ← Resource Timeline (HIGH PRIORITY)
    │   ├── Scroll sync: mainGrid → slotsHeader + resourceList (passive JS)
    │   ├── generateTimeSlots() / generateTimeSlotGroups()
    │   ├── computeTimelineEventBlocks() (per resource row)
    │   ├── [ngxDraggable] → store.startDrag / updateDrag / commitDrag
    │   └── [ngxResizable] → store.startResize / updateResize / commitResize
    │
    ├── NgxCalendarViewComponent  ← Month grid
    │   └── generateWeekMatrix() + day event bucketing
    │
    └── NgxTimeGridViewComponent  ← Day / Week grid
        ├── computeTimeGridEventBlocks() (% positioning)
        └── Current-time indicator (live red line)
```

### Design Decisions

| Decision | Rationale |
|---|---|
| `ChangeDetectionStrategy.OnPush` everywhere | Eliminates zone-triggered re-renders; streams drive all updates |
| `trackBy` on every `*ngFor` | Prevents DOM thrashing when the event/resource arrays change |
| Pointer Events API instead of HTML5 DnD | No ghost image, full cross-browser control, works in Shadow DOM |
| `zone.runOutsideAngular` for pointer listeners | `pointermove` fires at 60 fps — keeping it outside Angular's zone prevents ~60 CD cycles per second during drag |
| `zone.run()` only on emit | Re-enters the zone exactly when the component tree needs to update |
| Store scoped to component via `providers` | Multiple `<ngx-scheduler>` on the same page get independent state |
| Pure TypeScript utils (no Angular dependencies) | Date math, layout math, and slot generation are unit-testable in isolation |

---

## License

MIT
