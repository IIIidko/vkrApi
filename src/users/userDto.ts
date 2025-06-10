import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  middle_name: z.string().nullable().optional(),
  birth_date: z.string().date(),
  tel: z.string().min(12).nullable().optional(),
  code: z.string().length(4),
});

const RoleEnum = z.enum(['student', 'teacher', 'admin', 'moderator']);
const StatusEnum = z.enum(['active', 'blocked']);

export const changeUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  middle_name: z.string().nullable().optional(),
  birth_date: z.string().date(),
  tel: z.string().min(12).nullable().optional(),
  role: RoleEnum,
  status: StatusEnum,
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export type ChangeUserDto = z.infer<typeof changeUserSchema>;

export type LoginUserDto = {
  email: string;
  password: string;
};

export enum alreadyExistsPart {
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
  message: 'Email' | 'Phone';
}

export class CreateUserDtoClass implements CreateUserDto {
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
    description: 'Имя пользователя',
    example: 'John',
    type: String,
    nullable: false,
    required: true,
  })
  first_name: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Doe',
    type: String,
    nullable: false,
    required: true,
  })
  last_name: string;

  @ApiProperty({
    description: 'Отчество пользователя',
    example: 'Ivanov',
    type: String,
    nullable: true,
    required: false,
  })
  middle_name?: string | null;

  @ApiProperty({
    description: 'Дата рождения в формате ISO',
    example: '1990-01-01',
    type: String,
    nullable: false,
    required: true,
  })
  birth_date: string;

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
