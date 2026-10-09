import { ApiProperty } from '@nestjs/swagger';

export class MessageResponse {
  @ApiProperty({ example: 'Password changed' })
  message!: string;
}

export class ErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ description: 'One text, or a list when several fields are wrong.', example: ['password is required'] })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}
