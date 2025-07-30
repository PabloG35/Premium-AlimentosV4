import { Controller, Post, Req, Res, HttpCode, Logger } from '@nestjs/common';
import { Prisma, MPPaymentMethod, MPPaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PaymentsService } from './payments.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

const WEBHOOK_PATH = process.env.MP_WEBHOOK_PATH || '/webhooks/mercadopago';

@Controller()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post(WEBHOOK_PATH)
  @HttpCode(200)
  async handleWebhook(@Req() req, @Res() res) {
    try {
      /* 1. Body & firma ---------------------------------------------------- */
      const rawBodyBuf = (req as any).body as Buffer | undefined;
      if (!rawBodyBuf?.length) return res.send(); // nada que procesar

      const rawBody = rawBodyBuf.toString('utf8');
      const signature = req.headers['x-signature'] as string | undefined;
      this.payments.verifySignature(signature, rawBody);

      const event = JSON.parse(rawBody);
      this.logger.debug({ event });

      /* 2. Persistimos el evento bruto ------------------------------------ */
      await this.prisma.webhookEvent.create({
        data: {
          eventId: String(event.id ?? event.data?.id ?? Date.now()),
          type: event.type ?? 'unknown',
          rawPayload: event,
        },
      });

      /* 3. Solo procesamos payment.* -------------------------------------- */
      if (!event.type?.startsWith('payment')) return res.send();
      const mpId = String(event.data?.id);
      if (!mpId) return res.send();

      /* 4. Obtenemos el pago completo de MP ------------------------------- */
      const mpPayment = await this.payments.getPaymentInfo(mpId);

      // Ignoramos simulador / pagos huérfanos
      if (!mpPayment.external_reference) {
        this.logger.warn(`Pago ${mpId} sin external_reference — ignorado.`);
        return res.send();
      }

      /* 5. Mapeo a enums --------------------------------------------------- */
      const status = mpPayment.status as MPPaymentStatus;
      const method = (mpPayment.payment_type_id ??
        'account_money') as MPPaymentMethod;

      /* 6. Upsert del Payment -------------------------------------------- */
      const payment = (await this.prisma.payment.upsert({
        where: { externalId: mpId },
        update: {
          status,
          method,
          transactionId: String(mpPayment.id),
          rawPayload: mpPayment as unknown as Prisma.InputJsonValue,
        },
        create: {
          externalId: mpId,
          preferenceId: (mpPayment as any).preference_id ?? null,
          orderId: mpPayment.external_reference as string,
          amount: new Prisma.Decimal(mpPayment.transaction_amount ?? 0),
          currency: mpPayment.currency_id ?? 'MXN',
          status,
          method,
          transactionId: String(mpPayment.id),
          rawPayload: mpPayment as unknown as Prisma.InputJsonValue,
        } as Prisma.PaymentUncheckedCreateInput,
        include: { order: { include: { user: true } } },
      })) as Prisma.PaymentGetPayload<{
        include: { order: { include: { user: true } } };
      }>;

      /* 7. Sincronizamos Order ------------------------------------------- */
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: status,
          ...(status === 'approved' && { status: 'PAID' }),
        },
      });

      /* 8. E‑mail al cliente --------------------------------------------- */
      if (
        ['approved', 'cancelled', 'pending', 'refunded', 'rejected'].includes(
          status,
        )
      ) {
        await this.notifications.sendPaymentStatusEmail({
          email: payment.order.user.email,
          name: payment.order.user.name,
          orderCode: payment.order.code,
          paymentStatus: status,
          amount: Number(payment.amount),
          transactionId: payment.transactionId!,
          orderId: payment.orderId,
        });
      }

      return res.send();
    } catch (err) {
      this.logger.error('Webhook error', err);
      return res.status(400).send('Webhook error');
    }
  }
}
