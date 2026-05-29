import client, { unwrapResponse } from './client';

export type AdvisorProfile = {
  userId: number;
  name: string;
  gender?: string;
  regionCode?: string;
  regionName?: string;
  publicTitle?: string;
  publicBio?: string;
  avatarUrl?: string;
  priority?: number;
};

export const advisorsApi = {
  async list() {
    const res = await client.get('/settings/advisors');
    return unwrapResponse<AdvisorProfile[]>(res.data);
  },
  async uploadAvatar(userId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post(`/settings/advisors/${userId}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0
    });
    return unwrapResponse<{ userId: number; avatarUrl: string }>(res.data);
  }
};
