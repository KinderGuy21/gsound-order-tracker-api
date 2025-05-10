import { Contact, Opportunity } from 'types';

export const validateInstallerId = (
  opportunity: Opportunity,
  user: Contact,
) => {
  const opportunityCustomFields = opportunity?.customFields;
  const userCustomFields = user?.customFields;

  if (!opportunityCustomFields || !userCustomFields) return false;
  const installerIdField = opportunityCustomFields.find(
    (field: Record<string, any>) =>
      field.id === process.env.OPPORTUNITY_INSTALLER_NAME_FIELD_ID,
  );
  const userInstallerIdField = userCustomFields.find(
    (field: Record<string, any>) =>
      field.id === process.env.CONTACT_INSTALLER_NAME_FIELD_ID,
  );

  if (!installerIdField || !userInstallerIdField) return false;
  return installerIdField.fieldValueString === userInstallerIdField.value;
};
