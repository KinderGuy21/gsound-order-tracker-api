import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ContactTypeEnum } from 'enums';
import { HighLevelService } from 'services';
import { Contact, Opportunity, Pipeline, PipelineStages } from 'types';
import { transformNextPageUrl, validateInstallerId } from 'utils';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(private readonly highLevelService: HighLevelService) {}

  async receivePipelineStages(): Promise<PipelineStages[]> {
    const pipelines = await this.highLevelService.fetchPipelines();
    if (!pipelines) {
      throw new HttpException(
        'Failed to search contacts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const pipeline: Pipeline | undefined = pipelines.find(
      (p) => p.id === process.env.HIGHLEVEL_PIPELINE_ID,
    );
    if (!pipeline) {
      throw new HttpException(
        'Pipeline not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return pipeline.stages;
  }

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
    let returnPayload = {};
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

      const filteredOpportunities = opportunities.filter((opportunity) => {
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
      });

      const updatedMeta = {
        ...meta,
        total: filteredOpportunities.length,
        ...(meta?.nextPageUrl && {
          nextPageUrl: transformNextPageUrl(meta.nextPageUrl),
        }),
      };

      returnPayload[stageId] = {
        opportunities: filteredOpportunities,
        meta: updatedMeta,
      };
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
