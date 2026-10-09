import { IsBoolean } from 'class-validator';

export class SetLoginActiveDto {
  @IsBoolean({ message: 'isActive must be true or false' })
  isActive!: boolean;
}
