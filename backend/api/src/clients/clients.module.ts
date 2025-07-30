// src/clients/clients.module.ts
import { Module } from '@nestjs/common';
import { StrapiClient } from './strapi.client';
import { CloudinaryClient } from './cloudinary.client';


@Module({
  providers: [StrapiClient, CloudinaryClient],
  exports: [StrapiClient, CloudinaryClient],
})
export class ClientsModule {}
