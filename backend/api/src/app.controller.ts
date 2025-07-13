import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { Role } from '@prisma/client';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug-sentry')
  @SentryExceptionCaptured()
  getError() {
    throw new Error('My first Sentry error!');
  }

  @Get('admin-stuff')
  @Roles(Role.T_I, Role.T_II)
  @UseGuards(RolesGuard)
  getAdminStuff(): string {
    return '¡Esto es material secreto de administrador!';
  }
}
