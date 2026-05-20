import client, { normalizePage, unwrapResponse } from './client';

export const tasksApi = {
  async media() {
    const res = await client.get('/tasks/media', { params: { pageNum: 1, pageSize: 500 } });
    return normalizePage<any>(res.data).records;
  },
  async operator() {
    const res = await client.get('/tasks/operator', { params: { pageNum: 1, pageSize: 500 } });
    return normalizePage<any>(res.data).records;
  },
  async update(id: string, payload: Record<string, unknown>) {
    const res = await client.patch(`/tasks/${id}`, payload);
    return unwrapResponse<any>(res.data);
  },
  async cancel(id: string) {
    const res = await client.post(`/tasks/${id}/cancel`);
    return unwrapResponse<any>(res.data);
  },
  async logs(id: string, lines = 200) {
    const res = await client.get(`/tasks/${id}/logs`, { params: { lines } });
    return unwrapResponse<string[]>(res.data);
  }
};
