import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World123321' + '1241asdfa sd' + '412!';
  }
}
