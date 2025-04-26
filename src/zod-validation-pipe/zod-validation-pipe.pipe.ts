import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue: any = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      console.log('pipe zod catch error');
      throw new BadRequestException('Validation failed', error);
    }
  }
}
