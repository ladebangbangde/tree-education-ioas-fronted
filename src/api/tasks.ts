import client, { normalizePage, unwrapResponse } from './client';

export const tasksApi = {
  async media(options?: { quiet?: boolean }) {
    const res = await client.get('/tasks/media', { params: { pageNum: 1, pageSize: 500 }, silent: options?.quiet });
    return normalizePage<any>(res.data).records;
  },
  async operator(options?: { quiet?: boolean }) {
    const res = await client.get('/tasks/operator', { params: { pageNum: 1, pageSize: 500 }, silent: options?.quiet });
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
  async batchDelete(taskIds: Array<string | number>, purgeFiles = true) {
    const res = await client.delete('/tasks/batch', { data: { taskIds, purgeFiles } });
    return unwrapResponse<any>(res.data);
  },
  async logs(id: string, lines = 200, options?: { quiet?: boolean }) {
    const res = await client.get(`/tasks/${id}/logs`, { params: { lines }, silent: options?.quiet });
    return unwrapResponse<string[]>(res.data);
  }
};
