// src/modules/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { MPPaymentMethod, MPPaymentStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly payments: PaymentsService,
  ) {}

  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        coupon: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.mapOrders(orders);
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        coupon: true,
        user: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return this.mapOrder(order);
  }

  private async generateOrderCode(): Promise<string> {
    const count = await this.prisma.order.count();
    let lettersIndex = Math.floor(count / 1000);
    const letters = Array.from({ length: 3 })
      .reverse()
      .map(() => {
        const char = String.fromCharCode(65 + (lettersIndex % 26));
        lettersIndex = Math.floor(lettersIndex / 26);
        return char;
      })
      .reverse()
      .join('');
    const numbers = (count % 1000).toString().padStart(3, '0');
    return `#${letters}${numbers}`;
  }

  /** Checkout: crea orden + preferencia de MP, devuelve ambos */
  async checkoutAndCreatePreference(
    dto: CreateOrderDto,
    userId: string,
  ): Promise<{
    order: OrderResponseDto;
    mpPreferenceId: string;
    initPoint: string;
  }> {
    /* 1️⃣ Crea la orden en BD */
    const order = await this.create(dto, userId);

    /* 2️⃣ Genera la preferencia en MP */
    const pref = await this.payments.createCheckoutPreference(order);

    /* 3️⃣ Elige la URL correcta según entorno */
    const useSandbox = process.env.NODE_ENV !== 'production'; // o MP_SANDBOX==='true'
    const initPoint = useSandbox
      ? pref.sandbox_init_point! // ← sandbox
      : pref.init_point!;

    const mpPreferenceId = pref.id!;

    if (!initPoint) {
      throw new Error('MercadoPago preference lacks init_point');
    }

    /* 4️⃣ Registra Payment pendiente */
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: MPPaymentMethod.account_money,
        status: MPPaymentStatus.pending,
        externalId: mpPreferenceId,
        amount: new Decimal(order.total),
        currency: 'MXN',
        rawPayload: pref as unknown as Prisma.InputJsonValue,
      },
    });

    return { order, mpPreferenceId, initPoint };
  }

  /** Crea una orden (sin MP preference) */
  async create(dto: CreateOrderDto, userId: string): Promise<OrderResponseDto> {
    // Subtotal
    let subtotal = 0;
    const itemsData = await Promise.all(
      dto.items.map(async (i) => {
        const prod = await this.prisma.product.findUnique({
          where: { id: i.productId },
        });
        if (!prod)
          throw new NotFoundException(`Product ${i.productId} not found`);
        subtotal += Number(prod.price) * i.quantity;
        return {
          product: { connect: { id: i.productId } },
          quantity: i.quantity,
          price: prod.price,
        };
      }),
    );

    // Cupón
    let couponConnect: { connect: { id: string } } | undefined;
    let discountPercent = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode },
      });
      if (!coupon)
        throw new NotFoundException(`Coupon ${dto.couponCode} not found`);
      if (coupon.validUntil <= new Date())
        throw new BadRequestException('Coupon expired');
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      discountPercent = coupon.discountPercent;
      couponConnect = { connect: { id: coupon.id } };
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const discountAmount = +(subtotal * (discountPercent / 100)).toFixed(2);
    const shippingCost = 0; // TODO: lógica real
    const total = +(subtotal - discountAmount + shippingCost).toFixed(2);
    const code = await this.generateOrderCode();

    const rawOrder = await this.prisma.order.create({
      data: {
        code,
        user: { connect: { id: userId } },
        items: { create: itemsData },
        subtotal: new Decimal(subtotal),
        discountAmount: new Decimal(discountAmount),
        shippingCost: new Decimal(shippingCost),
        total: new Decimal(total),
        status: 'PENDING',
        paymentMethod: MPPaymentMethod.account_money,
        paymentStatus: MPPaymentStatus.pending,
        ...(couponConnect && { coupon: couponConnect }),
      },
      include: {
        items: { include: { product: true } },
        coupon: true,
        user: true,
      },
    });

    const order = this.mapOrder(rawOrder);
    this.notifications.sendOrderPlacedEmail(order).catch(() => {});
    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    await this.findOne(id);
    const rawOrder = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { include: { product: true } },
        coupon: true,
        user: true,
      },
    });

    const order = this.mapOrder(rawOrder);
    this.notifications.sendOrderStatusUpdateEmail(order).catch(() => {});
    return order;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.order.delete({ where: { id } });
  }

  private mapOrder(o: any): OrderResponseDto {
    return {
      id: o.id,
      code: o.code,
      userId: o.userId,
      items: o.items.map((i: any) => ({
        productId: i.productId,
        name: i.product.name,
        price: Number(i.price),
        quantity: i.quantity,
        imageUrl: i.product.imageUrl ?? null,
      })),
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      shippingCost: Number(o.shippingCost),
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      userEmail: o.user.email,
      userName: o.user.name,
      ...(o.coupon && {
        coupon: {
          id: o.coupon.id,
          code: o.coupon.code,
          discountPercent: o.coupon.discountPercent,
        },
      }),
      paymentMethod: o.paymentMethod ?? undefined,
      trackingUrl: o.trackingUrl ?? undefined,
      shippingAddress: o.shippingAddress ?? undefined,
    };
  }

  private mapOrders(arr: any[]): OrderResponseDto[] {
    return arr.map((o) => this.mapOrder(o));
  }
}
