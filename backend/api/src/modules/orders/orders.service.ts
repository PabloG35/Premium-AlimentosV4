import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** 1) Encuentra todas las órdenes, trae items + producto + cupón */
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.mapOrders(orders);
  }

  /** 2) Encuentra una orden por ID */
  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        coupon: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return this.mapOrder(order);
  }

  /** Genera un code único en formato #ABC123 */
  private async generateOrderCode(): Promise<string> {
    function randomCode() {
      const letters = Array.from({ length: 3 })
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
        .join('');
      const numbers = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      return `#${letters}${numbers}`;
    }

    let code: string;
    let exists: any;
    do {
      code = randomCode();
      exists = await this.prisma.order.findUnique({ where: { code } });
    } while (exists);
    return code;
  }

  /** 3) Crea una orden, aplica cupón e incrementa usedCount */
  async create(dto: CreateOrderDto, userId: string): Promise<OrderResponseDto> {
    // → Calcula subtotal y arma items
    let subtotal = 0;
    const itemsData = await Promise.all(
      dto.items.map(async i => {
        const prod = await this.prisma.product.findUnique({ where: { id: i.productId } });
        if (!prod) throw new NotFoundException(`Product ${i.productId} not found`);
        subtotal += prod.price * i.quantity;
        return {
          product: { connect: { id: i.productId } },
          quantity: i.quantity,
          price: prod.price,
        };
      }),
    );

    // → Procesa cupón (si existe)
    let couponConnect: { connect: { id: string } } | undefined;
    let discountPercent = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.couponCode } });
      if (!coupon) throw new NotFoundException(`Coupon ${dto.couponCode} not found`);
      if (coupon.validUntil <= new Date()) throw new BadRequestException('Coupon expired');
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      discountPercent = coupon.discountPercent;
      couponConnect = { connect: { id: coupon.id } };
      // incrementa contador de usos
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // → Genera código único
    const code = await this.generateOrderCode();

    // → Calcula total con descuento
    const total = +(subtotal * (1 - discountPercent / 100)).toFixed(2);

    // → Crea la orden
    const order = await this.prisma.order.create({
      data: {
        code,
        user: { connect: { id: userId } },
        items: { create: itemsData },
        total,
        ...(couponConnect && { coupon: couponConnect }),
      },
      include: {
        items: { include: { product: true } },
        coupon: true,
      },
    });

    return this.mapOrder(order);
  }

  /** 4) Actualiza el status */
  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    await this.findOne(id);
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { include: { product: true } },
        coupon: true,
      },
    });
    return this.mapOrder(order);
  }

  /** 5) Elimina la orden */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.order.delete({ where: { id } });
  }

  /** Mappea un objeto Order Prisma al DTO */
  private mapOrder(o: any): OrderResponseDto {
    const base: any = {
      id: o.id,
      code: o.code,
      userId: o.userId,
      items: o.items.map(i => ({
        productId: i.productId,
        name: i.product.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
    if (o.coupon) {
      base.coupon = {
        id: o.coupon.id,
        code: o.coupon.code,
        discountPercent: o.coupon.discountPercent,
      };
    }
    return base as OrderResponseDto;
  }

  /** Mappea un array de órdenes */
  private mapOrders(arr: any[]): OrderResponseDto[] {
    return arr.map(o => this.mapOrder(o));
  }
}
