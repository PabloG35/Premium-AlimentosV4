import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContactDto {
  @IsString() name!: string;
  @IsString() email!: string;
}

export class SendEmailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  to!: ContactDto[];

  @ValidateNested()
  @Type(() => ContactDto)
  sender!: ContactDto;

  @IsString() subject!: string;
  @IsString() html!: string;
}
