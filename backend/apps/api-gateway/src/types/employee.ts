import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PHONE_NOTE = 'Indonesian mobile number: 08..., 628... or +628.... Spaces and dashes are removed.';

/** Request bodies are classes only so Swagger can read them. The rules themselves are checked by employee-service. */
export class UpdateMyProfileBody {
  @ApiPropertyOptional({ description: PHONE_NOTE, example: '081234567890' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'An http(s) address of the photo, at most 2048 characters. null removes the photo.',
    type: String,
    nullable: true,
    example: 'https://example.com/photo.png',
  })
  photoUrl?: string | null;
}

export class CreateEmployeeBody {
  @ApiProperty({ maxLength: 100, example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ description: 'Also the login name. Not case sensitive.', maxLength: 254, example: 'jane.doe@example.com' })
  email!: string;

  @ApiProperty({ maxLength: 100, example: 'Backend Developer' })
  position!: string;

  @ApiProperty({ description: PHONE_NOTE, example: '081234567890' })
  phone!: string;

  @ApiProperty({ description: 'The first password of the new login.', minLength: 8, maxLength: 72, format: 'password' })
  password!: string;
}

export class UpdateEmployeeBody {
  @ApiPropertyOptional({ maxLength: 100, example: 'Jane Doe' })
  name?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'Team Lead' })
  position?: string;

  @ApiPropertyOptional({ description: PHONE_NOTE, example: '081234567890' })
  phone?: string;

  @ApiPropertyOptional({ description: 'false switches the login off too. You cannot switch off your own.' })
  isActive?: boolean;
}

export type ListEmployeesQuery = { page?: string; pageSize?: string; search?: string };

export class EmployeeProfile {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'Backend Developer' })
  position!: string;

  @ApiProperty({ example: '081234567890' })
  phone!: string;

  @ApiProperty({ type: String, nullable: true, example: 'https://example.com/photo.png' })
  photoUrl!: string | null;
}

export class EmployeeListItem extends EmployeeProfile {
  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class EmployeeListResponse {
  @ApiProperty({ type: [EmployeeListItem] })
  items!: EmployeeListItem[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ description: 'All employees that match, over all pages.', example: 7 })
  total!: number;
}

export class EmployeeDetail extends EmployeeProfile {
  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'The admin who added this employee.', format: 'uuid' })
  createdBy!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
