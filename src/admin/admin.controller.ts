import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from './guards';
import { getDateRange } from 'utils';
import { UpdateInstallerDto } from './dto';

@ApiBearerAuth('access-token')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/installers')
  receiveInstallers(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const { date, endDate } = getDateRange(month, year);
    return this.adminService.receiveInstallers(date, endDate);
  }

  @Post('/installers')
  updateInstallers(@Body() body: UpdateInstallerDto) {
    return this.adminService.updateInstallers(body);
  }
}
