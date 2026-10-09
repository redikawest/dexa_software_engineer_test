import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { MAX_TEXT_LENGTH, PHONE_MESSAGE, PHONE_PATTERN, cleanPhone, trimText } from './transforms.js';

const TEXT_MESSAGE = (label: string) => `${label} must not be empty (at most ${MAX_TEXT_LENGTH} characters)`;

export class UpdateEmployeeDto {
  @ValidateIf((dto: UpdateEmployeeDto) => dto.name !== undefined)
  @Transform(trimText)
  @IsString({ message: TEXT_MESSAGE('name') })
  @IsNotEmpty({ message: TEXT_MESSAGE('name') })
  @MaxLength(MAX_TEXT_LENGTH, { message: TEXT_MESSAGE('name') })
  name?: string;

  @ValidateIf((dto: UpdateEmployeeDto) => dto.position !== undefined)
  @Transform(trimText)
  @IsString({ message: TEXT_MESSAGE('position') })
  @IsNotEmpty({ message: TEXT_MESSAGE('position') })
  @MaxLength(MAX_TEXT_LENGTH, { message: TEXT_MESSAGE('position') })
  position?: string;

  @ValidateIf((dto: UpdateEmployeeDto) => dto.phone !== undefined)
  @Transform(cleanPhone)
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @ValidateIf((dto: UpdateEmployeeDto) => dto.isActive !== undefined)
  @IsBoolean({ message: 'isActive must be true or false' })
  isActive?: boolean;
}
