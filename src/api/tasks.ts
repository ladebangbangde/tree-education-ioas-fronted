import client, { unwrapResponse } from './client';

export const tasksApi = {
  async media() {
    const res = await client.get('/tasks/media');
    return unwrapResponse<any[]>(res.data);
  },
  async operator() {
    const res = await client.get('/tasks/operator');
    return unwrapResponse<any[]>(res.data);
  },
  async update(id: string, payload: Record<string, unknown>) {
    const res = await client.patch(`/tasks/${id}`, payload);
    return unwrapResponse<any>(res.data);
  }
};
