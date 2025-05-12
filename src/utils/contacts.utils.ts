import { Contact, Opportunity } from 'types';

export const validateInstallerId = (
  opportunity: Opportunity,
  user: Contact,
): boolean => {
  const opportunityFields = opportunity?.customFields ?? [];
  const userFields = user?.customFields ?? [];

  const installerFieldId = process.env.OPPORTUNITY_INSTALLER_NAME_FIELD_ID;
  const userInstallerFieldId = process.env.CONTACT_INSTALLER_NAME_FIELD_ID;

  if (!installerFieldId || !userInstallerFieldId) return false;

  const installerField = opportunityFields.find(
    (field: Record<string, any>) => field.id === installerFieldId,
  );

  const userInstallerField = userFields.find(
    (field: Record<string, any>) => field.id === userInstallerFieldId,
  );

  return (
    !!installerField &&
    !!userInstallerField &&
    installerField.fieldValueString === userInstallerField.value
  );
};
