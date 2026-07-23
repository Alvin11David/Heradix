import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
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
  },
];

@Component({
  selector: 'amx-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss',
})
export class CourseListComponent implements OnInit {
  private readonly academySvc = inject(AcademyService);
  private readonly authSvc    = inject(AuthService);

  carouselIndex  = signal(0);
  contentLoading = signal(true);
  courses        = signal<AcademyCourse[]>([]);

  /** True when the current user has an active Premium or Admin account */
  readonly isPremium = computed(() => this.authSvc.isPremium());

  /** Stat values derived from loaded course data so they stay accurate */
  readonly courseCount  = computed(() => this.courses().length);
  readonly lessonCount  = computed(() => this.courses().reduce((s, c) => s + c.lessons, 0));

  readonly statIcons = [
    'M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0',
  ];

  readonly highlights = [
    { icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', title: 'Video Courses', desc: 'From basic to advanced' },
    { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', title: 'Active Community', desc: 'Exchange ideas and take questions' },
    { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', title: 'Exclusive Content', desc: 'Only for Premium subscribers' },
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

  prev(): void {
    this.carouselIndex.update(i => Math.max(0, i - 1));
  }

  next(): void {
    this.carouselIndex.update(i => Math.min(this.courses().length - 4, i + 1));
  }
}
