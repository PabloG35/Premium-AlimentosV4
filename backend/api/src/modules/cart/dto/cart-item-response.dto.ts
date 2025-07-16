export class CartItemResponseDto {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;  // price * quantity
  createdAt: Date;
  updatedAt: Date;
}
