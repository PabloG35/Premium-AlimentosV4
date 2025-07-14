// src/modules/users/dto/update-profile.dto.ts
import {
  IsOptional,
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsUUID() id?: string; 
  @IsOptional() @IsNotEmpty() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @MinLength(6) password?: string;
}
