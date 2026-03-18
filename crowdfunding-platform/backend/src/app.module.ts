import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { CommunityModule } from './modules/community/community.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    ScheduleModule.forRoot(),
    
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    RewardsModule,
    CommunityModule,
    RealtimeModule,
    AnalyticsModule,
    PaymentsModule,
  ],
})
export class AppModule {}

