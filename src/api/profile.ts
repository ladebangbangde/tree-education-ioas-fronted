import client, { unwrapResponse } from './client';

export interface RegionChangePayload {
  requestedRegionCodes: string;
  requestedRegionNames: string;
  reason?: string;
}

export const profileApi = {
  async me() {
    const res = await client.get('/profile/me');
    return unwrapResponse<any>(res.data);
  },
  async uploadQr(file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post('/profile/consultant/qr', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return unwrapResponse<any>(res.data);
  },
  async requestRegionChange(payload: RegionChangePayload) {
    const res = await client.post('/profile/consultant/region-change-requests', payload);
    return unwrapResponse<any>(res.data);
  },
  async myRegionChangeRequests() {
    const res = await client.get('/profile/consultant/region-change-requests/mine');
    return unwrapResponse<any[]>(res.data);
  },
  async pendingRegionChangeRequests() {
    const res = await client.get('/profile/admin/region-change-requests');
    return unwrapResponse<any[]>(res.data);
  },
  async approveRegionChange(id: string, remark?: string) {
    const res = await client.post(`/profile/admin/region-change-requests/${id}/approve`, { remark });
    return unwrapResponse<any>(res.data);
  },
  async rejectRegionChange(id: string, remark?: string) {
    const res = await client.post(`/profile/admin/region-change-requests/${id}/reject`, { remark });
    return unwrapResponse<any>(res.data);
  }
};
