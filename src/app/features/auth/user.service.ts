import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../../core/models/auth.model';
import { User, UpdateProfilePayload } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<User> {
    return this.api.get<User>('/users/me');
  }

  updateProfile(payload: UpdateProfilePayload): Observable<User> {
    return this.api.patch<User>('/users/me', payload);
  }

  uploadAvatar(file: File): Observable<User> {
    const form = new FormData();
    form.append('avatar', file);
    return this.api.patchFormData<User>('/users/me/avatar', form);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.api.patch<void>('/users/me/password', { oldPassword, newPassword });
  }

  deleteAccount(): Observable<void> {
    return this.api.delete<void>('/users/me');
  }
}
