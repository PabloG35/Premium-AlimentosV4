import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoClient } from 'src/clients/mercadopago.client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly mp: MercadoPagoClient) {}

  /** Crea preferencia y devuelve init_point + id generado */
  async createCheckoutPreference(order: {
    id: string;
    items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    userEmail: string;
    userName: string;
  }) {
    const items = order.items.map((i) => ({
      id: i.productId,
      title: i.name,
      unit_price: Number(i.price),
      quantity: i.quantity,
      currency_id: 'MXN',
    }));

    const notificationUrl = `${process.env.API_URL}${process.env.MP_WEBHOOK_PATH}`;

    const body = {
      items,
      payer: { email: order.userEmail, name: order.userName },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure`,
        pending: `${process.env.FRONTEND_URL}/checkout/pending`,
      },
      auto_return: 'approved',
      external_reference: order.id, // se guarda en mpPayment.external_reference
      notification_url: notificationUrl,
    };

    const pref = await this.mp.createPreference(body);
    this.logger.log(`Preference created: ${pref.id}`);
    return pref; // .id, .init_point, .sandbox_init_point
  }

  async getPaymentInfo(id: string) {
    return this.mp.getPayment(id);
  }

  /** Valida HMAC si MP_WEBHOOK_KEY existe */
  verifySignature(signatureHeader: string | undefined, rawBody: string): void {
    if (!process.env.MP_WEBHOOK_KEY) return;
    if (!signatureHeader) throw new Error('Missing x-signature');

    const v1 = signatureHeader
      .split(',')
      .find((p) => p.startsWith('v1='))
      ?.split('=')[1];
    if (!v1) throw new Error('Bad signature header');

    const expected = crypto
      .createHmac('sha256', process.env.MP_WEBHOOK_KEY)
      .update(rawBody)
      .digest('hex');

    if (expected !== v1) throw new Error('Invalid signature');
  }
}
