import { ContactTypeEnum } from './enums';
export interface RequestWithUser extends Request {
  user: Contact;
}

export type ContactTypes =
  | ContactTypeEnum.ADMIN
  | ContactTypeEnum.WAREHOUSE
  | ContactTypeEnum.INSTALLER
  | ContactTypeEnum.CUSTOMER;

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
};

export type Pipeline = {
  id: string;
  name: string;
  dateAdded: string;
  dateUpdated: string;
  stages: PipelineStages[];
};

export type Opportunity = {
  id: string;
  name: string;
  locationId: string;
  pipelineId: string;
  stageId: string;
  dateAdded: string;
  dateUpdated: string;
  contactId: string;
  customFields?: Record<string, any> | [];
  contact: Contact;
};

export type OpportunityMeta = {
  total: number;
  nextPageUrl?: string;
};
