import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [AuthModule, JwtModule, DatabaseModule],
})
export class ChatModule {}
