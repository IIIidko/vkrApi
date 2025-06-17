import { Module } from '@nestjs/common';
import { LecturesController } from './lectures.controller';
import { LecturesService } from './lectures.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [LecturesController],
  providers: [LecturesService],
  imports: [DatabaseModule],
})
export class LecturesModule {}
