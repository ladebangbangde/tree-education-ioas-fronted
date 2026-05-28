import { rootClient, normalizePage, unwrapResponse } from './client';

export type ApplicationStepCode = 'PREPARE_MATERIALS' | 'SCHOOL_OFFER' | 'VISA_PROCESSING' | 'VISA_PROCEDURES' | 'VISA_APPROVED_TICKET';
export type ApplicationStepStatus = 'LOCKED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type ApplicationAttachmentType =
  | 'PASSPORT' | 'ID_CARD' | 'TRANSCRIPT' | 'DIPLOMA' | 'LANGUAGE_SCORE' | 'RESUME'
  | 'PERSONAL_STATEMENT' | 'RECOMMENDATION_LETTER' | 'WORK_EXPERIENCE' | 'FINANCIAL_PROOF'
  | 'SCHOOL_APPLICATION_FORM' | 'OFFER_LETTER' | 'VISA_APPLICATION_FORM' | 'VISA_PAYMENT_RECEIPT'
  | 'MEDICAL_CHECK' | 'BIOMETRIC_APPOINTMENT' | 'VISA_RESULT' | 'FLIGHT_TICKET' | 'ACCOMMODATION' | 'OTHER';

export interface ApplicationAttachment {
  id: number;
  attachmentType: ApplicationAttachmentType;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  fileUrl?: string;
  note?: string;
  uploadedByName?: string;
  createdAt?: string;
}

export interface ApplicationFlowStep {
  id: number;
  stepCode: ApplicationStepCode;
  orderNo: number;
  stepName: string;
  status: ApplicationStepStatus;
  required: boolean;
  uploadedFileCount: number;
  consultantNote?: string;
  customerVisibleNote?: string;
  startedAt?: string;
  completedAt?: string;
  version?: number;
  attachments: ApplicationAttachment[];
}

export interface ApplicationFlow {
  id: number;
  studentProfileId: number;
  studentNo?: string;
  studentName: string;
  ownerConsultantId: number;
  ownerConsultantName: string;
  currentStep: ApplicationStepCode;
  progressPercent: number;
  completed: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  steps: ApplicationFlowStep[];
}

export const applicationFlowsApi = {
  async list(params: { keyword?: string; pageNum?: number; pageSize?: number }) {
    const res = await rootClient.get('/application-flows', { params });
    return normalizePage<ApplicationFlow>(res.data);
  },
  async start(studentProfileId: string | number, payload?: { remark?: string }) {
    const res = await rootClient.post(`/application-flows/students/${studentProfileId}/start`, payload || {});
    return unwrapResponse<ApplicationFlow>(res.data);
  },
  async detail(id: string | number) {
    const res = await rootClient.get(`/application-flows/${id}`);
    return unwrapResponse<ApplicationFlow>(res.data);
  },
  async detailByStudent(studentProfileId: string | number) {
    const res = await rootClient.get(`/application-flows/students/${studentProfileId}`);
    return unwrapResponse<ApplicationFlow>(res.data);
  },
  async updateStep(flowId: string | number, stepCode: ApplicationStepCode, payload: { status: ApplicationStepStatus; consultantNote?: string; customerVisibleNote?: string; version?: number }) {
    const res = await rootClient.patch(`/application-flows/${flowId}/steps/${stepCode}`, payload);
    return unwrapResponse<ApplicationFlow>(res.data);
  },
  async uploadAttachment(flowId: string | number, stepCode: ApplicationStepCode, payload: { file: File; attachmentType?: ApplicationAttachmentType; note?: string }) {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.attachmentType) form.append('attachmentType', payload.attachmentType);
    if (payload.note) form.append('note', payload.note);
    const res = await rootClient.post(`/application-flows/${flowId}/steps/${stepCode}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0
    });
    return unwrapResponse<ApplicationAttachment>(res.data);
  }
};
