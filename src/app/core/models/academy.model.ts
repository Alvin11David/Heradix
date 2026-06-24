export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic: string;
  isPremium: boolean;
  lessonCount: number;
  durationMinutes: number;
  lessons?: Lesson[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  durationSeconds: number;
  isFreePreview: boolean;
  hlsUrl?: string;
}

export interface CourseProgress {
  courseId: string;
  completedLessonIds: string[];
  percentComplete: number;
  lastAccessedAt: string;
}
