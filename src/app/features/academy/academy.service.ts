import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Course, Lesson, CourseProgress } from '../../core/models/academy.model';

@Injectable({ providedIn: 'root' })
export class AcademyService {
  private readonly api = inject(ApiService);

  getCourses(params?: { level?: string; topic?: string; page?: number }): Observable<Course[]> {
    return this.api.get<Course[]>('/academy/courses', params as Record<string, string | number | boolean | undefined>);
  }

  getCourse(id: string): Observable<Course> {
    return this.api.get<Course>(`/academy/courses/${id}`);
  }

  getLessonStream(courseId: string, lessonId: string): Observable<{ hlsUrl: string }> {
    return this.api.get<{ hlsUrl: string }>(`/academy/courses/${courseId}/lessons/${lessonId}`);
  }

  markLessonComplete(lessonId: string): Observable<void> {
    return this.api.post<void>(`/academy/progress/${lessonId}`);
  }

  getProgress(): Observable<CourseProgress[]> {
    return this.api.get<CourseProgress[]>('/academy/progress');
  }
}
