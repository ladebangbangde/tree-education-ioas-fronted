import client, { unwrapResponse } from './client';
import type { DataOpsPackage, DataOpsUserOption } from './dataOps';

export const dataOpsAnchorApi = {
  async anchorUsers() {
    const res = await client.get('/data-ops/anchor-users');
    return unwrapResponse<DataOpsUserOption[]>(res.data);
  },
  async createPackageWithAnchor(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[]; anchorUserIds: number[] }) {
    const res = await client.post('/data-ops/packages-with-anchor', payload);
    return unwrapResponse<DataOpsPackage>(res.data);
  }
};
