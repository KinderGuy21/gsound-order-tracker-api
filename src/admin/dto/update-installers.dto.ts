import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class UpdateInstallerDto {
  @ApiProperty({
    description: 'Array of opportunity IDs to update',
    example: ['MWxjenVMuTplzEsAolZg', 'GHghgjGJdxcasRGHDS'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  opportunityIds: string[];

  @ApiProperty({
    description: 'The invoice number for the installer',
    example: '2222',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
