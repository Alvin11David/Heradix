import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Workspace, WorkspaceMember, BrandGuidelines, CreateWorkspacePayload, InviteMemberPayload } from '../../core/models/workspace.model';
import { Asset } from '../../core/models/asset.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly api = inject(ApiService);

  createWorkspace(payload: CreateWorkspacePayload): Observable<Workspace> {
    return this.api.post<Workspace>('/workspaces', payload);
  }

  getWorkspaces(): Observable<Workspace[]> {
    return this.api.get<Workspace[]>('/workspaces');
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.api.get<Workspace>(`/workspaces/${id}`);
  }

  updateWorkspace(id: string, payload: Partial<CreateWorkspacePayload>): Observable<Workspace> {
    return this.api.patch<Workspace>(`/workspaces/${id}`, payload);
  }

  inviteMember(workspaceId: string, payload: InviteMemberPayload): Observable<WorkspaceMember> {
    return this.api.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, payload);
  }

  removeMember(workspaceId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/workspaces/${workspaceId}/members/${userId}`);
  }

  getBrandGuidelines(workspaceId: string): Observable<BrandGuidelines> {
    return this.api.get<BrandGuidelines>(`/workspaces/${workspaceId}/brand`);
  }

  saveBrandGuidelines(workspaceId: string, guidelines: BrandGuidelines): Observable<BrandGuidelines> {
    return this.api.put<BrandGuidelines>(`/workspaces/${workspaceId}/brand`, guidelines);
  }

  getWorkspaceAssets(workspaceId: string): Observable<Asset[]> {
    return this.api.get<Asset[]>(`/workspaces/${workspaceId}/assets`);
  }

  uploadWorkspaceAsset(workspaceId: string, form: FormData): Observable<Asset> {
    return this.api.postFormData<Asset>(`/workspaces/${workspaceId}/assets`, form);
  }
}
