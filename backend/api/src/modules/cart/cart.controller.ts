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

  @Get()
  findAll(@Request() req): Promise<CartItemResponseDto[]> {
    return this.service.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<CartItemResponseDto> {
    return this.service.findOne(id, req.user.sub);
  }

  @Post()
  add(
    @Request() req,
    @Body() dto: AddCartItemDto,
  ): Promise<CartItemResponseDto> {
    return this.service.add(req.user.sub, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    return this.service.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.service.remove(id, req.user.sub);
  }

  @Delete()
  clear(@Request() req): Promise<void> {
    return this.service.clear(req.user.sub);
  }
}
