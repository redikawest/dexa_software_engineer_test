import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_PASSWORD_LENGTH = 72;

export class LoginDto {
  @Transform(({ value }): unknown => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'email is required' })
  @IsNotEmpty({ message: 'email is required' })
  email!: string;

  @MaxLength(MAX_PASSWORD_LENGTH, { message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` })
  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password is required' })
  password!: string;
}
