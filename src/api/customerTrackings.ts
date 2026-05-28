import client, { unwrapResponse } from './client';
import type { ApplicationStepCode, ApplicationStepStatus } from './applicationFlows';

export type TrackingSummary = {
  customerId: number;
  customerNo?: string;
  customerName: string;
  sourceLeadId?: number;
  sourceLeadNo?: string;
  leadCreatedAt?: string;
  transferred?: boolean;
  transferredAt?: string;
  customerCreatedAt?: string;
  flowId?: number;
  progressPercent?: number;
  currentStepName?: string;
  lastActionAt?: string;
};

export type TrackingEvent = {
  id: string;
  type: string;
  title: string;
  content?: string;
  operatorName?: string;
  happenedAt?: string;
  relatedId?: number;
  relatedType?: string;
};

export type TrackingFlowNode = {
  id: string;
  label: string;
  nodeType: 'start' | 'condition' | 'process' | string;
  status: string;
  description?: string;
  happenedAt?: string;
};

export type TrackingApplicationStep = {
  stepCode: ApplicationStepCode;
  stepName: string;
  status: ApplicationStepStatus;
  uploadedFileCount?: number;
  note?: string;
  startedAt?: string;
  completedAt?: string;
};

export type TrackingDetail = {
  summary: TrackingSummary;
  events: TrackingEvent[];
  graphNodes: TrackingFlowNode[];
  applicationSteps: TrackingApplicationStep[];
};

export const customerTrackingsApi = {
  async list(params?: { keyword?: string }) {
    const res = await client.get('/customer-trackings', { params });
    return unwrapResponse<TrackingSummary[]>(res.data);
  },
  async detail(customerId: number | string) {
    const res = await client.get(`/customer-trackings/${customerId}`);
    return unwrapResponse<TrackingDetail>(res.data);
  }
};
