import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient, BrevoEmailPayload } from 'src/clients/brevo.client';
import {
  RegistrationParams,
  OrderPlacedParams,
  OrderStatusUpdateParams,
  ReviewRequestParams,
  PaymentStatusParams
} from './types/email-params';
import { OrderResponseDto } from '../orders/dto/order-response.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly brevo: BrevoClient) {}

  /** 1) Correo de registro */
  async sendRegistrationEmail(user: {
    email: string;
    name: string;
  }): Promise<void> {
    const params: RegistrationParams = {
      customerName: user.name ?? user.email,
    };

    await this.brevo.sendTemplateEmail<RegistrationParams>({
      to: [{ email: user.email, name: user.name ?? user.email }],
      templateId: Number(process.env.BREVO_REGISTRATION_TEMPLATE_ID),
      params,
    });

    this.logger.log(`Registration email sent to ${user.email}`);
  }

  /** 2) Correo de nueva orden */
  async sendOrderPlacedEmail(order: OrderResponseDto): Promise<void> {
    const params: OrderPlacedParams = {
      customerName: order.userName ?? order.userEmail,
      orderCode: order.code,
      orderDate: order.createdAt.toISOString(),
      shippingAddress: order.shippingAddress ?? '',
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        subtotal: i.price * i.quantity,
      })),
      subtotal: order.subtotal ?? order.total, // fallback
      discountAmount: order.discountAmount ?? 0,
      shippingCost: order.shippingCost ?? 0,
      total: order.total,
      paymentMethod: order.paymentMethod ?? 'N/A',
      orderLink: `${process.env.FRONTEND_URL}/orders/${order.id}`,
    };

    await this.brevo.sendTemplateEmail<OrderPlacedParams>({
      to: [{ email: order.userEmail, name: order.userName ?? order.userEmail }],
      templateId: Number(process.env.BREVO_ORDER_PLACED_TEMPLATE_ID),
      params,
    });

    this.logger.log(`Order placed email sent to ${order.userEmail}`);
  }

  /** 3) Correo de actualización de estatus */
  async sendOrderStatusUpdateEmail(order: OrderResponseDto): Promise<void> {
    const params: OrderStatusUpdateParams = {
      customerName: order.userName ?? order.userEmail,
      orderCode: order.code,
      newStatus: order.status,
      statusDate: new Date().toISOString(),
      trackingUrl: order.trackingUrl ?? undefined,
    };

    await this.brevo.sendTemplateEmail<OrderStatusUpdateParams>({
      to: [{ email: order.userEmail, name: order.userName ?? order.userEmail }],
      templateId: Number(process.env.BREVO_STATUS_UPDATE_TEMPLATE_ID),
      params,
    });

    this.logger.log(`Order status update email sent to ${order.userEmail}`);
  }

  /** 4 & 5) Solicitud de review (inicial + recordatorio) */
  async sendReviewRequestEmail(order: OrderResponseDto): Promise<void> {
    const params: ReviewRequestParams = {
      customerName: order.userName ?? order.userEmail,
      orderCode: order.code,
      products: order.items.map((i) => ({
        name: i.name,
        productUrl: `${process.env.FRONTEND_URL}/products/${i.productId}`,
        reviewUrl: `${process.env.JUDGEME_BASE_URL}/review/new?product_id=${i.productId}&order_id=${order.id}`,
      })),
      thankYouNote: '¡Gracias por tu compra! Tu opinión nos ayuda a mejorar.',
    };

    await this.brevo.sendTemplateEmail<ReviewRequestParams>({
      to: [{ email: order.userEmail, name: order.userName ?? order.userEmail }],
      templateId: Number(process.env.BREVO_REVIEW_REQUEST_TEMPLATE_ID),
      params,
    });

    this.logger.log(`Review request email sent to ${order.userEmail}`);
  }

  async sendPaymentStatusEmail(data: {
    email: string;
    name: string;
    orderCode: string;
    paymentStatus: string;
    amount: number;
    transactionId?: string;
    orderId: string;
  }): Promise<void> {
    const params: PaymentStatusParams = {
      customerName:  data.name,
      orderCode:     data.orderCode,
      paymentStatus: data.paymentStatus,
      amount:        data.amount,
      transactionId: data.transactionId,
      orderLink:     `${process.env.FRONTEND_URL}/orders/${data.orderId}`,
    };

    await this.brevo.sendTemplateEmail<PaymentStatusParams>({
      to:         [{ email: data.email, name: data.name }],
      templateId: Number(process.env.BREVO_PAYMENT_STATUS_TEMPLATE_ID),
      params,
    });

    this.logger.log(`Payment status email (${data.paymentStatus}) sent to ${data.email}`);
  }

  /** Genérico: HTML directo */
  async sendGenericEmail(payload: BrevoEmailPayload): Promise<void> {
    await this.brevo.sendEmail(payload);
    this.logger.log(
      `Generic email sent to ${payload.to.map((t) => t.email).join(', ')}`,
    );
  }
}
