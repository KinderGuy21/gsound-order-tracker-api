import { ContactInstallerFieldId } from 'consts';
import {
  Contact,
  InstallerOpportunities,
  OpportunitiesResponse,
  Opportunity,
  OpportunityCustomField,
} from 'types';

export const splitOpportunitiesPerInstaller = (
  OpportunitiesList: OpportunitiesResponse,
  installerList: Contact[] | null,
): InstallerOpportunities[] => {
  const resultMap: Record<string, Opportunity[]> = {};
  const opportunities = OpportunitiesList?.opportunities ?? [];

  const installersByName = new Map<string, Contact>();
  installerList?.forEach((i) => {
    const cfs = i?.customFields as OpportunityCustomField[];
    const name = cfs?.find((cf) => cf.id === ContactInstallerFieldId)?.value;
    if (name && typeof name === 'string') {
      installersByName.set(name, i);
    }
  });

  if (installersByName.size === 0) {
    throw new Error('No installers found');
  }

  for (const opportunity of opportunities) {
    const customFields = opportunity?.customFields as
      | OpportunityCustomField[]
      | undefined;
    if (!customFields) continue;

    const installerName = customFields.find(
      (cf) => cf.id === process.env.OPPORTUNITY_INSTALLER_NAME_FIELD_ID,
    )?.fieldValueString;

    if (
      !installerName ||
      installerName === 'ללא התקנה' ||
      !installersByName.has(installerName)
    )
      continue;

    if (!resultMap[installerName]) {
      resultMap[installerName] = [];
    }

    resultMap[installerName].push(opportunity);
  }

  const result: InstallerOpportunities[] = [];

  for (const [name, installer] of installersByName.entries()) {
    result.push({
      name,
      id: installer.id,
      phone: installer.phone,
      email: installer.email,
      opportunities: resultMap[name] ?? [],
    });
  }

  return result;
};
