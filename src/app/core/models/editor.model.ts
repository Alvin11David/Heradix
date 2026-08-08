export type ExportFormat = 'PNG' | 'JPG' | 'PDF' | 'SVG';

export interface EditorPage {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  margin?: number;
}

export interface EditorDocumentSettings {
  backgroundColor?: string | object;
  gridVisible?: boolean;
  layoutGrids?: Array<Record<string, any>>;
  rulersVisible?: boolean;
  pageMarginsVisible?: boolean;
  guidesVisible?: boolean;
  smartGuidesEnabled?: boolean;
  snapToGridEnabled?: boolean;
  snapToObjectsEnabled?: boolean;
}

export interface EditorProject {
  id: string;
  userId: string;
  title: string;
  assetId?: string;
  canvasJson: string;
  width: number;
  height: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  /** Serialized document snapshot, retained separately from canvasJson for backwards compatibility. */
  documentJson?: string;
  pages?: EditorPage[];
  currentPageIndex?: number;
  settings?: EditorDocumentSettings;
}

export interface CreateProjectPayload {
  assetId?: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface ExportProjectPayload {
  format: ExportFormat;
  quality?: number;
  transparent?: boolean;
}

export interface ExportJob {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  downloadUrl?: string;
  expiresAt?: string;
}
