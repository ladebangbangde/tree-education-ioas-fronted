import client, { unwrapResponse } from './client';

export type ConsultantRegionView = {
  id: number;
  regionCode: string;
  regionName: string;
  priority: number;
};

export type AdvisorProfile = {
  id: number;
  userId: number;
  username?: string;
  consultantName: string;
  phone?: string;
  email?: string;
  teamName?: string;
  avatarUrl?: string;
  publicTitle?: string;
  publicBio?: string;
  regions?: ConsultantRegionView[];
  enabled: boolean;
  assignEnabled: boolean;
  displayOnOfficial: boolean;
  maxDailyLeads: number;
  currentDailyLeads: number;
  sortOrder: number;
};

export type CreateConsultantPayload = {
  username: string;
  password: string;
  displayName: string;
  phone?: string;
  email?: string;
  teamName?: string;
  publicTitle?: string;
  publicBio?: string;
  regionCodes: string[];
  enabled: boolean;
  assignEnabled: boolean;
  displayOnOfficial: boolean;
  maxDailyLeads: number;
  sortOrder: number;
};

export const advisorsApi = {
  async list() {
    const res = await client.get('/settings/consultants');
    return unwrapResponse<AdvisorProfile[]>(res.data);
  },
  async create(payload: CreateConsultantPayload) {
    const res = await client.post('/settings/consultants', payload);
    return unwrapResponse<AdvisorProfile>(res.data);
  },
  async uploadAvatar(consultantId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post(`/settings/consultants/${consultantId}/avatar`, form, {
      timeout: 0
    });
    return unwrapResponse<{ consultantId: number; avatarUrl: string }>(res.data);
  }
};
