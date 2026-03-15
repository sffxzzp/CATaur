import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './common/configs/logger.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { RecruiterModule } from './recruiter/recruiter.module';
import { ClientModule } from './client/client.module';
import { CandidateModule } from './candidate/candidate.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    CommonModule,
    AuditLogModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        '.env',
    }),
    LoggerModule.forRoot(loggerConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 120,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
        const useRedisInE2E = process.env.E2E_USE_REDIS === 'true';
        if (isTestEnv && !useRedisInE2E) {
          return {};
        }

        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        // In local dev environments Redis may not be running (or may be blocked by sandboxing).
        // Cache is an optimization, so gracefully fall back to the default in-memory store.
        if (!redisHost || !redisPort) {
          return {};
        }

        try {
          return {
            store: await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
                connectTimeout: useRedisInE2E ? 800 : 800,
                reconnectStrategy: useRedisInE2E ? () => false : undefined,
              },
              password: redisPassword,
              ttl: 600 * 1000, // 10 minutes in milliseconds
            }),
          };
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.warn(`[cache] Redis disabled; falling back to memory cache (${err?.message || 'unknown error'})`);
          return {};
        }
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Enable sync for now to fix E2E tests missing tables/columns
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    FilesModule,
    AdminModule,
    RecruiterModule,
    ClientModule,
    CandidateModule,
    NotificationsModule,
    ReportsModule,
    DashboardModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
