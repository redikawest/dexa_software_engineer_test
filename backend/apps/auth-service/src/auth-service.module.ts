import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, readDatabaseConfig, toPostgresConnection } from '@app/config';
import { AuthServiceController } from './auth-service.controller.js';
import { AuthServiceService } from './auth-service.service.js';
import { EmployeeLogin } from './employee-login.entity.js';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...toPostgresConnection(readDatabaseConfig((key) => config.get<string>(key))),
        entities: [EmployeeLogin],
        // No migrations and no synchronize here: the employee-service owns the schema.
        synchronize: false,
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),
    TypeOrmModule.forFeature([EmployeeLogin]),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
