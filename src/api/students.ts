import client, { normalizePage, unwrapResponse } from './client';

export interface StudentQuery {
  keyword?: string;
  ownerConsultantId?: string;
  intentionRegionCode?: string;
  profileStatus?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface StudentPayload { [key: string]: unknown; }

export const studentsApi = {
  async list(params: StudentQuery) {
    const res = await client.get('/students', { params });
    return normalizePage<any>(res.data);
  },
  async detail(id: string) {
    const res = await client.get(`/students/${id}`);
    return unwrapResponse<any>(res.data);
  },
  async update(id: string, payload: StudentPayload) {
    const res = await client.patch(`/students/${id}`, payload);
    return unwrapResponse<any>(res.data);
  },
  async delete(id: string) {
    const res = await client.delete(`/students/${id}`);
    return unwrapResponse<any>(res.data);
  }
};
