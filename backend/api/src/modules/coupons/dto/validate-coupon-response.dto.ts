export class ValidateCouponResponseDto {
  code: string;
  valid: boolean;
  discountPercent: number;
  validUntil: Date | null;   
}
