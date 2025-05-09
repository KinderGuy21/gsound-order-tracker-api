import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HighLevelService } from './highlevel.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [AuthService, HighLevelService],
  exports: [AuthService, HighLevelService],
})
export class AuthModule {}
