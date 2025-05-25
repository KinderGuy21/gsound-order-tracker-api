import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  ContactRoles,
  EmployeeStatus,
  FinishedOpportunityStage,
  InstallerStatus,
  OpportunityCustomFieldsIds,
  OpportunityRolesStages,
  WarehouseStatus,
  wasItPaidOptions,
} from 'consts';
import { ContactTypeEnum } from 'enums';
import { HighLevelService } from 'services';
import {
  Contact,
  UpdateOpportunityFiles,
  Opportunity,
  OpportunityMeta,
  PhotoUpload,
  OpportunityCustomField,
} from 'types';
import {
  prepareInstallerUpdates,
  prepareWarehouseUpdates,
  transformNextPageUrl,
  validateInstallerId,
  validateStatus,
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
      console.log(
        `Received ${opportunities.length} opportunities for stage ID: ${stageId}`,
      );

      const filteredOpportunities: Opportunity[] = opportunities.filter(
        (opportunity) => {
          const userType = user?.type;
          if (userType === ContactTypeEnum.INSTALLER) {
            return validateInstallerId(opportunity, user);
          }
          return true;
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

  private async handleFileUploads(
    files: UpdateOpportunityFiles,
    customFieldsToUpdate: Record<string, any>[],
  ): Promise<void> {
    const fileFieldMap = {
      resultImage: OpportunityCustomFieldsIds.RESULT_IMAGE,
      invoiceImage: OpportunityCustomFieldsIds.INVOICE_IMAGE,
      preInstallImage: OpportunityCustomFieldsIds.PRE_INSTALL_IMAGE,
    } as const;

    for (const [key, fieldId] of Object.entries(fileFieldMap)) {
      const file = files[key] as Express.Multer.File | undefined;
      if (file && !(file instanceof Object)) {
        throw new BadRequestException(`Invalid file format for key: ${key}`);
      }

      if (!file) continue;

      if (!file && key === 'resultImage') {
        throw new BadRequestException(
          'resultImage is required when status is "הותקן"',
        );
      }

      const uploadResult: PhotoUpload | null =
        await this.highLevelService.uploadPhoto({
          file,
          fieldId,
        });

      if (!uploadResult) return;

      if (uploadResult?.meta?.[0]) {
        const { url, mimetype, originalname, size } = uploadResult.meta[0];
        customFieldsToUpdate.push({
          id: fieldId,
          field_value: [
            {
              url,
              meta: {
                mimetype,
                name: originalname,
                size,
              },
              deleted: false,
            },
          ],
        });
      }
    }
  }

  async updateOpportunity(
    user: Contact,
    opportunityId: string,
    body: UpdateOpportunityDto,
    files: UpdateOpportunityFiles,
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

      const opportunity: Opportunity | null =
        await this.receiveOpportunity(opportunityId);

      if (user.type === (ContactRoles.EMPLOYEE as ContactTypeEnum)) {
        validateStatus(status, EmployeeStatus);

        stageId = FinishedOpportunityStage.paid;
      } else if (user.type === (ContactRoles.WAREHOUSE as ContactTypeEnum)) {
        validateStatus(status, WarehouseStatus);
        prepareWarehouseUpdates(body, customFieldsToUpdate);

        if (status === WarehouseStatus.SENT) {
          stageId = installerStages[0];
        }
      } else if (user.type === (ContactRoles.INSTALLER as ContactTypeEnum)) {
        validateStatus(status, InstallerStatus);
        prepareInstallerUpdates(body, customFieldsToUpdate, files);

        if (status === InstallerStatus.SCHEDULED) {
          stageId = installerStages[1];
        } else if (status === InstallerStatus.INSTALLED) {
          await this.handleFileUploads(files, customFieldsToUpdate);
          const paidOption = (
            opportunity?.customFields as OpportunityCustomField[]
          )?.find((cf) => cf.id === OpportunityCustomFieldsIds.WAS_IT_PAID);

          if (
            !paidOption ||
            !paidOption.fieldValueString ||
            ![
              wasItPaidOptions.upfrontCard,
              wasItPaidOptions.upfrontCash,
            ].includes(paidOption.fieldValueString)
          ) {
            stageId = FinishedOpportunityStage.paid;
          } else {
            stageId = FinishedOpportunityStage.unpaid;
          }
        }
      } else if (user.type === (ContactRoles.CUSTOMER as ContactTypeEnum)) {
        await this.handleFileUploads(files, customFieldsToUpdate);
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
