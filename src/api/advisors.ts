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
  setupCode?: string;
  consultantName: string;
  avatarUrl?: string;
  qrUrl?: string;
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
  displayName: string;
  regionCodes: string[];
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
  async remove(consultantId: number) {
    const res = await client.delete(`/settings/consultants/${consultantId}`);
    return unwrapResponse<void>(res.data);
  }
};
