import { Request } from 'express';

export interface LoginResult {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
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
}

export interface CheckResponse {
  isAuth: boolean;
}

export interface SignInPayload {
  email: string;
  sub: number;
}

export interface CheckRefresh {
  refreshTokenBD: string;
}

export interface Payload {
  email: string;
  sub: number;
}

export interface RequestWithPayload extends Request {
  user?: Payload;
}

export interface RefreshSame {
  same: boolean;
}
