import {
  IsOptional,
  IsString,
  IsNumberString,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReceiveOpportunitiesQueryDto {
  @ApiPropertyOptional({ description: 'Comma-separated stage IDs' })
  @IsOptional()
  @IsString()
  stageIds?: string;

  @ApiPropertyOptional({ description: 'Limit the number of results' })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ description: 'Receive a specific page' })
  @IsOptional()
  @IsNumber()
  page?: number;
}
