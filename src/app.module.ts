import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { ChatModule } from './chat/chat.module';
import { LecturesModule } from './lectures/lectures.module';
import * as path from 'node:path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MailModule,
    ChatModule,
    LecturesModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'images'),
      serveRoot: '/images/',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
