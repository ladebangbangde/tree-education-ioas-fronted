import client, { normalizePage, unwrapResponse } from './client';
import type { OperatorProfile } from '@/types/mediaFlow';

export const operatorsApi = {
  async options() {
    const res = await client.get('/operators/options');
    return unwrapResponse<OperatorProfile[]>(res.data);
  },
  async list(params?: { name?: string; pageNum?: number; pageSize?: number }) {
    const res = await client.get('/operators', { params });
    return normalizePage<OperatorProfile>(res.data);
  }
};
