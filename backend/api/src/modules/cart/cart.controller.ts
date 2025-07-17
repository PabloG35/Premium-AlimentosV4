// src/modules/cart/cart.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLI)
@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  private getUserId(req): string {
    const id = req.user?.sub ?? req.user?.id;
    if (!id) throw new BadRequestException('User id missing in JWT');
    return id;
  }

  @Get()
  findAll(@Request() req): Promise<CartItemResponseDto[]> {
    return this.service.findAll(this.getUserId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, this.getUserId(req));
  }

  @Post()
  add(@Request() req, @Body() dto: AddCartItemDto) {
    return this.service.add(this.getUserId(req), dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = this.getUserId(req);
    console.log(
      '[CartController] PATCH /cart/:id → id=',
      id,
      'userId=',
      userId,
    );
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, this.getUserId(req));
  }

  @Delete()
  clear(@Request() req) {
    return this.service.clear(this.getUserId(req));
  }
}
