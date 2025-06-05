import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { HighLevelService } from 'services/highlevel.service';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, HighLevelService],
})
export class AdminModule {}
