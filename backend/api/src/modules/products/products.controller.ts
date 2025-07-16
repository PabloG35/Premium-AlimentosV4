import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  // Público: lista productos
  @Get()
  async findAll(
    @Query('skip', ParseIntPipe) skip = 0,
    @Query('take', ParseIntPipe) take = 100,
  ): Promise<ProductResponseDto[]> {
    return this.service.findAll(skip, take);
  }

  // Público: detalle de un producto
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.service.findOne(id);
  }

  // Solo Admin (T_I): crear producto
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.T_I)
  @Post()
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.service.create(dto);
  }

  // Solo Tier II y Admin (T_II, T_I): actualizar producto
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.T_II, Role.T_I)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.service.update(id, dto);
  }

  // Solo Admin (T_I): borrar producto
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.T_I)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
