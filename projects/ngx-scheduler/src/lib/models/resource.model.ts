export interface NgxResource {
  id: string;
  title: string;
  parentId?: string;
  children?: NgxResource[];
  color?: string;
  order?: number;
  expanded?: boolean;
  extendedProps?: Record<string, any>;
}
