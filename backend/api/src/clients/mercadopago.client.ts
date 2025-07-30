import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Payment as MPPayment } from 'mercadopago/dist/clients/payment'; // 👈
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';

@Injectable()
export class MercadoPagoClient {
  private readonly logger = new Logger(MercadoPagoClient.name);
  private readonly mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  private readonly preference = new Preference(this.mp);
  private readonly payment = new MPPayment(this.mp);

  async createPreference(body: any) {
    return this.preference.create({ body }); // devuelve PreferenceResponse
  }

  /** Trae el pago completo (status, payer, etc.) */
  async getPayment(id: string): Promise<PaymentResponse> {
    return this.payment.get({ id });
  }
}
