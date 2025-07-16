import {
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString() productId: string;
  @IsNumber() quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
  userId?: string;
  @IsString()
  @IsOptional()
  couponCode?: string; 
}
