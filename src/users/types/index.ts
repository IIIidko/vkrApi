import { Request } from '@nestjs/common';

type Role = 'student' | 'teacher' | 'admin' | 'moderator';

export interface User {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  birth_date: string;
  role: Role;
  created_at: string | Date;
  last_login?: string | Date | null;
  status: 'active' | 'blocked';
  tel?: string | null;
}

export type UserForAdmin = Omit<User, 'password'>;

export type UserForChange = Omit<UserForAdmin, 'last_login' | 'created_at'>;

export interface UserForPasswordCheck {
  password: string;
  email: string;
  id: number;
  role: Role;
}

export interface UserCheckExists {
  email: string;
  phone_number: string;
}

export interface UserCheckEmail {
  email: string;
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
  role: Role;
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
