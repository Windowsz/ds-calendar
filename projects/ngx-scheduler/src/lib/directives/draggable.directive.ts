import { Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';

export interface NgxDragPayload {
  eventId: string;
  deltaX: number;
  deltaY: number;
  clientX: number;
  clientY: number;
}

@Directive({ selector: '[ngxDraggable]' })
export class NgxDraggableDirective implements OnInit, OnDestroy {
  @Input('ngxDraggable') eventId!: string;
  @Input() dragEnabled = true;
  @Input() dragHandleSelector?: string;

  @Output() dragStart = new EventEmitter<NgxDragPayload>();
  @Output() dragMove  = new EventEmitter<NgxDragPayload>();
  @Output() dragEnd   = new EventEmitter<NgxDragPayload>();

  private isDragging = false;
  private originX = 0;
  private originY = 0;
  private capturedPointerId = -1;

  private readonly onDown: (e: PointerEvent) => void;
  private readonly onMove: (e: PointerEvent) => void;
  private readonly onUp:   (e: PointerEvent) => void;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {
    this.onDown = this.handleDown.bind(this);
    this.onMove = this.handleMove.bind(this);
    this.onUp   = this.handleUp.bind(this);
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.el.nativeElement.addEventListener('pointerdown', this.onDown);
    });
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('pointerdown', this.onDown);
    this.detach();
  }

  private handleDown(e: PointerEvent): void {
    if (!this.dragEnabled || e.button !== 0) return;

    if (this.dragHandleSelector) {
      const target = e.target as HTMLElement;
      if (!target.closest(this.dragHandleSelector)) return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.originX = e.clientX;
    this.originY = e.clientY;
    this.capturedPointerId = e.pointerId;
    this.isDragging = false;

    this.el.nativeElement.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove',   this.onMove, { passive: false });
    document.addEventListener('pointerup',     this.onUp);
    document.addEventListener('pointercancel', this.onUp);
  }

  private handleMove(e: PointerEvent): void {
    if (e.pointerId !== this.capturedPointerId) return;

    const dx = e.clientX - this.originX;
    const dy = e.clientY - this.originY;

    if (!this.isDragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      this.isDragging = true;
      this.zone.run(() =>
        this.dragStart.emit({ eventId: this.eventId, deltaX: 0, deltaY: 0, clientX: this.originX, clientY: this.originY })
      );
    }

    if (this.isDragging) {
      this.zone.run(() =>
        this.dragMove.emit({ eventId: this.eventId, deltaX: dx, deltaY: dy, clientX: e.clientX, clientY: e.clientY })
      );
    }
  }

  private handleUp(e: PointerEvent): void {
    if (e.pointerId !== this.capturedPointerId) return;
    this.detach();

    if (this.isDragging) {
      const dx = e.clientX - this.originX;
      const dy = e.clientY - this.originY;
      this.zone.run(() =>
        this.dragEnd.emit({ eventId: this.eventId, deltaX: dx, deltaY: dy, clientX: e.clientX, clientY: e.clientY })
      );
    }

    this.isDragging = false;
    this.capturedPointerId = -1;
  }

  private detach(): void {
    document.removeEventListener('pointermove',   this.onMove);
    document.removeEventListener('pointerup',     this.onUp);
    document.removeEventListener('pointercancel', this.onUp);
  }
}
