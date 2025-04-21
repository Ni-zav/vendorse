import { Module } from '@nestjs/common';
import { TenderService } from './tender.service';
import { TenderController } from './tender.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TenderService],
  controllers: [TenderController],
  exports: [TenderService],
})
export class TenderModule {}