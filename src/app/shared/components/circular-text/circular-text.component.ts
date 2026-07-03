import { Component, ElementRef, Input, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate } from 'motion';

@Component({
  selector: 'amx-circular-text',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="circular-text"
      [class]="className"
      #container
      (mouseenter)="handleHoverStart()"
      (mouseleave)="handleHoverEnd()"
    >
      @for (letter of letters; track $index) {
        <span
          [style.transform]="getTransform($index)"
          [style.WebkitTransform]="getTransform($index)"
          aria-hidden="true"
        >
          {{ letter === ' ' ? '\u00A0' : letter }}
        </span>
      }
    </div>
  `,
  styleUrl: './circular-text.component.scss',
})
export class CircularTextComponent implements AfterViewInit, OnDestroy {
  @Input() text = '';
  @Input() spinDuration = 20;
  @Input() onHover: 'slowDown' | 'speedUp' | 'pause' | 'goBonkers' | undefined = 'speedUp';
  @Input() className = '';

  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;

  private rotationState = { value: 0 };
  private scaleState = { value: 1 };
  private rotationControls: any = null;
  private scaleControls: any = null;
  private rafId = 0;

  get letters(): string[] {
    return Array.from(this.text);
  }

  getTransform(i: number): string {
    const len = this.letters.length;
    const rotationDeg = (360 / len) * i;
    const factor = Math.PI / len;
    const x = factor * i;
    const y = factor * i;
    return `rotateZ(${rotationDeg}deg) translate3d(${x}px, ${y}px, 0)`;
  }

  private syncLoop = (): void => {
    this.container.nativeElement.style.transform =
      `rotate(${this.rotationState.value}deg) scale(${this.scaleState.value})`;
    this.rafId = requestAnimationFrame(this.syncLoop);
  };

  private startRotationAnimation(duration: number, fromValue?: number): void {
    this.rotationControls?.stop();
    const from = fromValue ?? this.rotationState.value;

    this.rotationControls = animate(
      this.rotationState,
      { value: from + 360 },
      {
        ease: 'linear' as const,
        duration,
        type: 'tween' as const,
        repeat: Infinity,
      },
    );
  }

  ngAfterViewInit(): void {
    this.rafId = requestAnimationFrame(this.syncLoop);
    this.startRotationAnimation(this.spinDuration);
    console.log('CircularText mounted with text:', this.text);
  }

  handleHoverStart(): void {
    if (!this.onHover) return;

    const start = this.rotationState.value;
    let scaleTarget = 1;

    switch (this.onHover) {
      case 'slowDown':
        this.startRotationAnimation(this.spinDuration * 2, start);
        break;
      case 'speedUp':
        this.startRotationAnimation(this.spinDuration / 4, start);
        break;
      case 'pause':
        this.rotationControls?.stop();
        this.rotationControls = animate(
          this.rotationState,
          { value: start + 360 },
          {
            type: 'spring' as const,
            damping: 20,
            stiffness: 300,
          },
        );
        break;
      case 'goBonkers':
        this.startRotationAnimation(this.spinDuration / 20, start);
        scaleTarget = 0.8;
        break;
      default:
        this.startRotationAnimation(this.spinDuration, start);
    }

    this.scaleControls?.stop();
    this.scaleControls = animate(
      this.scaleState,
      { value: scaleTarget },
      {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
      },
    );
  }

  handleHoverEnd(): void {
    const start = this.rotationState.value;
    this.startRotationAnimation(this.spinDuration, start);

    this.scaleControls?.stop();
    this.scaleControls = animate(
      this.scaleState,
      { value: 1 },
      {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
      },
    );
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.rotationControls?.stop();
    this.scaleControls?.stop();
  }
}
