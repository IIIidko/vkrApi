import { Request } from 'express';

export type Role = 'student' | 'teacher' | 'admin' | 'moderator';

export interface LoginResult {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  role?: Role;
}
export interface RefreshResult {
  access_token?: string;
  refresh_token?: string;
  error?: string;
}
export interface LoginResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  role: Role;
}

export interface RefreshResponse {
  success: boolean;
  message?: string;
  access_token?: string;
}

export interface CheckResponse {
  isAuth: boolean;
  role?: Role;
}

export interface SignInPayload {
  email: string;
  sub: number;
  role: Role;
}

export interface CheckRefresh {
  refreshTokenBD: string;
}

export interface Payload {
  email: string;
  sub: number;
  role: Role;
}

export interface RequestWithPayload extends Request {
  user: Payload;
}

export interface RefreshSame {
  same: boolean;
}
