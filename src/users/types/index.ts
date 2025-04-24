import { Request } from '@nestjs/common';

export interface User {
  id: number;
  nickname: string;
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  role: 'user' | 'admin' | 'moderator';
  created_at: string | Date;
  last_login?: string | Date | null;
  status: 'active' | 'blocked';
  tel?: string | null;
}

export interface UserForPasswordCheck {
  password: string;
  email: string;
  nickname: string;
  id: number;
}

export interface UserCheckExists {
  nickname: string;
  email: string;
  phone_number: string;
}

export interface UserCheckEmail {
  email: string;
}

export interface UserCheckNickname {
  nickname: string;
}

export type UserRegistration = Omit<
  User,
  'id' | 'status' | 'created_at' | 'last_login' | 'role'
>;

export interface CreateQueryResult {
  id: number;
}

export interface CheckCodeResult {
  isCorrect: boolean;
  reason?:
    | 'time'
    | 'notCorrectCode'
    | 'noCodeBD'
    | 'serverError'
    | 'attemptsOver';
}

export interface Payload {
  email: string;
  sub: number;
  nickname: string;
}

export interface RequestWithPayload extends Request {
  user: Payload;
}

export interface CreateResponse {
  success: boolean;
  failType?:
    | 'time'
    | 'notCorrectCode'
    | 'noCodeBD'
    | 'serverError'
    | 'userData'
    | 'attemptsOver';
  accessToken?: string;
}
