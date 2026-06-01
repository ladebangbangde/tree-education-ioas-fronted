import client, { unwrapResponse } from './client';

export type PlatformCode = 'DOUYIN' | 'XIAOHONGSHU';

export interface DataOpsPackage {
  id: number;
  package_no?: string;
  packageNo?: string;
  topic_date?: string;
  topicDate?: string;
  display_name?: string;
  displayName?: string;
  folder_name?: string;
  folderName?: string;
  operator_names?: string;
  operatorNames?: string;
  media_names?: string;
  mediaNames?: string;
  status?: string;
  report_status?: string;
  reportStatus?: string;
  platformTopics?: DataOpsPlatformTopic[];
  contents?: DataOpsContent[];
}

export interface DataOpsPlatformTopic {
  id: number;
  package_id?: number;
  packageId?: number;
  platform_code?: PlatformCode;
  platformCode?: PlatformCode;
  platform_name?: string;
  platformName?: string;
  sub_topic_name?: string;
  subTopicName?: string;
  status?: string;
  ocr_status?: string;
  ocrStatus?: string;
}

export interface DataOpsContent {
  id: number;
  package_id?: number;
  packageId?: number;
  platform_topic_id?: number;
  platformTopicId?: number;
  platform_code?: PlatformCode;
  platformCode?: PlatformCode;
  content_title?: string;
  contentTitle?: string;
  content_summary?: string;
  contentSummary?: string;
  screenshot_count?: number;
  screenshotCount?: number;
  recognition_status?: string;
  recognitionStatus?: string;
  status?: string;
}

export const dataOpsApi = {
  async packages(params?: { date?: string }) {
    const res = await client.get('/data-ops/packages', { params });
    return unwrapResponse<DataOpsPackage[]>(res.data);
  },
  async createPackage(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[] }) {
    const res = await client.post('/data-ops/packages', payload);
    return unwrapResponse<DataOpsPackage>(res.data);
  },
  async packageDetail(id: number | string) {
    const res = await client.get(`/data-ops/packages/${id}`);
    return unwrapResponse<DataOpsPackage>(res.data);
  },
  async createPlatformTopic(packageId: number | string, payload: { platformCode: PlatformCode; subTopicName?: string }) {
    const res = await client.post(`/data-ops/packages/${packageId}/platform-topics`, payload);
    return unwrapResponse<DataOpsPlatformTopic>(res.data);
  },
  async platformTopics(packageId: number | string) {
    const res = await client.get(`/data-ops/packages/${packageId}/platform-topics`);
    return unwrapResponse<DataOpsPlatformTopic[]>(res.data);
  },
  async confirmContent(topicId: number | string, payload: { contentTitle?: string; contentSummary?: string; contentDate?: string }) {
    const res = await client.post(`/data-ops/platform-topics/${topicId}/contents/confirm`, payload);
    return unwrapResponse<DataOpsContent>(res.data);
  },
  async generateDailyReport(payload: { date?: string }) {
    const res = await client.post('/data-ops/reports/daily', payload);
    return unwrapResponse<any>(res.data);
  }
};
