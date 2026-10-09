import { Transform } from 'class-transformer';
import { IsByteLength, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CreateLoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @Matches(UUID, { message: 'id must be a UUID' })
  id!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Matches(EMAIL, { message: 'email must be a valid email address' })
  @MaxLength(254, { message: 'email must be a valid email address' })
  email!: string;

  @IsString({ message: 'password must be 8 to 72 characters' })
  @MinLength(8, { message: 'password must be 8 to 72 characters' })
  @IsByteLength(0, 72, { message: 'password must be 8 to 72 characters' })
  password!: string;
}
