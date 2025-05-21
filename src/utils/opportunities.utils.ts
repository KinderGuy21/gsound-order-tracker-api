import { BadRequestException } from '@nestjs/common';
import {
  InstallerStatus,
  OpportunityCustomFieldsIds,
  OpportunityRolesStatusFields,
  WarehouseStatus,
} from 'consts';
import { UpdateOpportunityDto } from 'orders/dto';
import { InstallerFiles } from 'types';

export function transformNextPageUrl(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    const params = url.searchParams;

    const limit = params.get('limit');
    const stageId = params.get('pipeline_stage_id');
    const startAfter = params.get('startAfter');
    const startAfterId = params.get('startAfterId');

    const newParams = new URLSearchParams();
    if (limit) newParams.set('limit', limit);
    if (stageId) newParams.set('stageIds', stageId);
    if (startAfter) newParams.set('startAfter', startAfter);
    if (startAfterId) newParams.set('startAfterId', startAfterId);

    return `${process.env.API_URL}/orders/opportunities?${newParams.toString()}`;
  } catch (error) {
    console.warn('Failed to transform nextPageUrl:', error);
    return '';
  }
}

export function validateWarehouseStatus(status: string): void {
  const validWarehouseStatuses = Object.values(WarehouseStatus);
  if (!validWarehouseStatuses.includes(status)) {
    throw new BadRequestException(
      `Invalid warehouse status. Must be one of: ${validWarehouseStatuses.join(', ')}`,
    );
  }
}

export function validateInstallerStatus(status: string): void {
  const validInstallerStatuses = Object.values(InstallerStatus);
  if (!validInstallerStatuses.includes(status)) {
    throw new BadRequestException(
      `Invalid installer status. Must be one of: ${validInstallerStatuses.join(', ')}`,
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
  files: InstallerFiles,
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
    if (!files?.resultImage) {
      throw new BadRequestException(
        'resultImage is required when status is "הותקן"',
      );
    }
  }
}
