import { Transform } from 'class-transformer';
import { IsOptional, IsUrl, Matches, MaxLength, ValidateIf } from 'class-validator';
import { PHONE_MESSAGE, PHONE_PATTERN, cleanPhone } from './transforms.js';

const MAX_PHOTO_URL_LENGTH = 2048;
const PHOTO_MESSAGE = `photoUrl must be an http(s) URL of at most ${MAX_PHOTO_URL_LENGTH} characters, or null`;

export class UpdateProfileDto {
  @ValidateIf((dto: UpdateProfileDto) => dto.phone !== undefined)
  @Transform(cleanPhone)
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false }, { message: PHOTO_MESSAGE })
  @MaxLength(MAX_PHOTO_URL_LENGTH, { message: PHOTO_MESSAGE })
  photoUrl?: string | null;
}
