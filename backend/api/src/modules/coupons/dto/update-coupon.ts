import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
