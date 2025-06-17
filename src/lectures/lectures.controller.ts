import { Body, Controller, Post } from '@nestjs/common';
import { LectureDto } from './lectureDto';
import { LecturesService } from './lectures.service';

@Controller('lectures')
export class LecturesController {
  constructor(private readonly LecturesService: LecturesService) {}

  @Post('create')
  async create(@Body() LectureDto: LectureDto): Promise<{
    success: boolean;
    lectureId?: string;
  }> {
    return await this.LecturesService.createLecture({
      title: LectureDto.title,
      description: LectureDto.description,
    });
  }
}
