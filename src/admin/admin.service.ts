import { Injectable } from '@nestjs/common';
import {
  FinishedOpportunityStage,
  OpportunityCustomFieldsIds,
  wasItPaidOptions,
} from 'consts';
import { HighLevelService } from 'services/highlevel.service';
import { Opportunity, OpportunityCustomField } from 'types';
import {
  getCustomField,
  getValueFromField,
  round,
  splitOpportunitiesPerInstaller,
} from 'utils';
import { UpdateInstallerDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private readonly highLevelService: HighLevelService) {}

  async receiveInstallers(date: string, endDate: string) {
    const allOpportunities = await this.highLevelService.fetchAllOpportunities({
      limit: 100,
      date,
      endDate,
    });

    const allowedFieldIds = new Set(Object.values(OpportunityCustomFieldsIds));
    const splittedOpportunities: Record<string, Opportunity[]> =
      splitOpportunitiesPerInstaller(allOpportunities);

    const parsed = Object.fromEntries(
      Object.entries(splittedOpportunities).map(
        ([installer, opportunities]) => {
          const filtered = opportunities.map((opp) => {
            const customFields = Array.isArray(opp.customFields)
              ? opp.customFields.filter((cf: OpportunityCustomField) =>
                  allowedFieldIds.has(cf.id),
                )
              : [];

            const payingOption = getValueFromField(
              getCustomField(
                customFields,
                OpportunityCustomFieldsIds.PAYING_OPTION,
              ),
            );

            const invoiceNumber = getValueFromField(
              getCustomField(
                customFields,
                OpportunityCustomFieldsIds.INVOICE_NUMBER,
              ),
            );

            const installCost =
              getValueFromField(
                getCustomField(
                  customFields,
                  OpportunityCustomFieldsIds.INSTALLATION_COST,
                ),
              ) ?? 0;

            const totalPrice =
              getValueFromField(
                getCustomField(
                  customFields,
                  OpportunityCustomFieldsIds.TOTAL_PRICE,
                ),
              ) ?? 0;

            const isUnpaidStage =
              opp.stageId === FinishedOpportunityStage.unpaid;

            const companyOwesInstaller =
              payingOption === wasItPaidOptions.complete && !invoiceNumber;

            const companyOwesInstallerAmount =
              companyOwesInstaller && installCost
                ? round(parseInt(String(installCost)) * 1.18)
                : null;

            const installerOwesCompany =
              (payingOption === wasItPaidOptions.upfrontCard ||
                payingOption === wasItPaidOptions.upfrontCash) &&
              isUnpaidStage;

            const installerOwesCompanyAmount =
              installerOwesCompany && totalPrice && installCost
                ? round(
                    parseInt(String(totalPrice)) -
                      parseInt(String(installCost)) * 1.18,
                  )
                : null;

            const direction = companyOwesInstaller
              ? 'Company → Installer'
              : installerOwesCompany
                ? 'Installer → Company'
                : 'None';

            const method =
              installerOwesCompany &&
              payingOption === wasItPaidOptions.upfrontCash
                ? 'cash'
                : installerOwesCompany &&
                    payingOption === wasItPaidOptions.upfrontCard
                  ? 'card'
                  : null;

            return {
              id: opp.id,
              name: opp.name,
              monetaryValue: opp.monetaryValue,
              customFields,
              paymentStatus: {
                invoiceNumber: invoiceNumber ?? null,
                companyOwesInstaller,
                companyOwesInstallerAmount,
                installerOwesCompany,
                installerOwesCompanyAmount,
                direction,
                method,
              },
            };
          });

          return [installer, filtered];
        },
      ),
    );

    return parsed;
  }

  async updateInstallers(body: UpdateInstallerDto) {
    const { opportunityIds, invoiceNumber } = body;
    console.log(body);
    if (!opportunityIds || !opportunityIds.length) {
      throw new Error('No opportunities provided for update');
    }

    const updatedFields = [
      ...(invoiceNumber
        ? [
            {
              id: OpportunityCustomFieldsIds.INVOICE_NUMBER,
              value: invoiceNumber,
            },
          ]
        : []),
    ];

    if (
      !Object.keys(updatedFields).length ||
      Object.keys(updatedFields).length === 0
    )
      return;

    for (const opportunityId of opportunityIds) {
      try {
        const up = await this.highLevelService.editOpportunity({
          id: opportunityId,
          customFields: updatedFields,
        });
        console.log(up);
      } catch (error) {
        console.error(`Failed to update opportunity ${opportunityId}:`, error);
        throw new Error(`Failed to update opportunity ${opportunityId}`);
      }
    }

    return body;
  }
}
