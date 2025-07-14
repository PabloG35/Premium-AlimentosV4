// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../../prisma.module';


@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
