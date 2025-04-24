import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createUserSchema = z.object({
  nickname: z.string(),
  email: z.string().email(),
  password: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  birth_date: z.string().date().nullable().optional(),
  tel: z.string().min(12).nullable().optional(),
  code: z.string().length(4),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export type LoginUserDto = {
  email: string;
  password: string;
};

export enum alreadyExistsPart {
  Nickname = 'Nickname',
  Email = 'Email',
  Phone = 'Phone',
}

export class ResponseCreateUser {
  @ApiProperty()
  success: boolean;
}

export class ResponseFailedCreateUser {
  @ApiProperty()
  status: number;

  @ApiProperty()
  error: string;

  @ApiProperty({
    enum: alreadyExistsPart,
  })
  message: 'Nickname' | 'Email' | 'Phone';
}

export class CreateUserDtoClass implements CreateUserDto {
  @ApiProperty({
    description: 'Никнейм пользователя',
    example: 'john_doe',
    type: String,
  })
  nickname!: string;

  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'john.doe@example.com',
    type: String,
  })
  email!: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'securePassword123',
    type: String,
  })
  password!: string;

  @ApiProperty({
    description: 'Имя пользователя (может быть null)',
    example: 'John',
    type: String,
    nullable: true,
    required: false,
  })
  first_name?: string | null;

  @ApiProperty({
    description: 'Фамилия пользователя (может быть null)',
    example: 'Doe',
    type: String,
    nullable: true,
    required: false,
  })
  last_name?: string | null;

  @ApiProperty({
    description: 'Дата рождения в формате ISO (может быть null)',
    example: '1990-01-01',
    type: String,
    nullable: true,
    required: false,
  })
  birth_date?: string | null;

  @ApiProperty({
    description: 'Номер телефона (может быть null) 12 символов',
    example: '+1234567890',
    type: String,
    nullable: true,
    required: false,
  })
  tel?: string | null;
  @ApiProperty({
    description: 'Код подтверждения из 4 символов цифр',
    example: '4444',
    type: String,
    required: true,
  })
  code: string;
}
