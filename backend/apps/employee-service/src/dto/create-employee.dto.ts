import { Transform } from 'class-transformer';
import { IsByteLength, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { MAX_TEXT_LENGTH, PHONE_MESSAGE, PHONE_PATTERN, cleanPhone, lowerEmail, trimText } from './transforms.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEXT_MESSAGE = (label: string) => `${label} is required (at most ${MAX_TEXT_LENGTH} characters)`;
const PASSWORD_MESSAGE = 'password must be 8 to 72 characters';

export class CreateEmployeeDto {
  @Transform(trimText)
  @IsString({ message: TEXT_MESSAGE('name') })
  @IsNotEmpty({ message: TEXT_MESSAGE('name') })
  @MaxLength(MAX_TEXT_LENGTH, { message: TEXT_MESSAGE('name') })
  name!: string;

  @Transform(trimText)
  @IsString({ message: TEXT_MESSAGE('position') })
  @IsNotEmpty({ message: TEXT_MESSAGE('position') })
  @MaxLength(MAX_TEXT_LENGTH, { message: TEXT_MESSAGE('position') })
  position!: string;

  @Transform(lowerEmail)
  @Matches(EMAIL, { message: 'email must be a valid email address' })
  @MaxLength(254, { message: 'email must be a valid email address' })
  email!: string;

  @Transform(cleanPhone)
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone!: string;

  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  @IsByteLength(0, 72, { message: PASSWORD_MESSAGE })
  password!: string;
}
