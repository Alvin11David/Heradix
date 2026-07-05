import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../auth/user.service';

type SettingsTab = 'profile' | 'security' | 'preferences';

@Component({
  selector: 'amx-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly authSvc = inject(AuthService);
  private readonly userSvc = inject(UserService);
  private readonly sanitizer = inject(DomSanitizer);

  activeTab = signal<SettingsTab>('profile');

  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    },
    {
      id: 'security',
      label: 'Security',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    },
  ];

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  safeIcon(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  readonly user = computed(() => this.authSvc.currentUser());

  displayName = signal('');
  email = signal('');
  bio = signal('');
  timezone = signal('');

  saving = signal(false);
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  readonly timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
    'Pacific/Auckland', 'Africa/Cairo', 'Africa/Lagos',
  ];

  constructor() {
    const u = this.user();
    if (u) {
      this.displayName.set(u.fullName);
      this.email.set(u.email);
    }
  }

  readonly profileDirty = computed(() =>
    this.displayName() !== (this.user()?.fullName ?? '')
  );

  saveProfile(): void {
    if (!this.profileDirty() || !this.displayName()?.trim()) return;
    this.saving.set(true);
    const newName = this.displayName().trim();
    this.authSvc.patchCurrentUser({ fullName: newName });
    this.userSvc.updateProfile({ fullName: newName }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showToast('Profile updated', 'success');
      },
      error: () => {
        this.authSvc.patchCurrentUser({ fullName: this.user()?.fullName ?? '' });
        this.displayName.set(this.user()?.fullName ?? '');
        this.saving.set(false);
        this.showToast('Failed to update profile', 'error');
      },
    });
  }

  currentPw = signal('');
  newPw = signal('');
  confirmPw = signal('');
  showPw = signal<'current' | 'new' | 'confirm' | null>(null);
  changingPw = signal(false);

  readonly pwStrength = computed(() => {
    const pw = this.newPw();
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  });

  readonly strengthLabel = computed(() => {
    const s = this.pwStrength();
    if (!s) return '';
    const labels: Record<number, string> = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong', 5: 'Very strong' };
    return labels[s] ?? '';
  });

  readonly strengthColor = computed(() => {
    const s = this.pwStrength();
    if (s <= 1) return '#ef4444';
    if (s <= 2) return '#f59e0b';
    if (s <= 3) return '#3b82f6';
    if (s <= 4) return '#22c55e';
    return '#10b981';
  });

  readonly pwMatch = computed(() => !this.confirmPw() || this.newPw() === this.confirmPw());

  readonly canChangePw = computed(() =>
    !!this.currentPw() && !!this.newPw() && this.newPw().length >= 8 && this.pwMatch() && !this.changingPw()
  );

  togglePwVisibility(field: 'current' | 'new' | 'confirm'): void {
    this.showPw.update(v => (v === field ? null : field));
  }

  pwInputType(field: 'current' | 'new' | 'confirm'): string {
    return this.showPw() === field ? 'text' : 'password';
  }

  changePassword(): void {
    if (!this.canChangePw()) return;
    this.changingPw.set(true);
    this.userSvc.changePassword(this.currentPw(), this.newPw()).subscribe({
      next: () => {
        this.changingPw.set(false);
        this.currentPw.set('');
        this.newPw.set('');
        this.confirmPw.set('');
        this.showToast('Password changed successfully', 'success');
      },
      error: () => {
        this.changingPw.set(false);
        this.showToast('Failed. Check your current password', 'error');
      },
    });
  }

  emailNotifs = signal(true);
  pushNotifs = signal(true);
  weeklyDigest = signal(false);
  language = signal('en');

  readonly languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' },
    { value: 'pt', label: 'Português' },
  ];

  savingPrefs = signal(false);

  readonly prefsDirty = computed(() => true);

  savePreferences(): void {
    this.savingPrefs.set(true);
    setTimeout(() => {
      this.savingPrefs.set(false);
      this.showToast('Preferences saved', 'success');
    }, 400);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
