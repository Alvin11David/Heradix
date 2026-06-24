export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  shareToken?: string;
  assetCount: number;
  coverThumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionAsset {
  collectionId: string;
  assetId: string;
  addedAt: string;
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
}
