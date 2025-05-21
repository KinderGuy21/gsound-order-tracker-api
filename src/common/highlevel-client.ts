import { Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, Method } from 'axios';

export class HighLevelClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly version: string;

  private readonly logger = new Logger(HighLevelClient.name);

  constructor() {
    this.baseUrl = process.env.HIGHLEVEL_API_URL!;
    this.apiToken = process.env.HIGHLEVEL_TOKEN_API!;
    this.version = process.env.HIGHLEVEL_VERSION!;
  }

  async request<T>(
    endpoint: string,
    method: Method = 'GET',
    data?: Record<string, any> | FormData | null,
    params?: Record<string, any> | null,
    headers?: Record<string, string>,
  ): Promise<T> {
    const isFormData = data instanceof FormData;

    const config: AxiosRequestConfig = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
        ...(this.version ? { Version: this.version } : {}),
        ...headers,
      },
      params,
      data,
    };

    const response = await axios(config);
    return response.data as T;
  }
}
