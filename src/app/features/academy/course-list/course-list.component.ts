import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AcademyService } from '../academy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { catchError, of } from 'rxjs';

// ── UI shape used by the template ─────────────────────────────────────────────
interface AcademyCourse {
  id: string;
  title: string;
  instructor: string;
  lessons: number;
  rating: number | null;
  reviews: number | null;
  level: string;
  thumb: string;
  durationMinutes: number;
}

// ── Fallback data shown when the API is unavailable ───────────────────────────
const FALLBACK_COURSES: AcademyCourse[] = [
  {
    id: 'course-1',
    title: 'Photoshop Essential: Complete Guide for Beginners',
    instructor: 'Bruno Albin',
    lessons: 30,
    rating: 4.8,
    reviews: 5,
    level: 'BEGINNER',
    thumb: 'https://picsum.photos/seed/photoshop-design/400/225',
    durationMinutes: 296,
  },
  {
    id: 'course-2',
    title: "Cinema 4D: The Beginner's Journey to Expert",
    instructor: 'Juliano Carneiro',
    lessons: 128,
    rating: null,
    reviews: null,
    level: 'ADVANCED',
    thumb: 'https://picsum.photos/seed/cinema4d-3d/400/225',
    durationMinutes: 720,
  },
  {
    id: 'course-3',
    title: 'Carousel Creation: Advanced Techniques in Photoshop',
    instructor: 'Maicon Arouche',
    lessons: 27,
    rating: 5.0,
    reviews: 3,
    level: 'ADVANCED',
    thumb: 'https://picsum.photos/seed/carousel-ps/400/225',
    durationMinutes: 185,
  },
  {
    id: 'course-4',
    title: 'Adobe Illustrator: Professional Visual Identity Creation',
    instructor: 'Luiz Ramos',
    lessons: 78,
    rating: 5.0,
    reviews: 6,
    level: 'ADVANCED',
    thumb: 'https://picsum.photos/seed/illustrator-vi/400/225',
    durationMinutes: 480,
  },
];

@Component({
  selector: 'amx-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss',
})
export class CourseListComponent implements OnInit {
  private readonly academySvc = inject(AcademyService);
  private readonly authSvc    = inject(AuthService);

  contentLoading = signal(true);
  courses        = signal<AcademyCourse[]>([]);
  activeFilter   = signal<string>('all');

  /** True when the current user has an active Premium or Admin account */
  readonly isPremium = computed(() => this.authSvc.isPremium());

  /** Stat values derived from loaded course data so they stay accurate */
  readonly courseCount  = computed(() => this.courses().length);
  readonly lessonCount  = computed(() => this.courses().reduce((s, c) => s + c.lessons, 0));

  readonly filteredCourses = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.courses();
    return this.courses().filter(c => c.level.toLowerCase() === f);
  });

  readonly filters = [
    { label: 'All', value: 'all' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

  readonly highlights = [
    {
      icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      title: 'HD Video Courses',
      desc: 'Studio-quality lessons from beginner to advanced',
    },
    {
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      title: 'Community Discussions',
      desc: 'Ask questions and share work with other students',
    },
    {
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z',
      title: 'Completion Certificate',
      desc: 'Earn a certificate to share with your portfolio',
    },
    {
      icon: 'M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
      title: 'Downloadable Resources',
      desc: 'Project files, brushes and templates included',
    },
  ];

  readonly gateFeatures = [
    'Unlimited access to all courses & lessons',
    'Download project files and resources',
    'Earn certificates on completion',
    'Priority support from instructors',
    'New courses added every month',
  ];

  ngOnInit(): void {
    this.academySvc.getCourses().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: (data) => {
        if (data?.length) {
          this.courses.set(data.map(c => ({
            id: c.id,
            title: c.title,
            instructor: c.topic ?? 'Instructor',
            lessons: c.lessonCount,
            rating: null,
            reviews: null,
            level: c.level,
            thumb: c.thumbnailUrl ?? '',
            durationMinutes: c.durationMinutes ?? 0,
          })));
        } else {
          this.courses.set(FALLBACK_COURSES);
        }
        this.contentLoading.set(false);
      },
      error: () => {
        this.courses.set(FALLBACK_COURSES);
        this.contentLoading.set(false);
      },
    });
  }

  setFilter(value: string): void {
    this.activeFilter.set(value);
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  }
}
