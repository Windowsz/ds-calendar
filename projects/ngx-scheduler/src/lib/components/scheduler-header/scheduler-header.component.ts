import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnDestroy, OnInit, Output,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ViewType } from '../../models/view.model';
import { SchedulerStoreService } from '../../store/scheduler-store.service';
import { formatHeaderTitle } from '../../utils/date.utils';

export interface ViewOption {
  type: ViewType;
  label: string;
}

@Component({
  selector: 'ngx-scheduler-header',
  templateUrl: './scheduler-header.component.html',
  styleUrls: ['./scheduler-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxSchedulerHeaderComponent implements OnInit, OnDestroy {
  @Input() viewOptions: ViewOption[] = [
    { type: 'resourceTimeline',      label: 'Week'  },
    { type: 'resourceTimelineMonth', label: 'Month' },
    { type: 'resourceTimelineDay',   label: 'Day'   },
    { type: 'timeGridWeek',          label: 'Grid W'},
    { type: 'dayGridMonth',          label: 'Grid M'},
  ];
  @Input() locale = 'en-US';

  @Output() viewChange = new EventEmitter<ViewType>();

  title = '';
  activeView: ViewType = 'resourceTimeline';

  private readonly destroy$ = new Subject<void>();

  constructor(private store: SchedulerStoreService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.store.currentDate$.pipe(takeUntil(this.destroy$)).subscribe(date => {
      this.title = formatHeaderTitle(date, this.activeView, this.locale);
      this.cdr.markForCheck();
    });

    this.store.viewType$.pipe(takeUntil(this.destroy$)).subscribe(vt => {
      this.activeView = vt;
      this.title = formatHeaderTitle(this.store.snapshot.currentDate, vt, this.locale);
      this.cdr.markForCheck();
    });
  }

  onPrev(): void  { this.store.navigatePrev(); }
  onNext(): void  { this.store.navigateNext(); }
  onToday(): void { this.store.navigateToday(); }

  onViewSelect(viewType: ViewType): void {
    this.store.setViewType(viewType);
    this.viewChange.emit(viewType);
  }

  trackByViewOption(_: number, opt: ViewOption): string {
    return opt.type;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
