import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ContactRoles,
  FinishedOpportunityStage,
  InstallerStatus,
  OpportunityRolesStages,
  WarehouseStatus,
} from 'consts';
import { ContactTypeEnum } from 'enums';
import { HighLevelService } from 'services';
import { Contact, Opportunity, OpportunityMeta } from 'types';
import {
  prepareInstallerUpdates,
  prepareWarehouseUpdates,
  transformNextPageUrl,
  validateInstallerId,
  validateInstallerStatus,
  validateWarehouseStatus,
} from 'utils';
import { UpdateOpportunityDto } from './dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly highLevelService: HighLevelService) {}

  async receiveUserOpportunities({
    stageIds,
    user,
    limit = 50,
    startAfter = null,
    startAfterId = null,
  }: {
    stageIds: string[];
    user: Contact;
    limit?: number;
    startAfter?: string | null;
    startAfterId?: string | null;
  }) {
    if (!stageIds || stageIds.length === 0) {
      const userTypeKey =
        user.type.toUpperCase() as keyof typeof OpportunityRolesStages;
      const stages = OpportunityRolesStages[userTypeKey];
      if (!stages) {
        throw new HttpException(
          'Failed to fetch pipeline stages',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      stageIds = stages.split(',');
    }
    const returnPayload: {
      opportunities: Opportunity[];
      stages: Record<string, OpportunityMeta>;
    } = { opportunities: [], stages: {} };
    for (const stageId of stageIds) {
      const stageInfo = await this.highLevelService.fetchOpportunities({
        stageId: stageId,
        limit,
        startAfter,
        startAfterId,
      });

      if (!stageInfo || !stageInfo?.opportunities || !stageInfo?.meta) {
        throw new HttpException(
          `Failed to receive opportunities for stage ID: ${stageId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { opportunities, meta } = stageInfo;

      const filteredOpportunities: Opportunity[] = opportunities.filter(
        (opportunity) => {
          const userType = user?.type;

          if (
            userType === ContactTypeEnum.ADMIN ||
            userType === ContactTypeEnum.WAREHOUSE
          )
            return true;

          if (userType === ContactTypeEnum.INSTALLER) {
            return validateInstallerId(opportunity, user);
          }

          return false;
        },
      );

      const updatedMeta = {
        total: filteredOpportunities.length,
        ...(meta?.nextPageUrl && {
          nextPageUrl: transformNextPageUrl(meta.nextPageUrl),
        }),
      };
      if (filteredOpportunities.length !== 0) {
        returnPayload.opportunities.push(...filteredOpportunities);
        returnPayload.stages[stageId] = updatedMeta;
      }
    }
    return returnPayload;
  }

  async receiveOpportunity(opportunityId: string): Promise<Opportunity | null> {
    const opportunity =
      await this.highLevelService.fetchOpportunity(opportunityId);
    if (!opportunity) {
      throw new HttpException(
        'Failed to fetch opportunity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return opportunity;
  }

  async updateOpportunity(
    user: Contact,
    opportunityId: string,
    body: UpdateOpportunityDto,
  ): Promise<Opportunity | null> {
    try {
      if (!user) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }
      const { status } = body;

      if (!status) {
        throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
      }

      let stageId: string | null = null;
      const customFieldsToUpdate: Record<string, any>[] = [];
      const installerStages = OpportunityRolesStages.INSTALLER.split(',');

      if (user.type === (ContactRoles.WAREHOUSE as ContactTypeEnum)) {
        validateWarehouseStatus(status);
        prepareWarehouseUpdates(body, customFieldsToUpdate);

        if (status === WarehouseStatus.SENT) {
          stageId = installerStages[0];
        }
      } else if (user.type === (ContactRoles.INSTALLER as ContactTypeEnum)) {
        validateInstallerStatus(status);
        prepareInstallerUpdates(body, customFieldsToUpdate);

        if (status === InstallerStatus.SCHEDULED) {
          stageId = installerStages[1];
        } else if (status === InstallerStatus.INSTALLED) {
          stageId = FinishedOpportunityStage;
        }
      } else {
        throw new BadRequestException(
          'Invalid user type. Must be "warehouse" or "installer"',
        );
      }

      return this.highLevelService.editOpportunity({
        id: opportunityId,
        stageId,
        customFields: customFieldsToUpdate,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update opportunity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
