import client, { normalizePage, unwrapResponse } from './client';

export type LeadTab = 'unassigned' | 'assigned' | 'mine';
export interface LeadQuery { tab?: LeadTab; keyword?: string; relatedPackageId?: string; operatorId?: string; pageNum?: number; pageSize?: number; }
export interface LeadPayload { [key: string]: unknown; }

export const leadsApi = {
  async list(params: LeadQuery) {
    const res = await client.get('/leads', { params });
    return normalizePage<any>(res.data);
  },
  async create(payload: LeadPayload) {
    const res = await client.post('/leads', payload);
    return unwrapResponse<any>(res.data);
  },
  async detail(id: string) {
    const res = await client.get(`/leads/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async update(id: string, payload: LeadPayload) {
    const res = await client.patch(`/leads/${id}`, payload);
    return unwrapResponse<any>(res.data);
  },
  async updateStatus(id: string, payload: { status: string }) {
    const res = await client.patch(`/leads/${id}/status`, payload);
    return unwrapResponse<any>(res.data);
  },
  async delete(id: string) {
    const res = await client.delete(`/leads/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async consultants() {
    const res = await client.get('/leads/consultants');
    return unwrapResponse<any[]>(res.data);
  },
  async createTransferRequest(leadId: string, payload: { toConsultantId: number | string; reason?: string }) {
    const res = await client.post(`/leads/${leadId}/transfer-requests`, payload);
    return unwrapResponse<any>(res.data);
  },
  async transferRequests(scope: 'received' | 'sent' = 'received') {
    const res = await client.get('/leads/transfer-requests/mine', { params: { scope } });
    return unwrapResponse<any[]>(res.data);
  },
  async acceptTransferRequest(id: string, payload?: { remark?: string }) {
    const res = await client.post(`/leads/transfer-requests/${id}/accept`, payload || {});
    return unwrapResponse<any>(res.data);
  },
  async rejectTransferRequest(id: string, payload?: { remark?: string }) {
    const res = await client.post(`/leads/transfer-requests/${id}/reject`, payload || {});
    return unwrapResponse<any>(res.data);
  }
};
