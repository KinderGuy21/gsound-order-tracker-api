import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HighLevelClient } from 'common';
import * as FormData from 'form-data';
import {
  Contact,
  CustomFieldKeys,
  OpportunitiesResponse,
  Opportunity,
  OpportunityMeta,
  PhotoUpload,
} from 'types';

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

  async fetchInstallersContacts(): Promise<Contact[] | null> {
    try {
      const filters = [
        {
          group: 'AND',
          filters: [
            {
              field: 'type',
              operator: 'eq',
              value: 'installer',
            },
          ],
        },
      ];

      const result: { contacts?: Contact[] } = await this.ghlClient.request(
        '/contacts/search',
        'POST',
        {
          locationId: this.locationId,
          pageLimit: 1,
          filters,
        },
      );

      if (result) {
        return result.contacts || null;
      }
      return null;
    } catch (error) {
      this.logger.error('Error searching contacts:', error);
      throw new HttpException(
        'Failed to search contacts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchOpportunityCustomField(
    id: string,
  ): Promise<CustomFieldKeys | null> {
    try {
      const result: { customField?: CustomFieldKeys } =
        await this.ghlClient.request(
          `/locations/${this.locationId}/customFields/${id}`,
          'GET',
        );

      if (result) {
        return result.customField || null;
      }
      return null;
    } catch (error) {
      this.logger.error('Error fetching custom Fields:', error);
      throw new HttpException(
        'Failed to fetch custom fields',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchOpportunities({
    limit = 100,
    stageId,
    page = null,
    date = null,
    endDate = null,
  }: {
    limit: number;
    stageId?: string | null;
    page?: number | null;
    date?: string | null;
    endDate?: string | null;
  }): Promise<OpportunitiesResponse | null> {
    try {
      const result: OpportunitiesResponse = await this.ghlClient.request(
        `/opportunities/search`,
        'GET',
        {},
        {
          location_id: this.locationId,
          pipeline_id: this.pipelineId,
          limit,
          stageId: stageId || null,
          date: date || null,
          endDate: endDate || null,
          page: page || null,
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

  async fetchAllOpportunities({
    limit = 100,
    stageId,
    date,
    endDate,
  }: {
    limit?: number;
    stageId?: string | null;
    date?: string | null;
    endDate?: string | null;
  }): Promise<OpportunitiesResponse> {
    const allOpportunities: Opportunity[] = [];
    const allMeta: OpportunityMeta = { total: 0 };

    const fetchRecursive = async (page: number | null = null) => {
      const response = await this.fetchOpportunities({
        limit,
        stageId,
        page,
        date,
        endDate,
      });
      if (response?.opportunities && response?.meta) {
        allOpportunities.push(...response.opportunities);
        allMeta.total = allMeta.total + (response.meta?.total || 0);
        const nextPage = response.meta?.nextPage;
        if (nextPage && typeof nextPage === 'number') {
          await fetchRecursive(nextPage);
        }
      }
    };

    await fetchRecursive();
    return { opportunities: allOpportunities, meta: allMeta };
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
      const formData = new FormData();

      formData.append(fieldId, file.buffer, {
        filename: file.originalname || 'upload.png',
        contentType: file.mimetype || 'application/octet-stream',
        knownLength: file.size,
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
