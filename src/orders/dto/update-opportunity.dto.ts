import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { ContactTypeEnum } from 'enums';
import { InstallerStatus, WarehouseStatus } from 'consts';
export class UpdateOpportunityDto {
  @ApiProperty({
    description: 'Status of the opportunity (depends on user type)',
    required: true,
    examples: {
      warehouse: {
        value: WarehouseStatus.READY,
        description: 'For warehouse users',
      },
      installer: {
        value: InstallerStatus.SCHEDULED,
        description: 'For installer users',
      },
    },
  })
  @IsString({ message: 'Status must be a string' })
  status: string;

  @ApiProperty({
    description: 'Installation date (required when installer status is "תואם")',
    required: false,
    example: '2025-06-15T10:00:00.000Z',
  })
  @ValidateIf(
    (o: UpdateOpportunityDto) =>
      o.userType === ContactTypeEnum.WAREHOUSE &&
      o.status === WarehouseStatus.STUCK,
  )
  @IsString({
    message: 'Stuck Reason is required when status is "תקוע".',
  })
  stuckReason?: string;

  @ApiProperty({
    description: 'Installation date (required when installer status is "תואם")',
    required: false,
    example: '2025-06-15T10:00:00.000Z',
  })
  @ValidateIf(
    (o: UpdateOpportunityDto) =>
      o.userType === ContactTypeEnum.INSTALLER &&
      o.status === InstallerStatus.SCHEDULED,
  )
  @IsString({
    message:
      'Installation date is required when status is "תואם". Format is: MM/DD/YYYY',
  })
  installDate?: string;

  @ApiProperty({
    description:
      'URL to the result image (required when installer status is "הותקן")',
    required: false,
    example: 'https://example.com/images/result-123.jpg',
  })
  @ValidateIf(
    (o: UpdateOpportunityDto) =>
      o.userType === ContactTypeEnum.INSTALLER &&
      o.status === InstallerStatus.INSTALLED,
  )
  @IsUrl(
    {},
    {
      message:
        'A valid URL for the result image is required when status is "הותקן"',
    },
  )
  resultImage?: string;

  @ApiProperty({
    description:
      'URL to the invoice image (optional when installer status is "הותקן")',
    required: false,
    example: 'https://example.com/images/invoice-123.jpg',
  })
  @ValidateIf(
    (o: UpdateOpportunityDto) =>
      o.userType === ContactTypeEnum.INSTALLER &&
      o.status === InstallerStatus.INSTALLED,
  )
  @IsOptional()
  @IsUrl({}, { message: 'Invoice image must be a valid URL' })
  invoiceImage?: string;

  userType: ContactTypeEnum;
}
