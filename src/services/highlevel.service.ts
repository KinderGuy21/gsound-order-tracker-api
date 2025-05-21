import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HighLevelClient } from 'common';
import * as FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { Opportunity, OpportunityMeta, PhotoUpload, Pipeline } from 'types';

@Injectable()
export class HighLevelService {
  private readonly locationId: string;
  private readonly pipelineId: string;
  private readonly logger = new Logger(HighLevelService.name);
  private ghlClient: HighLevelClient;

  constructor() {
    this.locationId = process.env.HIGHLEVEL_LOCATION_ID!;
    this.pipelineId = process.env.HIGHLEVEL_PIPELINE_ID!;
    this.ghlClient = new HighLevelClient();
  }

  async searchContacts(email: string, phone: string): Promise<any[]> {
    try {
      if (!email || !phone) {
        throw new HttpException(
          'Email and phone are required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const parsePhone = phone.startsWith('0')
        ? `+972${phone.substring(1)}`
        : phone;

      const filters = [
        {
          group: 'AND',
          filters: [
            {
              filterName: 'Email',
              selectedOption: {
                filterName: 'Email',
                condition: 'is',
                firstValue: email,
              },
            },
            {
              filterName: 'Phone',
              selectedOption: {
                filterName: 'Phone',
                condition: 'is',
                firstValue: parsePhone,
              },
            },
          ],
        },
      ];

      const result: { contacts?: any[] } = await this.ghlClient.request(
        '/contacts/search',
        'POST',
        {
          locationId: this.locationId,
          pageLimit: 1,
          filters,
        },
      );

      if (result) {
        return result.contacts || [];
      }
      return [];
    } catch (error) {
      this.logger.error('Error searching contacts:', error);
      throw new HttpException(
        'Failed to search contacts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchPipelines(): Promise<Pipeline[] | null> {
    try {
      const result: { pipelines?: Pipeline[] } = await this.ghlClient.request(
        `/opportunities/pipelines?locationId=${this.locationId}`,
        'GET',
      );

      if (result) {
        return result.pipelines || null;
      }
      return null;
    } catch (error) {
      this.logger.error('Error fetching pipelines:', error);
      throw new HttpException(
        'Failed to fetch pipelines',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchOpportunities({
    stageId,
    limit = 50,
    startAfter = null,
    startAfterId = null,
  }: {
    stageId: string;
    limit: number;
    startAfter?: string | null;
    startAfterId?: string | null;
  }): Promise<{
    opportunities?: Opportunity[];
    meta?: OpportunityMeta;
  } | null> {
    try {
      if (!stageId) {
        throw new HttpException('Stage ID is required', HttpStatus.BAD_REQUEST);
      }
      const result: { opportunities?: Opportunity[]; meta?: OpportunityMeta } =
        await this.ghlClient.request(
          `/opportunities/search`,
          'GET',
          {},
          {
            location_id: this.locationId,
            pipeline_id: this.pipelineId,
            pipeline_stage_id: stageId,
            limit,
            startAfter: startAfter || null,
            startAfterId: startAfterId || null,
          },
        );

      if (result) {
        return { opportunities: result?.opportunities, meta: result?.meta };
      }
      return null;
    } catch (error) {
      this.logger.error('Error fetching opportunities:', error);
      throw new HttpException(
        'Failed to fetch opportunity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchOpportunity(id: string): Promise<Opportunity | null> {
    try {
      if (!id) {
        throw new HttpException(
          'Opportunity ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const result: { opportunity?: Opportunity } =
        await this.ghlClient.request(`/opportunities/${id}`, 'GET');

      if (result) {
        return result.opportunity || null;
      }
      return null;
    } catch (error) {
      this.logger.error('Error fetching opportunity:', error);
      throw new HttpException(
        'Failed to fetch opportunity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async editOpportunity({
    id,
    customFields,
    stageId = null,
  }: {
    id: string;
    stageId?: string | null;
    customFields: Record<string, any>[];
  }): Promise<Opportunity | null> {
    try {
      if (!id) {
        throw new HttpException(
          'Opportunity ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const result: { opportunity?: Opportunity } =
        await this.ghlClient.request(`/opportunities/${id}`, 'PUT', {
          ...(stageId && { pipelineStageId: stageId }),
          customFields,
        });

      if (result) {
        return result.opportunity || null;
      }
      return null;
    } catch (error) {
      this.logger.error('Error editing opportunity:', error);
      throw new HttpException(
        'Failed to fetch opportunity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadPhoto({
    file,
    fieldId,
  }: {
    file: Express.Multer.File;
    fieldId: string;
  }): Promise<PhotoUpload | null> {
    try {
      if (!file || !fieldId) {
        throw new HttpException(
          'Missing fields or file buffer',
          HttpStatus.BAD_REQUEST,
        );
      }
      const fileInfo = file[0];

      const formData = new FormData();

      formData.append(fieldId, fileInfo.buffer, {
        filename: fileInfo.originalname || 'upload.png',
        contentType: fileInfo.mimetype || 'application/octet-stream',
        knownLength: fileInfo.size,
      });

      formData.append('id', fieldId);
      formData.append('maxFiles', '1');

      const headers = formData.getHeaders();

      const result: PhotoUpload = await this.ghlClient.request(
        `/locations/${this.locationId}/customFields/upload`,
        'POST',
        formData,
        null,
        headers,
      );

      return result || null;
    } catch (error) {
      this.logger.error('Error uploading photo:', error);
      throw new HttpException(
        'Failed to upload photo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
