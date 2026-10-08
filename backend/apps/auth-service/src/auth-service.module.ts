import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, JWT_ALGORITHM, readDatabaseConfig, readJwtSigningConfig, toPostgresConnection } from '@app/config';
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
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { privateKey, expiresInSeconds, issuer, audience } = readJwtSigningConfig((key) =>
          config.get<string>(key),
        );
        return {
          privateKey,
          signOptions: { algorithm: JWT_ALGORITHM, expiresIn: expiresInSeconds, issuer, audience },
        };
      },
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
