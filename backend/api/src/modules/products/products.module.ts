import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from 'src/prisma.module';
import { StrapiClient } from 'src/clients/strapi.client';
import { CloudinaryClient } from 'src/clients/cloudinary.client';

@Module({
  imports: [PrismaModule],
  providers: [ProductsService, CloudinaryClient, StrapiClient],
  controllers: [ProductsController],
})
export class ProductsModule {}
