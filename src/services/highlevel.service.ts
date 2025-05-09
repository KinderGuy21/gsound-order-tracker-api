import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HighLevelClient } from 'common';

@Injectable()
export class HighLevelService {
  private readonly locationId: string;
  private readonly logger = new Logger(HighLevelService.name);
  private ghlClient: HighLevelClient;

  constructor(private readonly configService: ConfigService) {
    this.locationId = this.configService.get<string>('HIGHLEVEL_LOCATION_ID')!;
    this.ghlClient = new HighLevelClient(configService);
  }

  async searchContacts(email: string, phone: string): Promise<any[]> {
    try {
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
      throw new HttpException(
        'Failed to search contacts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
