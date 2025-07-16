import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip = 0, take = 100): Promise<ProductResponseDto[]> {
    return this.prisma.product.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    // Asegura que exista
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    // Asegura que exista
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
  }
}
