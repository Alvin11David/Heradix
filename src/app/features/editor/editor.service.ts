import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EditorProject, CreateProjectPayload, ExportProjectPayload, ExportJob } from '../../core/models/editor.model';

@Injectable({ providedIn: 'root' })
export class EditorService {
  private readonly api = inject(ApiService);

  createProject(payload: CreateProjectPayload): Observable<EditorProject> {
    return this.api.post<EditorProject>('/editor/projects', payload);
  }

  getProjects(): Observable<EditorProject[]> {
    return this.api.get<EditorProject[]>('/editor/projects');
  }

  getProject(id: string): Observable<EditorProject> {
    return this.api.get<EditorProject>(`/editor/projects/${id}`);
  }

  saveProject(id: string, canvasJson: string): Observable<EditorProject> {
    return this.api.patch<EditorProject>(`/editor/projects/${id}`, { canvasJson });
  }

  deleteProject(id: string): Observable<void> {
    return this.api.delete<void>(`/editor/projects/${id}`);
  }

  exportProject(id: string, payload: ExportProjectPayload): Observable<ExportJob> {
    return this.api.post<ExportJob>(`/editor/projects/${id}/export`, payload);
  }

  pollExportJob(projectId: string, jobId: string): Observable<ExportJob> {
    return this.api.get<ExportJob>(`/editor/projects/${projectId}/export/${jobId}`);
  }
}
