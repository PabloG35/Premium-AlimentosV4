// src/modules/auth/dto/refresh.dto.ts
import { IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @IsNotEmpty() refreshToken: string;
}
