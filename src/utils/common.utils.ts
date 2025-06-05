import { OpportunityCustomField } from 'types';

export const getCustomField = (
  fields: OpportunityCustomField[] | undefined,
  id: string,
) => fields?.find((cf) => cf.id === id);

export const getValueFromField = (
  field: OpportunityCustomField | undefined,
) => {
  if (!field) return null;
  return (
    field.value ??
    field.fieldValueString ??
    field.fieldValueNumber ??
    field.fieldValueArray?.[0] ??
    null
  );
};

export const round = (num: number) => Math.round(num * 100) / 100;
