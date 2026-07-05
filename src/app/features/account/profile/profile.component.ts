import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../auth/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'amx-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly authSvc = inject(AuthService);
  private readonly userSvc = inject(UserService);

  fullName = signal('');
  email    = signal('');
  saving   = signal(false);
  toast    = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  private originalName = '';
  private originalEmail = '';

  avatarPreview = signal<string | null>(null);
  cropOpen      = signal(false);
  cropImageSrc  = signal<string | null>(null);
  cropX         = signal(0);
  cropY         = signal(0);
  cropSize      = signal(200);
  imageNaturalW = signal(0);
  imageNaturalH = signal(0);
  isDragging    = signal(false);
  dragStartX    = signal(0);
  dragStartY    = signal(0);
  dragOrigX     = signal(0);
  dragOrigY     = signal(0);

  sendingVerification = signal(false);

  readonly user        = computed(() => this.authSvc.currentUser());
  readonly isVerified  = computed(() => this.user()?.isEmailVerified ?? false);
  readonly role        = computed<UserRole>(() => this.user()?.role ?? 'FREE');
  readonly avatarUrl   = computed(() => this.avatarPreview() ?? this.user()?.avatarUrl ?? null);
  readonly isDirty     = computed(() =>
    this.fullName() !== this.originalName || this.email() !== this.originalEmail
  );
  readonly canSave     = computed(() => this.isDirty() && !this.saving() && !!this.fullName()?.trim());

  readonly roleLabel = computed(() => {
    const labels: Record<UserRole, string> = {
      FREE: 'Free', PREMIUM: 'Premium', ADMIN: 'Admin', AFFILIATE: 'Contributor',
    };
    return labels[this.role()] ?? 'Free';
  });

  readonly roleClass = computed(() => `amx-pf__role-badge--${this.role().toLowerCase()}`);

  readonly initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  readonly memberSince = computed(() => {
    const d = this.user()?.createdAt;
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.fullName.set(u.fullName);
        this.email.set(u.email);
        this.originalName = u.fullName;
        this.originalEmail = u.email;
        this.avatarPreview.set(null);
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      this.cropImageSrc.set(src);

      const img = new Image();
      img.onload = () => {
        this.imageNaturalW.set(img.naturalWidth);
        this.imageNaturalH.set(img.naturalHeight);
        const size = Math.min(img.naturalWidth, img.naturalHeight, 320);
        this.cropSize.set(size);
        this.cropX.set(Math.floor((img.naturalWidth - size) / 2));
        this.cropY.set(Math.floor((img.naturalHeight - size) / 2));
        this.cropOpen.set(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    (event.target as HTMLInputElement).value = '';
  }

  onCropMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
    this.dragStartX.set(e.clientX);
    this.dragStartY.set(e.clientY);
    this.dragOrigX.set(this.cropX());
    this.dragOrigY.set(this.cropY());
  }

  onCropMouseMove(e: MouseEvent): void {
    if (!this.isDragging()) return;
    const dx = e.clientX - this.dragStartX();
    const dy = e.clientY - this.dragStartY();
    const maxX = this.imageNaturalW() - this.cropSize();
    const maxY = this.imageNaturalH() - this.cropSize();
    this.cropX.set(Math.max(0, Math.min(maxX, this.dragOrigX() + dx)));
    this.cropY.set(Math.max(0, Math.min(maxY, this.dragOrigY() + dy)));
  }

  onCropMouseUp(): void {
    this.isDragging.set(false);
  }

  get cropPreviewUrl(): string {
    const src = this.cropImageSrc();
    if (!src) return '';
    const s = this.cropSize();
    const x = this.cropX();
    const y = this.cropY();
    return this.extractCrop(src, x, y, s, 120);
  }

  get cropResultUrl(): string {
    const src = this.cropImageSrc();
    if (!src) return '';
    const s = this.cropSize();
    const x = this.cropX();
    const y = this.cropY();
    return this.extractCrop(src, x, y, s, 400);
  }

  private extractCrop(src: string, x: number, y: number, size: number, outSize: number): string {
    try {
      const c = document.createElement('canvas');
      c.width = outSize;
      c.height = outSize;
      const ctx = c.getContext('2d');
      if (!ctx) return src;
      const img = new Image();
      img.src = src;
      ctx.drawImage(img, x, y, size, size, 0, 0, outSize, outSize);
      return c.toDataURL('image/jpeg', 0.92);
    } catch {
      return src;
    }
  }

  confirmCrop(): void {
    const dataUrl = this.cropResultUrl;
    this.avatarPreview.set(dataUrl);
    this.cropOpen.set(false);
  }

  cancelCrop(): void {
    this.cropOpen.set(false);
    this.cropImageSrc.set(null);
  }

  removeAvatar(): void {
    this.avatarPreview.set(null);
    this.authSvc.patchCurrentUser({ avatarUrl: '' });
    this.showToast('Avatar removed', 'success');
  }

  resendVerification(): void {
    this.sendingVerification.set(true);
    this.userSvc.updateProfile({ fullName: this.fullName() }).subscribe({
      next: () => {
        this.sendingVerification.set(false);
        this.showToast('Verification email sent!', 'success');
      },
      error: () => {
        this.sendingVerification.set(false);
        this.showToast('Failed to send verification email. Try again.', 'error');
      },
    });
  }

  save(): void {
    if (!this.canSave()) return;

    const newName = this.fullName().trim();
    const newEmail = this.email().trim();
    const originalName = this.originalName;
    const originalEmail = this.originalEmail;

    this.authSvc.patchCurrentUser({ fullName: newName });
    this.originalName = newName;
    this.originalEmail = newEmail;
    this.saving.set(true);

    const upload$ = this.avatarPreview()
      ? this.uploadAvatarBlob(this.avatarPreview()!)
      : this.userSvc.updateProfile({ fullName: newName });

    upload$.subscribe({
      next: (user) => {
        if (user) this.authSvc.patchCurrentUser(user);
        this.saving.set(false);
        this.showToast('Profile saved successfully', 'success');
      },
      error: () => {
        this.authSvc.patchCurrentUser({ fullName: originalName });
        this.fullName.set(originalName);
        this.email.set(originalEmail);
        this.originalName = originalName;
        this.originalEmail = originalEmail;
        this.saving.set(false);
        this.showToast('Failed to save. Changes reverted.', 'error');
      },
    });
  }

  private uploadAvatarBlob(dataUrl: string) {
    const blob = this.dataUrlToBlob(dataUrl);
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    return this.userSvc.uploadAvatar(file);
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(parts[1]);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
