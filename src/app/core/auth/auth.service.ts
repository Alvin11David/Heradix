import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api/api.service';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '../models/auth.model';
import { User } from '../models/user.model';
import { Observable, of, throwError, tap } from 'rxjs';

const ACCESS_TOKEN_KEY  = 'amx_access_token';
const REFRESH_TOKEN_KEY = 'amx_refresh_token';
const USER_KEY          = 'amx_user';

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/**
 * Decode a JWT without a library — returns the payload object or null.
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // Base64-URL → Base64 → JSON
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json   = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Returns true when the JWT is missing, malformed, or its `exp` claim is in the past.
 * A 30-second clock-skew buffer is applied.
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload) return true;
  if (typeof payload['exp'] !== 'number') return false; // no exp → treat as valid
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload['exp'] < nowSeconds - 30; // 30-second buffer
}

// ─── Mock credentials (dev bypass — no backend required) ──────────────────────
const MOCK_EMAIL    = 'kafulumap@gmail.com';
const MOCK_PASSWORD = 'Zulukedra!7';

const MOCK_AUTH_RESPONSE: AuthResponse = {
  accessToken:  'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id:              'mock-user-001',
    email:           MOCK_EMAIL,
    fullName:        'Kafuluma P.',
    role:            'ADMIN',
    isEmailVerified: true,
    createdAt:       '2024-01-01T00:00:00Z',
    updatedAt:       new Date().toISOString(),
  } as import('../models/user.model').User,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private _currentUser = signal<User | null>(this.loadUser());
  private _accessToken = signal<string | null>(
    isTokenExpired(localStorage.getItem(ACCESS_TOKEN_KEY)) ? null : localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly isPremium = computed(() =>
    ['PREMIUM', 'ADMIN'].includes(this._currentUser()?.role ?? '')
  );
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  /** True when the stored access token is expired (or missing). */
  get isAccessTokenExpired(): boolean {
    return isTokenExpired(this._accessToken());
  }

  private loadUser(): User | null {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      // If the stored access token is expired, clear storage and return null
      if (isTokenExpired(token)) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    if (payload.email === MOCK_EMAIL && payload.password === MOCK_PASSWORD) {
      this.setSession(MOCK_AUTH_RESPONSE);
      return of(MOCK_AUTH_RESPONSE);
    }
    if (payload.email && payload.email !== MOCK_EMAIL) {
      return throwError(() => new Error('Invalid email or password.'));
    }
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      tap((res) => this.setSession(res))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    if (payload.email === MOCK_EMAIL && payload.password === MOCK_PASSWORD) {
      const res: AuthResponse = {
        ...MOCK_AUTH_RESPONSE,
        user: { ...MOCK_AUTH_RESPONSE.user, fullName: payload.fullName ?? MOCK_AUTH_RESPONSE.user.fullName },
      };
      this.setSession(res);
      return of(res);
    }
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(
      tap((res) => this.setSession(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return this.api
      .post<AuthResponse>('/auth/refresh', { refreshToken })
      .pipe(tap((res) => this.setSession(res)));
  }

  logout(): void {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.api.post('/auth/logout', { refreshToken }).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<void> {
    return this.api.post<void>('/auth/forgot-password', payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<void> {
    return this.api.post<void>('/auth/reset-password', payload);
  }

  verifyEmail(payload: VerifyEmailPayload): Observable<void> {
    return this.api.post<void>('/auth/verify-email', payload);
  }

  getOAuthUrl(provider: 'google' | 'facebook'): string {
    return `${this.api.baseUrl}/auth/oauth/${provider}`;
  }

  patchCurrentUser(partial: Partial<User>): void {
    const updated = { ...this._currentUser()!, ...partial };
    this._currentUser.set(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._accessToken.set(res.accessToken);
    this._currentUser.set(res.user as User);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._accessToken.set(null);
    this._currentUser.set(null);
  }
}
