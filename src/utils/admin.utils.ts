import {
  OpportunitiesResponse,
  Opportunity,
  OpportunityCustomField,
} from 'types';

export const splitOpportunitiesPerInstaller = (
  OpportunitiesList: OpportunitiesResponse,
) => {
  const result: Record<string, Opportunity[]> = {};
  const opportunities = OpportunitiesList?.opportunities ?? [];

  for (const opportunity of opportunities) {
    const customFields = opportunity?.customFields as
      | OpportunityCustomField[]
      | undefined;
    if (!customFields) continue;

    const installerId = customFields.find(
      (cf) => cf.id === process.env.OPPORTUNITY_INSTALLER_NAME_FIELD_ID,
    )?.fieldValueString;

    if (!installerId || installerId === 'ללא התקנה') continue;

    if (!result[installerId]) {
      result[installerId] = [];
    }

    result[installerId].push(opportunity);
  }

  return result;
};
