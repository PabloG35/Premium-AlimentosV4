import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduleTask {
  private readonly logger = new Logger(ScheduleTask.name);

  // Se ejecutará cada minuto para que puedas probarlo fácilmente
  @Cron(CronExpression.EVERY_MINUTE)
  handleCron() {
    this.logger.log('(CRON) ¡Ejecutando tarea programada cada minuto!');
    // Aquí iría la lógica para limpiar cupones expirados, etc.
  }
}