import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './authDto';
import {
  CheckResponse,
  LoginResponse,
  LoginResult,
  RefreshResult,
} from './types';
import { Response } from 'express';
import { AuthRefreshGuard } from './authRefresh.guard';
import { AuthGuard } from './auth.guard';

const millisecondsAge: number = 2 * 30 * 24 * 60 * 60 * 1000;

interface Payload {
  email: string;
  sub: number;
  nickname: string;
}

interface RequestWithPayload extends Request {
  user: Payload;
}

@Controller('auth')
export class AuthController {
  constructor(private AuthService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const loginResult: LoginResult = await this.AuthService.login(
      signInDto.emailOrNickname,
      signInDto.password,
    );
    response.cookie('refresh_token', loginResult.refresh_token, {
      maxAge: millisecondsAge,
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
    });
    return {
      access_token: loginResult.access_token,
      success: loginResult.success,
      message: loginResult.message,
      nickname: loginResult.nickname,
    };
  }

  @UseGuards(AuthGuard)
  @Post('check')
  @HttpCode(200)
  check(@Request() req: RequestWithPayload): CheckResponse {
    return {
      isAuth: true,
      nickname: req.user.nickname,
    };
  }

  @UseGuards(AuthRefreshGuard)
  @Post('refresh')
  @Header('Access-Control-Allow-Credentials', 'true')
  async refresh(
    @Res({ passthrough: true }) response: Response,
    @Request() req: RequestWithPayload,
  ): Promise<LoginResponse> {
    const refreshResult: RefreshResult = await this.AuthService.generateTokens(
      req.user?.email,
      req.user?.nickname,
      req.user?.sub,
    );
    response.cookie('refresh_token', refreshResult.refresh_token, {
      maxAge: millisecondsAge,
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
    });
    return {
      success: true,
      access_token: refreshResult.access_token,
    };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response): { success: boolean } {
    response.clearCookie('refresh_token');
    return { success: true };
  }
}
