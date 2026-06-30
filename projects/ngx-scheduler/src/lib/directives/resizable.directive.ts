import { Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';

export interface NgxResizePayload {
  eventId: string;
  deltaX: number;
  edge: 'start' | 'end';
}

@Directive({ selector: '[ngxResizable]' })
export class NgxResizableDirective implements OnInit, OnDestroy {
  @Input('ngxResizable') eventId!: string;
  @Input() resizeEnabled = true;
  @Input() resizeEdge: 'start' | 'end' | 'both' = 'end';

  @Output() resizeStart = new EventEmitter<NgxResizePayload>();
  @Output() resizeMove  = new EventEmitter<NgxResizePayload>();
  @Output() resizeEnd   = new EventEmitter<NgxResizePayload>();

  private activeEdge: 'start' | 'end' | null = null;
  private originX = 0;
  private capturedPointerId = -1;
  private isResizing = false;

  private startHandle: HTMLElement | null = null;
  private endHandle:   HTMLElement | null = null;

  private readonly onMove: (e: PointerEvent) => void;
  private readonly onUp:   (e: PointerEvent) => void;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {
    this.onMove = this.handleMove.bind(this);
    this.onUp   = this.handleUp.bind(this);
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => this.mountHandles());
  }

  ngOnDestroy(): void {
    this.startHandle?.remove();
    this.endHandle?.remove();
    this.detach();
  }

  private mountHandles(): void {
    if (this.resizeEdge === 'start' || this.resizeEdge === 'both') {
      this.startHandle = this.createHandle('start');
      this.el.nativeElement.appendChild(this.startHandle);
    }
    if (this.resizeEdge === 'end' || this.resizeEdge === 'both') {
      this.endHandle = this.createHandle('end');
      this.el.nativeElement.appendChild(this.endHandle);
    }
  }

  private createHandle(edge: 'start' | 'end'): HTMLElement {
    const h = document.createElement('div');
    h.className = `ngx-resize-handle ngx-resize-handle--${edge}`;
    h.setAttribute('aria-hidden', 'true');
    h.style.cssText = [
      'position:absolute',
      `${edge === 'start' ? 'left' : 'right'}:0`,
      'top:0', 'bottom:0', 'width:8px',
      `cursor:${edge === 'start' ? 'w-resize' : 'e-resize'}`,
      'z-index:10',
    ].join(';');
    h.addEventListener('pointerdown', (e: PointerEvent) => this.handleDown(e, edge));
    return h;
  }

  private handleDown(e: PointerEvent, edge: 'start' | 'end'): void {
    if (!this.resizeEnabled) return;
    e.preventDefault();
    e.stopPropagation();

    this.activeEdge = edge;
    this.originX = e.clientX;
    this.capturedPointerId = e.pointerId;
    this.isResizing = false;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.addEventListener('pointermove',   this.onMove, { passive: false });
    document.addEventListener('pointerup',     this.onUp);
    document.addEventListener('pointercancel', this.onUp);

    this.zone.run(() =>
      this.resizeStart.emit({ eventId: this.eventId, deltaX: 0, edge })
    );
  }

  private handleMove(e: PointerEvent): void {
    if (e.pointerId !== this.capturedPointerId || !this.activeEdge) return;
    e.preventDefault();

    const dx = e.clientX - this.originX;
    if (!this.isResizing && Math.abs(dx) > 2) this.isResizing = true;

    if (this.isResizing) {
      const edge = this.activeEdge;
      this.zone.run(() =>
        this.resizeMove.emit({ eventId: this.eventId, deltaX: dx, edge })
      );
    }
  }

  private handleUp(e: PointerEvent): void {
    if (e.pointerId !== this.capturedPointerId) return;
    this.detach();

    if (this.isResizing && this.activeEdge) {
      const dx = e.clientX - this.originX;
      const edge = this.activeEdge;
      this.zone.run(() =>
        this.resizeEnd.emit({ eventId: this.eventId, deltaX: dx, edge })
      );
    }

    this.activeEdge = null;
    this.isResizing = false;
    this.capturedPointerId = -1;
  }

  private detach(): void {
    document.removeEventListener('pointermove',   this.onMove);
    document.removeEventListener('pointerup',     this.onUp);
    document.removeEventListener('pointercancel', this.onUp);
  }
}
