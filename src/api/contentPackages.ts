import client, { normalizePage, unwrapResponse } from './client';

export type ContentPackageTab = 'mine' | 'draft' | 'record' | 'recycle';
export interface ContentPackageQuery { pageNum?: number; pageSize?: number; keyword?: string; operatorId?: string; status?: string; tab?: ContentPackageTab; }
export interface ContentPackagePayload { topicName: string; operatorId: string; [key: string]: unknown; }

export const contentPackagesApi = {
  async list(params: ContentPackageQuery) {
    const res = await client.get('/media/content/packages', { params });
    return normalizePage<any>(res.data);
  },
  async create(payload: ContentPackagePayload) {
    const res = await client.post('/media/content/packages', payload);
    return unwrapResponse<any>(res.data);
  },
  async detail(id: string) {
    const res = await client.get(`/media/content/packages/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async update(id: string, payload: ContentPackagePayload) {
    const res = await client.put(`/media/content/packages/${id}`, payload);
    return unwrapResponse<any>(res.data);
  },
  async remove(id: string) {
    const res = await client.delete(`/media/content/packages/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async uploadFiles(id: string, formData: FormData) {
    const res = await client.post(`/media/content/packages/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return unwrapResponse<any>(res.data);
  }
};
