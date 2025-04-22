import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
})
export class DashboardModule {}