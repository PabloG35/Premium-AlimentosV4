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
    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code,
        discountPercent: dto.discountPercent,
        validUntil: new Date(dto.validUntil),
        maxUses: dto.maxUses ?? null, // <- aquí lo mapeas
      },
    });
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.discountPercent !== undefined && {
          discountPercent: dto.discountPercent,
        }),
        ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
        ...(dto.code && { code: dto.code }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.coupon.delete({ where: { id } });
  }

  async validateByCode(code: string): Promise<ValidateCouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon '${code}' not found`);
    }

    const now = new Date();
    let valid = true;
    let reason: string | undefined;

    // 1) Ha expirado?
    if (coupon.validUntil < now) {
      valid = false;
      reason = 'Expired';
    }
    // 2) Se han agotado los usos?
    else if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      valid = false;
      reason = 'Usage limit reached';
    }

    return {
      code: coupon.code,
      valid,
      discountPercent: coupon.discountPercent,
      validUntil: coupon.validUntil,
      maxUses: coupon.maxUses ?? undefined,
      usedCount: coupon.usedCount,
      reason,
    };
  }
}
