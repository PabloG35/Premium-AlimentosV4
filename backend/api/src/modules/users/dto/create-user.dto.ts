// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()               name: string;
  @IsEmail()                  email: string;
  @IsNotEmpty() @MinLength(6) password: string;
  @IsEnum(Role)               role: Role;
}
