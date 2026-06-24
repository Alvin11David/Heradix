export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Workspace {
  id: string;
  name: string;
  logoUrl?: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user?: { id: string; fullName: string; email: string; avatarUrl?: string };
}

export interface BrandGuidelines {
  workspaceId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontPrimary: string;
  fontSecondary?: string;
  logoUrl?: string;
}

export interface CreateWorkspacePayload {
  name: string;
  logoUrl?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: WorkspaceRole;
}
