import { Contact, Opportunity, OpportunityCustomField } from 'types';

export const validateInstallerId = (
  opportunity: Opportunity,
  user: Contact,
): boolean => {
  const opportunityFields: OpportunityCustomField[] =
    (opportunity?.customFields ?? []) as OpportunityCustomField[];
  const userFields: OpportunityCustomField[] = (user?.customFields ??
    []) as OpportunityCustomField[];

  const installerFieldId = process.env.OPPORTUNITY_INSTALLER_NAME_FIELD_ID;
  const userInstallerFieldId = process.env.CONTACT_INSTALLER_NAME_FIELD_ID;

  if (!installerFieldId || !userInstallerFieldId) return false;

  const installerField = opportunityFields.find(
    (field: OpportunityCustomField) => field.id === installerFieldId,
  );

  const userInstallerField = userFields.find(
    (field: OpportunityCustomField) => field.id === userInstallerFieldId,
  );

  return (
    !!installerField &&
    !!userInstallerField &&
    installerField.fieldValueString === userInstallerField.value
  );
};
