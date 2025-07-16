export class CouponResponseDto {
  id: string;
  code: string;
  discountPercent: number;
  validUntil: Date;
  createdAt: Date;
}
