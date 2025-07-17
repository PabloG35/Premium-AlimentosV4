import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CartService } from '../cart/cart.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
  ) {}

  /** Devuelve el id de usuario sin importar la propiedad usada en el payload */
  private getUserId(req: any): string {
    return (
      req.user?.sub ?? // estándar JWT
      req.user?.userId ?? // a veces se llama así
      req.user?.id
    ); // fallback
  }

  // ────────────────────────────────────────────
  @Get()
  @Roles(Role.CLI, Role.T_I)
  async findAll(@Request() req): Promise<OrderResponseDto[]> {
    const userId = this.getUserId(req); // ← cambio
    const orders = await this.ordersService.findAll();
    if (req.user.role === Role.CLI) {
      return orders.filter((o) => o.userId === userId); // ← cambio
    }
    return orders;
  }

  // ────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.CLI, Role.T_I)
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.findOne(id);
    const userId = this.getUserId(req); // ← cambio
    if (req.user.role === Role.CLI && order.userId !== userId) {
      throw new BadRequestException('No tienes permiso para ver esta orden');
    }
    return order;
  }

  // ────────────────────────────────────────────
  /** Checkout: crea orden con todo el cart, opcional coupon, y limpia el carrito */
  @Post('checkout')
  @Roles(Role.CLI)
  async checkout(
    @Request() req,
    @Body('couponCode') couponCode?: string,
  ): Promise<OrderResponseDto> {
    const userId = this.getUserId(req); // ← cambio
    const cartItems = await this.cartService.findAll(userId);
    if (!cartItems.length) {
      throw new BadRequestException('Your cart is empty');
    }

    const createDto: CreateOrderDto = {
      items: cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      ...(couponCode?.trim() && { couponCode: couponCode.trim() }),
    };

    const order = await this.ordersService.create(createDto, userId);
    await this.cartService.clear(userId);
    return order;
  }

  // ────────────────────────────────────────────
  @Post()
  @Roles(Role.CLI, Role.T_I)
  async create(
    @Request() req,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const isAdmin = req.user.role === Role.T_I;
    const userId = isAdmin && dto.userId ? dto.userId : this.getUserId(req); // ← cambio
    return this.ordersService.create(dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.T_I)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(Role.T_I)
  async remove(@Param('id') id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}
