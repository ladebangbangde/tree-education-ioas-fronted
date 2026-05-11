import client, { normalizePage, unwrapResponse } from './client';

export const resourcesApi = {
  async tree() {
    const res = await client.get('/media/resources/tree');
    return unwrapResponse<any[]>(res.data);
  },
  async packages(params?: { keyword?: string; operatorId?: string; pageNum?: number; pageSize?: number }) {
    const res = await client.get('/media/resources/packages', { params });
    return normalizePage<any>(res.data);
  }
};
