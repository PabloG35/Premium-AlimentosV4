// src/modules/orders/dto/order-response.dto.ts
export class OrderResponseDto {
  id: string;
  code: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
  }[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userEmail: string;
  userName: string;
  coupon?: { id: string; code: string; discountPercent: number };

  // Opcionales (si luego agregas en BD)
  shippingAddress?: string;
  paymentMethod?: string;
  trackingUrl?: string;
}
