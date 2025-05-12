import { IsOptional, IsString, IsNumberString } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Start after this opportunity ID' })
  @IsOptional()
  @IsString()
  startAfterId?: string;

  @ApiPropertyOptional({
    description: 'Start after this opportunity timestamp',
  })
  @IsOptional()
  @IsString()
  startAfter?: string;
}
