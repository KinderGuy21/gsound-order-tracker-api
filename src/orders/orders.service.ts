import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ContactTypeEnum, OpportunityRolesStages } from 'enums';
import { HighLevelService } from 'services';
import { Contact, Opportunity, OpportunityMeta } from 'types';
import { transformNextPageUrl, validateInstallerId } from 'utils';

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
      const stages = OpportunityRolesStages[user.type.toUpperCase()];
      if (!stages) {
        throw new HttpException(
          'Failed to fetch pipeline stages',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      stageIds = stages.split(',');
    }
    let returnPayload: {
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
    opportunityId: string,
    body: Partial<Opportunity>,
  ): Promise<Opportunity | null> {
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
}
