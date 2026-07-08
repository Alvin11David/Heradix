import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

export interface PlayerLesson {
  id: number;
  number: number;
  title: string;
  duration: string;
  durationSecs: number;
  completed: boolean;
  isFree: boolean;
}

export interface CourseComment {
  id: number;
  author: string;
  initials: string;
  avatarColor: string;
  text: string;
  postedAt: string;
}

const MOCK_LESSONS: PlayerLesson[] = [
  { id: 1,  number: 1,  title: '01 - Explaining the concept',                durationSecs: 449,  duration: '7:29',  completed: false, isFree: true },
  { id: 2,  number: 2,  title: '02 - Organize Photoshop panel',              durationSecs: 644,  duration: '10:44', completed: false, isFree: false },
  { id: 3,  number: 3,  title: '03 - Customizing the Photoshop interface',   durationSecs: 293,  duration: '4:53',  completed: false, isFree: false },
  { id: 4,  number: 4,  title: '04 - Explanation practices photoshop tools', durationSecs: 1169, duration: '19:29', completed: false, isFree: false },
  { id: 5,  number: 5,  title: '05 - Main Photoshop Screen Measurements',    durationSecs: 214,  duration: '3:34',  completed: false, isFree: false },
  { id: 6,  number: 6,  title: '06 - Screen measurements in practice',       durationSecs: 371,  duration: '6:11',  completed: false, isFree: false },
  { id: 7,  number: 7,  title: '07 - Working with Layers',                   durationSecs: 544,  duration: '9:04',  completed: false, isFree: false },
  { id: 8,  number: 8,  title: '08 - Layer Masks explained',                 durationSecs: 482,  duration: '8:02',  completed: false, isFree: false },
  { id: 9,  number: 9,  title: '09 - Selection tools deep dive',             durationSecs: 720,  duration: '12:00', completed: false, isFree: false },
  { id: 10, number: 10, title: '10 - Smart Objects & Smart Filters',         durationSecs: 655,  duration: '10:55', completed: false, isFree: false },
  { id: 11, number: 11, title: '11 - Text and Typography tools',             durationSecs: 395,  duration: '6:35',  completed: false, isFree: false },
  { id: 12, number: 12, title: '12 - Adjustment Layers essentials',         durationSecs: 511,  duration: '8:31',  completed: false, isFree: false },
  { id: 13, number: 13, title: '13 - Curves & Levels in depth',              durationSecs: 608,  duration: '10:08', completed: false, isFree: false },
  { id: 14, number: 14, title: '14 - Retouching tools & clone stamp',        durationSecs: 730,  duration: '12:10', completed: false, isFree: false },
  { id: 15, number: 15, title: '15 - Filters & Effects overview',            durationSecs: 418,  duration: '6:58',  completed: false, isFree: false },
  { id: 16, number: 16, title: '16 - Blend modes explained',                durationSecs: 520,  duration: '8:40',  completed: false, isFree: false },
  { id: 17, number: 17, title: '17 - Creating a Flyer from scratch',         durationSecs: 1445, duration: '24:05', completed: false, isFree: false },
  { id: 18, number: 18, title: '18 - Color grading techniques',              durationSecs: 590,  duration: '9:50',  completed: false, isFree: false },
  { id: 19, number: 19, title: '19 - Working with Raw images',               durationSecs: 770,  duration: '12:50', completed: false, isFree: false },
  { id: 20, number: 20, title: '20 - Exporting & saving for print',          durationSecs: 360,  duration: '6:00',  completed: false, isFree: false },
  { id: 21, number: 21, title: '21 - Exporting for web & social media',      durationSecs: 320,  duration: '5:20',  completed: false, isFree: false },
  { id: 22, number: 22, title: '22 - Creating a business card',              durationSecs: 1290, duration: '21:30', completed: false, isFree: false },
  { id: 23, number: 23, title: '23 - Social media post design',              durationSecs: 980,  duration: '16:20', completed: false, isFree: false },
  { id: 24, number: 24, title: '24 - Photo manipulation basics',             durationSecs: 860,  duration: '14:20', completed: false, isFree: false },
  { id: 25, number: 25, title: '25 - Compositing multiple images',           durationSecs: 1100, duration: '18:20', completed: false, isFree: false },
  { id: 26, number: 26, title: '26 - Mockup creation workflow',              durationSecs: 920,  duration: '15:20', completed: false, isFree: false },
  { id: 27, number: 27, title: '27 - Creating a logo from scratch',          durationSecs: 1350, duration: '22:30', completed: false, isFree: false },
  { id: 28, number: 28, title: '28 - Advanced selection: Pen tool',          durationSecs: 780,  duration: '13:00', completed: false, isFree: false },
  { id: 29, number: 29, title: '29 - Neural filters & AI tools',             durationSecs: 640,  duration: '10:40', completed: false, isFree: false },
  { id: 30, number: 30, title: '30 - Final project: Complete poster design', durationSecs: 2100, duration: '35:00', completed: false, isFree: false },
];

