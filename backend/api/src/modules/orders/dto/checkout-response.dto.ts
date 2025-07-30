// src/modules/orders/dto/checkout-response.dto.ts
import { OrderResponseDto } from './order-response.dto';

export class CheckoutResponseDto {
  order: OrderResponseDto;
  mpPreferenceId: string;
  initPoint: string;
}
