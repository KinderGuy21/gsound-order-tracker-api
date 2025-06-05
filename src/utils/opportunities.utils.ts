import { BadRequestException } from '@nestjs/common';
import {
  InstallerStatus,
  OpportunityCustomFieldsIds,
  OpportunityRolesStatusFields,
  WarehouseStatus,
} from 'consts';
import { UpdateOpportunityDto } from 'orders/dto';
import { UpdateOpportunityFiles } from 'types';

export function validateStatus(status: string, statuses: object): void {
  const validWarehouseStatuses = Object.values(statuses);
  if (!validWarehouseStatuses.includes(status)) {
    throw new BadRequestException(
      `Invalid status. Must be one of: ${validWarehouseStatuses.join(', ')}`,
    );
  }
}

export function prepareWarehouseUpdates(
  body: UpdateOpportunityDto,
  customFieldsToUpdate: Record<string, any>[],
): void {
  customFieldsToUpdate.push({
    id: OpportunityRolesStatusFields.WAREHOUSE,
    value: body.status,
  });

  if (body.status === WarehouseStatus.STUCK) {
    if (!body.stuckReason) {
      throw new BadRequestException(
        'stuckReason is required when status is "תקוע"',
      );
    }

    customFieldsToUpdate.push({
      id: OpportunityCustomFieldsIds.STUCK_REASON,
      value: body.stuckReason,
    });
  }
}

export function prepareInstallerUpdates(
  body: UpdateOpportunityDto,
  customFieldsToUpdate: Record<string, any>[],
  files: UpdateOpportunityFiles,
): void {
  customFieldsToUpdate.push({
    id: OpportunityRolesStatusFields.INSTALLER,
    value: body.status,
  });

  if (body.status === InstallerStatus.SCHEDULED) {
    if (!body.installDate) {
      throw new BadRequestException(
        'installDate is required when status is "תואם"',
      );
    }

    customFieldsToUpdate.push({
      id: OpportunityCustomFieldsIds.INSTALL_DATE,
      value: body.installDate,
    });
  } else if (body.status === InstallerStatus.INSTALLED) {
    if (body?.invoiceNumber) {
      customFieldsToUpdate.push({
        id: OpportunityCustomFieldsIds.INVOICE_NUMBER,
        value: body.invoiceNumber,
      });
    }
    if (!files?.resultImage) {
      throw new BadRequestException(
        'resultImage is required when status is "הותקן"',
      );
    }
  }
}
