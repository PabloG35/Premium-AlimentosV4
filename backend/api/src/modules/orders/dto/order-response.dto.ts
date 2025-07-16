import { OrderStatus } from '@prisma/client';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  id: string;
  code: string;
  userId: string;
  items: OrderItemResponseDto[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  coupon?: {
    id: string;
    code: string;
    discountPercent: number;
  };
}
