import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('email')
  @Roles(Role.T_I)
  async sendGenericEmail(@Body() dto: SendEmailDto) {
    await this.notifications.sendGenericEmail({
      to: dto.to.map((c) => ({ email: c.email, name: c.name })),
      sender: { email: dto.sender.email, name: dto.sender.name },
      subject: dto.subject,
      htmlContent: dto.html,
    });
    return { ok: true };
  }

  @Post('register')
  @Roles(Role.T_I)
  async registration(@Body() user: { email: string; name: string }) {
    await this.notifications.sendRegistrationEmail(user);
    return { ok: true };
  }

  @Post('order-placed')
  @Roles(Role.T_I)
  async orderPlaced(@Body() order: OrderResponseDto) {
    await this.notifications.sendOrderPlacedEmail(order);
    return { ok: true };
  }

  @Post('order-status')
  @Roles(Role.T_I)
  async orderStatus(@Body() order: OrderResponseDto) {
    await this.notifications.sendOrderStatusUpdateEmail(order);
    return { ok: true };
  }

  @Post('review-request')
  @Roles(Role.T_I)
  async reviewRequest(@Body() order: OrderResponseDto) {
    await this.notifications.sendReviewRequestEmail(order);
    return { ok: true };
  }
}
