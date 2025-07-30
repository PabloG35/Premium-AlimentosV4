import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { BrevoClient } from 'src/clients/brevo.client';
import { PrismaModule } from 'src/prisma.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, BrevoClient],
  exports: [NotificationsService],
})
export class NotificationsModule {}
