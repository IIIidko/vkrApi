import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithPayload } from '../auth/types';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { HistoryItem, MessageData, MessagePairs } from './types';

@Controller('chat')
export class ChatController {
  constructor(private readonly ChatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post('message')
  async requestWithoutHistory(
    @Body() messageData: MessageData,
    @Request() req: RequestWithPayload,
    @Res() response: Response,
  ): Promise<void> {
    if (!req.user?.sub) {
      throw new UnauthorizedException();
    }
    response.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });
    await this.ChatService.pipeResponseForChatAnswer(
      messageData.message,
      response,
      req.user?.sub,
    );
  }

  @UseGuards(AuthGuard)
  @Get('getHistories')
  async getHistories(
    @Request() req: RequestWithPayload,
  ): Promise<HistoryItem[]> {
    if (!req.user?.sub) {
      throw new UnauthorizedException();
    }
    return await this.ChatService.getHistories(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('messagesByHistory/:id')
  async getMessagesByHistory(
    @Param() params: { id: string },
    @Request() req: RequestWithPayload,
  ): Promise<MessagePairs[]> {
    if (!req.user?.sub) {
      throw new UnauthorizedException();
    }
    return await this.ChatService.getMessagesByHistoryId(
      params.id,
      req.user.sub,
    );
  }
}
