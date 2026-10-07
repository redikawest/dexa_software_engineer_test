import { readDatabaseConfig } from '@app/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './data-source-options.js';

export default new DataSource(buildDataSourceOptions(readDatabaseConfig((key) => process.env[key])));
