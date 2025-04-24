import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PG_CONNECTION } from '../constants';
import { Pool, QueryResult } from 'pg';
import { checkRefresh } from './hashRefresh';
import {
  CheckRefresh,
  Payload,
  RefreshSame,
  RequestWithPayload,
} from './types';

@Injectable()
export class AuthRefreshGuard implements CanActivate {
  constructor(
    @Inject(PG_CONNECTION) private conn: Pool,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithPayload = context.switchToHttp().getRequest();
    const token: string = request.signedCookies['refresh_token'] as string;
    if (!token) {
      throw new ForbiddenException();
    }
    try {
      const payload: Payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const isSame: RefreshSame = await this.checkRefreshBD(payload.sub, token);
      if (isSame) {
        request.user = payload;
      } else {
        throw new ForbiddenException();
      }
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
    } catch {
      throw new ForbiddenException();
    }
    return true;
  }

  async checkRefreshBD(
    userId: number,
    refreshToken: string,
  ): Promise<RefreshSame> {
    try {
      const checkRes: QueryResult<CheckRefresh> = await this.conn.query(
        'SELECT refresh_token FROM refresh_tokens WHERE user_id = $1',
        [userId],
      );
      const refreshTokenBD: string = checkRes.rows[0]?.refreshTokenBD;
      if (!refreshTokenBD) {
        return {
          same: false,
        };
      }
      const isSame: boolean = await checkRefresh(refreshToken, refreshTokenBD);
      return {
        same: isSame,
      };
    } catch (error) {
      throw new Error(`Failed to check refresh tokens: ${error}`);
    }
  }
}
