import { IsByteLength, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'currentPassword is required' })
  @IsNotEmpty({ message: 'currentPassword is required' })
  currentPassword!: string;

  @IsString({ message: 'newPassword is required' })
  @MinLength(8, { message: 'New password must be 8 to 72 characters' })
  @IsByteLength(0, 72, { message: 'New password must be 8 to 72 characters' })
  newPassword!: string;
}
