import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exportamos el servicio para que otros módulos puedan usarlo
})
export class PrismaModule {}