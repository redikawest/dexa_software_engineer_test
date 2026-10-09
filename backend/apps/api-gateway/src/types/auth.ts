import { ApiProperty } from '@nestjs/swagger';

export class LoginBody {
  @ApiProperty({ description: 'Not case sensitive.', example: 'employee@example.com' })
  email!: string;

  @ApiProperty({ maxLength: 72, format: 'password', example: 'password-123' })
  password!: string;
}

export class LoginUser {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'employee@example.com' })
  email!: string;

  @ApiProperty({ enum: ['EMPLOYEE', 'HR_ADMIN'], description: 'HR_ADMIN can use the /admin routes.' })
  role!: string;
}

export class LoginResponse {
  @ApiProperty({ description: 'Send it on the other routes as: Authorization: Bearer <token>.' })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'Seconds until the token expires.', example: 3600 })
  expiresIn!: number;

  @ApiProperty({ type: LoginUser })
  user!: LoginUser;
}

/** A class (not a type) so Swagger can read it. The rules themselves are checked by auth-service. */
export class ChangePasswordBody {
  @ApiProperty({ description: 'The password used now.', example: 'old-password-123' })
  currentPassword!: string;

  @ApiProperty({
    description: 'The new password. Must differ from the current one.',
    minLength: 8,
    maxLength: 72,
    example: 'new-password-456',
  })
  newPassword!: string;
}
