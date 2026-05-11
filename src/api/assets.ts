import client, { normalizePage, unwrapResponse } from './client';

export interface AssetQuery { packageId?: string; fileType?: 'all' | 'script' | 'video' | 'image' | string; pageNum?: number; pageSize?: number; }
export interface RecycleQuery { keyword?: string; fileType?: string; deletedBy?: string; packageId?: string; operatorId?: string; pageNum?: number; pageSize?: number; }

export const assetsApi = {
  async list(params?: AssetQuery) {
    const res = await client.get('/media/assets', { params });
    return normalizePage<any>(res.data);
  },
  async detail(id: string) {
    const res = await client.get(`/media/assets/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async remove(id: string) {
    const res = await client.delete(`/media/assets/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async download(id: string) {
    return client.get(`/media/assets/${id}/download`, { responseType: 'blob' });
  },
  async preview(id: string) {
    const res = await client.get(`/media/assets/${id}/preview`);
    return unwrapResponse<any>(res.data);
  },
  async recycleBin(params?: RecycleQuery) {
    const res = await client.get('/media/assets/recycle-bin', { params });
    return normalizePage<any>(res.data);
  },
  async restore(id: string) {
    const res = await client.post(`/media/assets/recycle-bin/${id}/restore`);
    return unwrapResponse<any>(res.data);
  },
  async purge(id: string) {
    const res = await client.delete(`/media/assets/recycle-bin/${id}/purge`);
    return unwrapResponse<any>(res.data);
  }
};
