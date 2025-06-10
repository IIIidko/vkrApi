import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ZodValidationPipe } from '../zod-validation-pipe/zod-validation-pipe.pipe';
import {
  ChangeUserDto,
  CreateUserDto,
  CreateUserDtoClass,
  createUserSchema,
  ResponseCreateUser,
  ResponseFailedCreateUser,
} from './userDto';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';
import { SendEmailDto, sendEmailSchema } from './emailDto';
import {
  CheckCodeResult,
  CreateResponse,
  RequestWithPayload,
  UserForAdmin,
} from './types';

const millisecondsAge: number = 2 * 30 * 24 * 60 * 60 * 1000;

@Controller('users')
export class UsersController {
  constructor(
    private readonly UserService: UsersService,
    private readonly AuthService: AuthService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('getAll')
  async getAll(@Request() req: RequestWithPayload): Promise<UserForAdmin[]> {
    return this.UserService.getAllUsers(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Put('changeUser')
  async changeUser(
    @Request() req: RequestWithPayload,
    @Body() ChangeUserDto: ChangeUserDto,
  ): Promise<boolean> {
    return this.UserService.changeUser(req.user.sub, {
      email: ChangeUserDto.email,
      id: ChangeUserDto.id,
      birth_date: ChangeUserDto.birth_date,
      last_name: ChangeUserDto.last_name,
      first_name: ChangeUserDto.first_name,
      tel: ChangeUserDto.tel,
      role: ChangeUserDto.role,
      middle_name: ChangeUserDto.middle_name,
      status: ChangeUserDto.status,
    });
  }

  @UseGuards(AuthGuard)
  @Get('testGuard')
  @Header('Access-Control-Allow-Credentials', 'true')
  getData(@Request() req: RequestWithPayload) {
    return req.user;
  }

  @Get('checkemail/:email')
  async checkEmailExists(
    @Param('email') email: string,
  ): Promise<{ exists: boolean }> {
    if (!email.includes('@')) {
      throw new BadRequestException('Wrong email');
    }
    return await this.UserService.checkEmailExists(email);
  }

  @UseGuards(AuthGuard)
  @Delete('delete')
  async deleteUser(
    @Request() req: RequestWithPayload,
  ): Promise<{ success: boolean }> {
    const res: boolean = await this.UserService.deleteUser(req.user?.sub);
    return {
      success: res,
    };
  }

  @Post('create')
  @UsePipes(new ZodValidationPipe(createUserSchema))
  @ApiBody({ type: CreateUserDtoClass })
  @ApiCreatedResponse({
    type: ResponseCreateUser,
    description: 'Created user result',
  })
  @ApiConflictResponse({
    type: ResponseFailedCreateUser,
    description: 'Already exists user',
  })
  async create(
    @Body() CreateUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CreateResponse> {
    let userId: number;
    const checkResult: CheckCodeResult = await this.UserService.checkCode(
      CreateUserDto.email,
      CreateUserDto.code,
    );
    if (!checkResult.isCorrect) {
      return {
        success: false,
        failType: checkResult.reason,
      };
    }
    try {
      const createResult: null | number =
        await this.UserService.createUser(CreateUserDto);
      if (!createResult) {
        return {
          success: false,
          failType: 'userData',
        };
      } else {
        userId = createResult;
      }
    } catch (error: unknown) {
      console.log('error in create user', error);
      const message: string =
        error instanceof Error
          ? error.message.split(' ').slice(0, 1).join('')
          : 'unknown error';
      if (message === 'unknown error') {
        throw new HttpException(String(error), 500);
      }
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          error: `already exists`,
          message: message,
        },
        HttpStatus.CONFLICT,
        {
          cause: 'Email or Phone Number exists',
        },
      );
    }
    const tokens = await this.AuthService.generateTokens(
      CreateUserDto.email,
      userId,
      'student',
    );
    response.cookie('refresh_token', tokens.refresh_token, {
      maxAge: millisecondsAge,
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
    });
    setImmediate(() => {
      this.UserService.deleteVerificationCode(CreateUserDto.email);
    });
    return {
      success: true,
      accessToken: tokens.access_token,
    };
  }

  @Post('sendcode')
  @UsePipes(new ZodValidationPipe(sendEmailSchema))
  async sendCode(
    @Body() sendEmailDto: SendEmailDto,
  ): Promise<{ success: boolean }> {
    const success: boolean = await this.UserService.sendCode(
      sendEmailDto.email,
    );
    return { success: success };
  }
}
