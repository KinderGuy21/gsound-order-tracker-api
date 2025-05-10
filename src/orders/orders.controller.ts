import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineStages, RequestWithUser } from 'types';
import { UpdateOpportunityDto } from './dto';

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
  @ApiOperation({
    summary:
      'Receive the opportunities based on stage IDs, filtered by authenticated users',
  })
  @ApiResponse({
    status: 200,
    description: 'Opportunities Received Successfully',
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

  @Get('opportunities/:opportunityId')
  @ApiOperation({
    summary: 'Receive opportunity details based on opportunity ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Opportunity Received Successfully',
  })
  async receiveOpportunity(@Param('opportunityId') opportunityId: string) {
    return this.ordersService.receiveOpportunity(opportunityId);
  }

  @Patch('opportunities/:opportunityId')
  @ApiOperation({
    summary: 'Update opportunity based on opportunity ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Opportunity Updated Successfully',
  })
  async updateOpportunity(
    @Param('opportunityId') opportunityId: string,
    @Body() body: UpdateOpportunityDto,
  ) {
    return this.ordersService.updateOpportunity(opportunityId, body);
  }
}
