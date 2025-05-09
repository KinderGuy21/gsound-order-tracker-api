import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, Method } from 'axios';

export class HighLevelClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly version: string;

  private readonly logger = new Logger(HighLevelClient.name);

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('HIGHLEVEL_API_URL')!;
    this.apiToken = this.configService.get<string>('HIGHLEVEL_TOKEN_API')!;
    this.version = this.configService.get<string>('HIGHLEVEL_VERSION')!;
  }

  async request<T>(
    endpoint: string,
    method: Method = 'GET',
    data?: any,
    params?: Record<string, any>,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        Version: this.version,
      },
      params,
      data,
    };

    const response = await axios(config);
    return response.data;
  }
}
