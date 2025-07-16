import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsISO8601,
  IsOptional,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  discountPercent: number;

  @IsISO8601()
  validUntil: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUses?: number;    // ← permite establecer límite de usos
}
