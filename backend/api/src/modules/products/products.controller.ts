import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { CloudinaryClient } from 'src/clients/cloudinary.client';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly svc: ProductsService,
    private readonly cloud: CloudinaryClient, // ← inyectar aquí
  ) {}

  @Get() findAll(
    @Query('skip', ParseIntPipe) skip = 0,
    @Query('take', ParseIntPipe) take = 100,
  ) {
    return this.svc.findAll(skip, take);
  }

  @Get(':id') findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles(Role.T_II, Role.T_I)
  create(@Body() dto: CreateProductDto) {
    return this.svc.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  @Roles(Role.T_II, Role.T_I)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.svc.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles(Role.T_I)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/image')
  @Roles(Role.T_II, Role.T_I)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    const url = await this.cloud.uploadImage(file);
    return this.svc.update(id, { imageUrl: url });
  }
}
