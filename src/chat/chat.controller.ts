import {
  Body,
  Controller,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithPayload } from '../auth/types';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { Readable } from 'node:stream';

interface MessageData {
  message: string;
  historyId?: string;
  contextId?: string;
}

interface MessageResponse {
  success: boolean;
  messageResponse: string;
}

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
    response.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });
    console.log(req.user?.sub);
    console.log(messageData);
    await this.ChatService.pipeResponseForChatAnswer(
      messageData.message,
      response,
    );
  }
}
