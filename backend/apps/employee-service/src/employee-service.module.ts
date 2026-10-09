import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '@app/messaging';
import { AppConfigModule, readDatabaseConfig, toPostgresConnection } from '@app/config';
import { AuthClient } from './auth-client.js';
import { Employee } from './employee.entity.js';
import { EmployeeServiceController } from './employee-service.controller.js';
import { EmployeeServiceService } from './employee-service.service.js';

@Module({
  imports: [
    AppConfigModule,
    MessagingModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...toPostgresConnection(readDatabaseConfig((key) => config.get<string>(key))),
        entities: [Employee],
        // The tables are created by the migrations in backend/database, which run before the
        // services start (the `migrate` container in docker-compose.yml). Nothing is changed here.
        synchronize: false,
        migrationsRun: false,
        // Fail fast in development instead of retrying for half a minute.
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),
    TypeOrmModule.forFeature([Employee]),
  ],
  controllers: [EmployeeServiceController],
  providers: [EmployeeServiceService, AuthClient],
})
export class EmployeeServiceModule {}
