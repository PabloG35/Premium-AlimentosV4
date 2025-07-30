// src/modules/orders/dto/order-item-response.dto.ts

export class OrderItemResponseDto {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}
