import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<CartItemResponseDto[]> {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });
    return items.map((i) => this.mapItem(i));
  }

  private mapItem(i: any): CartItemResponseDto {
    const price = i.product.price;
    const quantity = i.quantity;
    return {
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      price: price,
      quantity: quantity,
      subtotal: +(price * quantity).toFixed(2),
      imageUrl: i.product.imageUrl ?? null,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
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
    const item = await this.prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
      update: { quantity: { increment: dto.quantity } },
      create: {
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      include: { product: true },
    });

    return this.mapItem(item);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    // 1) Log de entrada
    console.log(
      '[CartService.update] id:',
      id,
      'userId:',
      userId,
      'newQty:',
      dto.quantity,
    );

    // 2) Busca en BD
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    // 3) Log de lo que encontró
    console.log('[CartService.update] findUnique result:', item);

    // 4) Verificación de pertenencia
    if (!item || item.userId !== userId) {
      console.log(
        '[CartService.update] NotFound porque',
        'item:',
        item,
        'item?.userId:',
        item?.userId,
        '!== userId:',
        userId,
      );
      throw new NotFoundException(`Cart item ${id} not found`);
    }

    // 5) Si todo ok, actualiza
    const updated = await this.prisma.cartItem.update({
      where: { id },
      data: { quantity: dto.quantity },
      include: { product: true },
    });

    console.log('[CartService.update] updated:', updated);
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
