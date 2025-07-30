import { Injectable, NotFoundException } from '@nestjs/common';
import { Product as PrismaProduct } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { StrapiClient, StrapiProduct } from 'src/clients/strapi.client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strapi: StrapiClient,
  ) {}

  /** Mapea un producto de Strapi a tu DTO */
  private mapStrapi(p: StrapiProduct): ProductResponseDto {
    return {
      id: p.id,
      sku: p.attributes.sku,
      name: p.attributes.name,
      price: parseFloat(p.attributes.price),
      description: p.attributes.description ?? undefined,
      stock: p.attributes.stock,
      imageUrl: p.attributes.image?.data.attributes.url ?? undefined,
      createdAt: new Date(p.attributes.createdAt),
      updatedAt: new Date(p.attributes.updatedAt),
    };
  }

  /** Mapea un producto de Prisma (admin) a tu DTO */
  private mapPrisma(p: PrismaProduct): ProductResponseDto {
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      price: Number(p.price), // ← cast a number
      description: p.description ?? undefined,
      stock: p.stock,
      imageUrl: p.imageUrl ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  // ■ Public read: obtiene desde Strapi
  async findAll(skip = 0, take = 100): Promise<ProductResponseDto[]> {
    const items = await this.strapi.getProducts(skip, take);
    return items.map((p) => this.mapStrapi(p));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const p = await this.strapi.getProductById(id);
    if (!p) throw new NotFoundException(`Product ${id} not found`);
    return this.mapStrapi(p);
  }

  // ■ Admin write: usa Prisma
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const p = await this.prisma.product.create({ data: dto });
    return this.mapPrisma(p);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product ${id} not found`);
    const p = await this.prisma.product.update({
      where: { id },
      data: dto,
    });
    return this.mapPrisma(p);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product ${id} not found`);
    await this.prisma.product.delete({ where: { id } });
  }
}
