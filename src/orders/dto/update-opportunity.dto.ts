import { PartialType } from '@nestjs/swagger';
import { Contact } from 'types';

export class OpportunityDto {
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
}

export class UpdateOpportunityDto extends PartialType(OpportunityDto) {}
