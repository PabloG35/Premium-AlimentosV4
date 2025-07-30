export class CartItemResponseDto {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;  
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
