import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCouponDto } from './dto/create-coupon';
import { UpdateCouponDto } from './dto/update-coupon';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { ValidateCouponResponseDto } from './dto/validate-coupon-response.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CouponResponseDto[]> {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);
    return coupon;
  }

  async create(dto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        discountPercent: dto.discountPercent,
        validUntil: new Date(dto.validUntil),
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    await this.findOne(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.discountPercent !== undefined && {
          discountPercent: dto.discountPercent,
        }),
        ...(dto.validUntil !== undefined && {
          validUntil: new Date(dto.validUntil),
        }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.coupon.delete({ where: { id } });
  }

  async validateByCode(code: string): Promise<ValidateCouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      return { code, valid: false, discountPercent: 0, validUntil: null };
    }
    const now = new Date();
    const valid = coupon.validUntil > now;
    return {
      code: coupon.code,
      valid,
      discountPercent: coupon.discountPercent,
      validUntil: coupon.validUntil,
    };
  }
}
