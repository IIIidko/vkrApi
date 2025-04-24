import { Request } from 'express';

export interface LoginResult {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  nickname?: string;
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
  nickname?: string;
}

export interface CheckResponse {
  isAuth: boolean;
  nickname?: string;
}

export interface SignInPayload {
  nickname: string;
  email: string;
  sub: number;
}

export interface CheckRefresh {
  refreshTokenBD: string;
}

export interface Payload {
  email: string;
  sub: number;
  nickname: string;
}

export interface RequestWithPayload extends Request {
  user?: Payload;
}

export interface RefreshSame {
  same: boolean;
}
