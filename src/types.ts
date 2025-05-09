export type ContactTypes = 'admin' | 'warehouse' | 'installer' | 'customer';

export type Contact = {
  id: string;
  email: string;
  phone: string;
  type: ContactTypes;
  firstNameLowerCase: string;
  lastNameLowerCase: string;
  customFields?: Record<string, any> | [];
};

export type PipelineStages = {
  id: string;
  name: string;
  position: number;
  showInPieChart?: boolean;
  showInFunnel?: boolean;
};

export type Pipeline = {
  id: string;
  name: string;
  showInPieChart?: boolean;
  showInFunnel?: boolean;
  dateAdded: string;
  dateUpdated: string;
  stages: PipelineStages[];
};
