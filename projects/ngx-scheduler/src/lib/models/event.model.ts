export interface NgxEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  allDay?: boolean;
  editable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  className?: string | string[];
  extendedProps?: Record<string, any>;
}
