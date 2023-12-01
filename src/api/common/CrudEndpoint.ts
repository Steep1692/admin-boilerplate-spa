import { $http } from './Axios';
import { FetchCount } from './FetchResult';
import { QueryFilters } from '../../models/filters/QueryFilters';

export interface ICrudEndpoint<DTO> {
  fetchItems(queryFilters: QueryFilters): Promise<DTO[]>;
  fetchItem(itemId: number | string): Promise<DTO>;
  deleteItem(itemId: number | string): Promise<number>;
  updateItem(itemId: string | undefined, newItem: DTO): Promise<DTO>;
  addItem(item: DTO): Promise<DTO>;
  uploadThumbnail(itemId: string, file: File): Promise<string>;
  deleteThumbnail(itemId: string): Promise<void>;
  fetchCount(): Promise<FetchCount>;
}

export abstract class CrudEndpoint<DTO> implements ICrudEndpoint<DTO> {
  protected entityEndpoint: string = '';

  protected constructor(entityEndpoint: string) {
    this.entityEndpoint = entityEndpoint;
  }

  public async fetchItems(queryFilters?: QueryFilters): Promise<DTO[]> {
    const params = queryFilters?.mapQueryFilterToRequestParams();

    const response = await $http.get(`/${this.entityEndpoint}`, {
      params,
    });
    return response.data;
  }

  public async fetchItem(itemId: string): Promise<DTO> {
    const response = await $http.get(`/${this.entityEndpoint}/${itemId}`);
    return response.data;
  }

  public async deleteItem(itemId: string): Promise<number> {
    const response = await $http.delete(`/${this.entityEndpoint}/${itemId}`);
    return response.status;
  }

  public async updateItem(itemId: string, newItem: DTO): Promise<DTO> {
    const response = await $http.put(`/${this.entityEndpoint}/${itemId}`, newItem);
    // Fetch updated item in case PUT doesn't return one
    if (response.status >= 200 && response.status < 400 && !response.data)
      return this.fetchItem(itemId);
    return response.data;
  }

  public async uploadThumbnail(itemId: string, file: File): Promise<DTO> {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await $http.post(`/${this.entityEndpoint}/${itemId}/thumbnail`, formData, config);
    return response.data;
  }

  public async deleteThumbnail(itemId: string): Promise<DTO> {
    const response = await $http.delete(`/${this.entityEndpoint}/${itemId}/thumbnail`);
    return response.data;
  }

  public async addItem(item: DTO): Promise<DTO> {
    const response = await $http.post(`/${this.entityEndpoint}`, item);
    return response.data;
  }
  public async fetchCount(): Promise<FetchCount> {
    const response = await $http.get(`/${this.entityEndpoint}/count`);
    return response.data;
  }
}
