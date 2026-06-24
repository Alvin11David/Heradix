export type ExportFormat = 'PNG' | 'PDF' | 'SVG';

export interface EditorProject {
  id: string;
  userId: string;
  title: string;
  assetId?: string;
  canvasJson: string; // serialised Fabric.js JSON
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
  quality?: number;    // 1–100 (PNG/JPG)
  transparent?: boolean;
}

export interface ExportJob {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  downloadUrl?: string;
  expiresAt?: string;
}
