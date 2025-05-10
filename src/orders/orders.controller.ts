import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineStages, RequestWithUser } from 'types';

@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('pipeline/stages')
  @ApiOperation({ summary: 'Receive the pipeline stages based on ID' })
  @ApiResponse({
    status: 200,
    description: 'Pipeline Stages Received Successfully',
  })
  async receivePipelineStages(): Promise<PipelineStages[]> {
    return this.ordersService.receivePipelineStages();
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Receive the pipeline stages based on ID' })
  @ApiResponse({
    status: 200,
    description: 'Pipeline Stages Received Successfully',
  })
  async receiveUserOpportunities(
    @Query('stageIds') stageIds: string,
    @Query('limit') limit: number,
    @Query('startAfter') startAfter: string | null,
    @Query('startAfterId') startAfterId: string | null,
    @Request() req: RequestWithUser,
  ) {
    const idsArray = stageIds.split(',');
    return this.ordersService.receiveUserOpportunities({
      stageIds: idsArray,
      user: req.user,
      limit,
      startAfter,
      startAfterId,
    });
  }
}