const MOCK_COMMENTS: CourseComment[] = [
  { id: 1, author: 'Maria Santos',  initials: 'MS', avatarColor: '#6366f1', text: 'This lesson really helped me understand layers. Thank you!', postedAt: '2 days ago' },
  { id: 2, author: 'Carlos Lima',   initials: 'CL', avatarColor: '#10b981', text: 'The concept explanation is very clear. Moving to lesson 2 now.', postedAt: '5 days ago' },
  { id: 3, author: 'Ana Ferreira',  initials: 'AF', avatarColor: '#f59e0b', text: 'Could you cover blending modes in more depth? Great start!', postedAt: '1 week ago' },
];

@Component({
  selector: 'amx-course-player',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-player.component.html',
  styleUrl:    './course-player.component.scss',
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  contentLoading = signal(true);
  lessons        = signal<PlayerLesson[]>([]);
  comments       = signal<CourseComment[]>([...MOCK_COMMENTS]);

  activeLesson   = signal<PlayerLesson | null>(null);
  playing        = signal(false);
  muted          = signal(false);
  volume         = signal(80);
  currentTime    = signal(0);
  duration       = signal(0);
  buffered       = signal(0);
  showSettings   = signal(false);
  playbackRate   = signal(1);
  commentText    = signal('');
  markingComplete = signal(false);
  settingsMenuOpen = signal(false);

  readonly RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

  readonly completedCount = computed(() =>
    this.lessons().filter(l => l.completed).length
  );

  readonly progressPct = computed(() => {
    const t = this.lessons().length;
    return t ? Math.round((this.completedCount() / t) * 100) : 0;
  });

  readonly seekPct = computed(() => {
    const d = this.duration();
    return d ? Math.round((this.currentTime() / d) * 100) : 0;
  });

  readonly currentTimeStr = computed(() => this.formatTime(this.currentTime()));
  readonly durationStr    = computed(() => this.formatTime(this.duration()));

  readonly activeIndex = computed(() => {
    const al = this.activeLesson();
    if (!al) return -1;
    return this.lessons().findIndex(l => l.id === al.id);
  });

  readonly hasPrev = computed(() => this.activeIndex() > 0);
  readonly hasNext = computed(() => this.activeIndex() < this.lessons().length - 1);

  readonly autoMarkSecs = computed(() => {
    const al = this.activeLesson();
    if (!al) return 0;
    return Math.max(0, al.durationSecs - 60);
  });

  readonly Math = Math;

  ngOnInit(): void {
    setTimeout(() => {
      this.lessons.set(MOCK_LESSONS.map(l => ({ ...l })));
      this.activeLesson.set(MOCK_LESSONS[0]);
      this.contentLoading.set(false);
    }, 1200);
  }

  ngOnDestroy(): void {
  }

  selectLesson(lesson: PlayerLesson): void {
    if (!lesson.isFree && lesson.number > 1) {
    }
    this.activeLesson.set(lesson);
    this.playing.set(false);
    this.currentTime.set(0);
    this.settingsMenuOpen.set(false);
  }

  prevLesson(): void {
    const idx = this.activeIndex();
    if (idx > 0) this.selectLesson(this.lessons()[idx - 1]);
  }

  nextLesson(): void {
    const idx = this.activeIndex();
    if (idx < this.lessons().length - 1) this.selectLesson(this.lessons()[idx + 1]);
  }

  togglePlay(): void {
    this.playing.update(p => !p);
  }

  toggleMute(): void {
    this.muted.update(m => !m);
  }

  setVolume(val: number): void {
    this.volume.set(val);
    if (val === 0) this.muted.set(true);
    else this.muted.set(false);
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pct = +input.value;
    const al = this.activeLesson();
    if (al) {
      this.currentTime.set(Math.round((pct / 100) * al.durationSecs));
    }
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setVolume(+input.value);
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate.set(rate);
    this.settingsMenuOpen.set(false);
  }

  toggleSettings(): void {
    this.settingsMenuOpen.update(v => !v);
  }

  markComplete(): void {
    const al = this.activeLesson();
    if (!al || al.completed) return;
    this.markingComplete.set(true);
    setTimeout(() => {
      this.lessons.update(ls =>
        ls.map(l => l.id === al.id ? { ...l, completed: true } : l)
      );
      this.activeLesson.update(l => l ? { ...l, completed: true } : l);
      this.markingComplete.set(false);
      setTimeout(() => this.nextLesson(), 600);
    }, 800);
  }

  submitComment(): void {
    const text = this.commentText().trim();
    if (!text) return;
    const newComment: CourseComment = {
      id: Date.now(),
      author: 'You',
      initials: 'Y',
      avatarColor: '#f5820a',
      text,
      postedAt: 'just now',
    };
    this.comments.update(c => [newComment, ...c]);
    this.commentText.set('');
  }

  goBack(): void {
    this.router.navigate(['/academy']);
  }

  formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  trackById(_: number, item: { id: number }): number { return item.id; }
}
