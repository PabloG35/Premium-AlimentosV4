// src/modules/coupons/dto/validate-coupon-response.dto.ts
import { IsString, IsBoolean, IsInt, IsOptional, IsDate } from 'class-validator';

export class ValidateCouponResponseDto {
  @IsString()
  code: string;

  @IsBoolean()
  valid: boolean;

  @IsInt()
  discountPercent: number;

  @IsDate()
  validUntil: Date;

  @IsOptional()
  @IsInt()
  maxUses?: number;

  @IsInt()
  usedCount: number;

  @IsOptional()
  @IsString()
  reason?: string;    // “Expired” o “Usage limit reached”
}
