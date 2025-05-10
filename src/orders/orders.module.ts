import { Module } from '@nestjs/common';
import { HighLevelService } from 'services';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, HighLevelService],
})
export class OrdersModule {}
