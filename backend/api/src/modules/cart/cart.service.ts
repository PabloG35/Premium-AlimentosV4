import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private mapItem(i: any): CartItemResponseDto {
    return {
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      subtotal: +(i.product.price * i.quantity).toFixed(2),
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }

  async findAll(userId: string): Promise<CartItemResponseDto[]> {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });
    return items.map(i => this.mapItem(i));
  }

  async findOne(id: string, userId: string): Promise<CartItemResponseDto> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!item || item.userId !== userId) {
      throw new NotFoundException(`Cart item ${id} not found`);
    }
    return this.mapItem(item);
  }

  async add(userId: string, dto: AddCartItemDto): Promise<CartItemResponseDto> {
    // Si ya existe, sumamos
    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
      include: { product: true },
    });
    if (existing) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
        include: { product: true },
      });
      return this.mapItem(updated);
    }
    // Si no, creamos
    const item = await this.prisma.cartItem.create({
      data: {
        user: { connect: { id: userId } },
        product: { connect: { id: dto.productId } },
        quantity: dto.quantity,
      },
      include: { product: true },
    });
    return this.mapItem(item);
  }

  async update(id: string, userId: string, dto: UpdateCartItemDto): Promise<CartItemResponseDto> {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException(`Cart item ${id} not found`);
    }
    const updated = await this.prisma.cartItem.update({
      where: { id },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
    return this.mapItem(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException(`Cart item ${id} not found`);
    }
    await this.prisma.cartItem.delete({ where: { id } });
  }

  async clear(userId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
