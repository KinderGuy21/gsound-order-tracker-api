import { ContactTypeEnum } from 'enums';
export interface RequestWithUser extends Request {
  user: Contact;
}

export type ContactTypes =
  | ContactTypeEnum.ADMIN
  | ContactTypeEnum.EMPLOYEE
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
  monetaryValue?: number;
  customFields?: Record<string, any> | [];
  contact: Contact;
};

export type OpportunityMeta = {
  total: number;
  currentPage?: number | string | null;
  nextPage?: number | string | null;
  prevPage?: number | string | null;
};

export type OpportunitiesResponse = {
  opportunities?: Opportunity[];
  meta?: OpportunityMeta;
};

export type OpportunityCustomField = {
  id: string;
  fieldValueString?: string;
  fieldValueArray?: string[];
  fieldValueNumber?: number;
  value?: string | number | boolean | null;
};

export type PhotoUpload = {
  uploadedFiles: Record<string, any>;
  meta: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    url: string;
  }[];
};

export type UpdateOpportunityFiles = {
  resultImage?: Express.Multer.File;
  preInstallImage?: Express.Multer.File;
};
