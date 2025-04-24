import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  transporter: Transporter;
  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: configService.get<string>('GMAIL_USER'), // ваш email
        pass: configService.get<string>('GMAIL_PASSWORD'), // пароль приложения
      },
    });
  }
}
