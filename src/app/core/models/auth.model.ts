export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  fullName: string;
  status: 'pending_verification';
}

export interface RegisterEmailVerificationPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email?: string;
  token: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}
