// src/modules/products/dto/product-response.dto.ts
export class ProductResponseDto {
  id: string;
  sku: string;
  name: string;
  price: number;
  description?: string;
  stock: number;
  imageUrl?: string; 
  createdAt: Date;
  updatedAt: Date;
}
