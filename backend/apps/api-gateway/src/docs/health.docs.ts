import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

export const HealthDocs = () =>
  applyDecorators(
    ApiTags('Health'),
    ApiOperation({ summary: 'Is the gateway up?', description: 'Needs no token.' }),
    ApiOkResponse({ description: 'A short text.', type: String }),
  );
