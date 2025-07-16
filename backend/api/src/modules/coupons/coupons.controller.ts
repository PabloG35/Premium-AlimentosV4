import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon';
import { UpdateCouponDto } from './dto/update-coupon';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { ValidateCouponResponseDto } from './dto/validate-coupon-response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: CouponsService) {}

  /**
   * ✅ CLI sólo puede validar un cupón
   */
  @Get(':code/validate')
  @Roles(Role.CLI)
  validate(@Param('code') code: string): Promise<ValidateCouponResponseDto> {
    return this.service.validateByCode(code);
  }

  /**
   * 🔒 Admin sólo
   */
  @Get()
  @Roles(Role.T_I)
  findAll(): Promise<CouponResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.T_I)
  findOne(@Param('id') id: string): Promise<CouponResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.T_I)
  create(@Body() dto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.T_I)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.T_I)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
