export type ExportFormat = 'PNG' | 'JPG' | 'PDF' | 'SVG';

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
