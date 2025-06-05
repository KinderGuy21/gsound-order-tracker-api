import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateOpportunityFiles, RequestWithUser } from 'types';
import { ReceiveOpportunitiesQueryDto, UpdateOpportunityDto } from './dto';

@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
    @Request() req: RequestWithUser,
    @Query() query: ReceiveOpportunitiesQueryDto,
  ) {
    const { stageIds, limit, page } = query;
    const idsArray = stageIds ? stageIds.split(',') : [];
    return this.ordersService.receiveUserOpportunities({
      stageIds: idsArray,
      user: req.user,
      limit,
      page,
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'resultImage', maxCount: 1 },
      { name: 'preInstallImage', maxCount: 1 },
    ]),
  )
  @ApiOperation({
    summary: 'Update opportunity based on opportunity ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Opportunity Updated Successfully',
  })
  async updateOpportunity(
    @Request() req: RequestWithUser,
    @Param('opportunityId') opportunityId: string,
    @Body() body: UpdateOpportunityDto,
    @UploadedFiles()
    files: UpdateOpportunityFiles,
  ) {
    return this.ordersService.updateOpportunity(
      req.user,
      opportunityId,
      body,
      files,
    );
  }
}
