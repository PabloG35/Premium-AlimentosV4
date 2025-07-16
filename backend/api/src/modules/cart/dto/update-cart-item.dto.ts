import { PartialType } from '@nestjs/swagger';
import { AddCartItemDto } from './add-cart-item.dto';

export class UpdateCartItemDto extends PartialType(AddCartItemDto) {}
