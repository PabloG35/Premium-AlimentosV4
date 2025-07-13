// api/src/modules/metrics/metrics.module.ts
import { Module, Controller, Get, Header } from '@nestjs/common';
import { register, collectDefaultMetrics } from 'prom-client';

@Controller('metrics')
class MetricsController {
  constructor() {
    collectDefaultMetrics(); // métricas default
  }

  @Get()
  @Header('Content-Type', register.contentType)
  async metrics(): Promise<string> {
    return await register.metrics();
  }
}

@Module({ controllers: [MetricsController] })
export class MetricsModule {}
