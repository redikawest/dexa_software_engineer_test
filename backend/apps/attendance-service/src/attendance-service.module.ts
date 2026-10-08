import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, readDatabaseConfig, toPostgresConnection } from '@app/config';
import { AttendanceRecord } from './attendance-record.entity.js';
import { AttendanceServiceController } from './attendance-service.controller.js';
import { AttendanceServiceService } from './attendance-service.service.js';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...toPostgresConnection(readDatabaseConfig((key) => config.get<string>(key))),
        entities: [AttendanceRecord],
        synchronize: false,
        migrationsRun: false,
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),
    TypeOrmModule.forFeature([AttendanceRecord]),
  ],
  controllers: [AttendanceServiceController],
  providers: [AttendanceServiceService],
})
export class AttendanceServiceModule {}
