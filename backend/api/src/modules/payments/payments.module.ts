// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma.module';
import { PaymentsService } from './payments.service';
import { WebhookController } from './webhook.controller';
import { MercadoPagoClient } from 'src/clients/mercadopago.client';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [HttpModule, PrismaModule, NotificationsModule],
  providers: [PaymentsService, MercadoPagoClient],
  controllers: [WebhookController],
  exports: [PaymentsService], // (y el client si lo usarás fuera)
})
export class PaymentsModule {}
