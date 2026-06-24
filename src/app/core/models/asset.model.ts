export type AssetFormat = 'PSD' | 'AI' | 'VECTOR' | 'PHOTO' | 'MOCKUP' | 'VIDEO' | 'PPT' | 'AI_GEN';
export type Orientation = 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';
export type AssetStatus = 'ACTIVE' | 'DRAFT' | 'REVIEW' | 'REMOVED';

export interface Asset {
  id: string;
  title: string;
  slug: string;
  description?: string;
  format: AssetFormat;
  orientation: Orientation;
  isPremium: boolean;
  isEditable: boolean;
  editorJsonUrl?: string;
  previewUrl: string;
  thumbnailUrl: string;
  fileSizeBytes: number;
  downloadCount: number;
  status: AssetStatus;
  authorId?: string;
  categoryId: string;
  category?: Category;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface AssetListParams {
  q?: string;
  format?: AssetFormat;
  orientation?: Orientation;
  isPremium?: boolean;
  categoryId?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
