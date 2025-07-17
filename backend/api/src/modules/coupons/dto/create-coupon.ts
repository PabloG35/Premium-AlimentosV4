// src/modules/coupons/dto/create-coupon.dto.ts

import { IsString, IsInt, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsInt()
  @Min(0)
  discountPercent: number;

  @IsDateString()
  validUntil: string;

  @IsOptional()             // <- así permitimos que venga o no
  @IsInt()
  @Min(1)
  maxUses?: number;         // <- aquí lo declaras
}
