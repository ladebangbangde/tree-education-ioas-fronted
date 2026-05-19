import { mockLeads } from '@/mock/mediaFlowApi';

export type LeadTab = 'unassigned' | 'assigned' | 'mine';
export interface LeadQuery { tab?: LeadTab; keyword?: string; relatedPackageId?: string; operatorId?: string; pageNum?: number; pageSize?: number; }
export interface LeadPayload { [key: string]: unknown; }

export const leadsApi = {
  list: (params: LeadQuery) => mockLeads.list(params),
  create: (payload: LeadPayload) => mockLeads.create(payload),
  detail: (id: string) => mockLeads.detail(id),
  update: (id: string, payload: LeadPayload) => mockLeads.update(id, payload),
  updateStatus: (id: string, payload: { status: string }) => mockLeads.updateStatus(id, payload as any)
};
