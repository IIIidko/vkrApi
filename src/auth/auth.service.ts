import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { checkPassword } from '../users/hashPassword';
import { LoginResult, RefreshResult, Role, SignInPayload } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PG_CONNECTION } from '../constants';
import { Pool } from 'pg';
import { getHashRefresh } from './hashRefresh';

const accessAge: string = '30m';
const refreshAge: string = '60d';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_CONNECTION) private conn: Pool,
    private UsersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const wrong = {
      message: 'wrong password or email',
      success: false,
    };
    try {
      const userData = await this.UsersService.findUserByEmail(email);
      if (!userData) {
        return wrong;
      }
      const isPasswordCorrect: boolean = await checkPassword(
        password,
        userData.password,
      );
      if (isPasswordCorrect) {
        const payload: SignInPayload = {
          email: userData.email,
          sub: userData.id,
          role: userData.role,
        };
        const refreshToken: string = await this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshAge,
        });
        await this.changeRefresh(userData.id, refreshToken);
        await this.UsersService.updateLastLogin(userData.id);
        return {
          success: true,
          access_token: await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: accessAge,
          }),
          refresh_token: refreshToken,
          role: userData.role,
        };
      } else {
        return wrong;
      }
    } catch (e) {
      console.log(e);
      return {
        message: 'incorrect user data',
        success: false,
      };
    }
  }

  async generateTokens(
    email: string,
    id: number,
    role: Role,
  ): Promise<RefreshResult> {
    try {
      const payload: SignInPayload = {
        email: email,
        sub: id,
        role,
      };
      const refreshToken: string = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshAge,
      });
      await this.changeRefresh(id, refreshToken);
      return {
        access_token: await this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: accessAge,
        }),
        refresh_token: refreshToken,
      };
    } catch (e) {
      console.log('not valid user data in token', e);
      return {
        error: `not valid user data in token, ${e}`,
      };
    }
  }

  async changeRefresh(
    userId: number,
    refreshToken: string,
  ): Promise<undefined> {
    const hashRefreshToken: string = await getHashRefresh(refreshToken);
    await this.conn.query(
      'INSERT INTO refresh_tokens (user_id, refresh_token) values ($1, $2) ON CONFLICT (user_id) DO UPDATE SET refresh_token = EXCLUDED.refresh_token;',
      [userId, hashRefreshToken],
    );
  }
}
