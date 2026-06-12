import client, { unwrapResponse } from './client';

export type PlatformCode = 'DOUYIN' | 'XIAOHONGSHU' | 'WECHAT_CHANNEL';
export type DataOpsUserRole = 'MEDIA' | 'OPERATOR' | 'DATA' | 'ADMINISTRATIVE' | 'CONSULTANT';

export interface DataOpsUserOption {
  id: number;
  username?: string;
  display_name?: string;
  displayName?: string;
  department?: string;
  role_code?: DataOpsUserRole;
  roleCode?: DataOpsUserRole;
}

export interface DataOpsAsset {
  id: number;
  package_id?: number;
  packageId?: number;
  platform_topic_id?: number;
  platformTopicId?: number;
  content_id?: number;
  contentId?: number;
  asset_type?: string;
  assetType?: string;
  original_filename?: string;
  originalFilename?: string;
  file_name?: string;
  fileName?: string;
  bucket_name?: string;
  bucketName?: string;
  object_key?: string;
  objectKey?: string;
  public_url?: string;
  publicUrl?: string;
  url?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  upload_status?: string;
  uploadStatus?: string;
  recognition_status?: string;
  recognitionStatus?: string;
  status?: string;
  error_message?: string;
  errorMessage?: string;
  fail_reason?: string;
  failReason?: string;
  created_at?: string;
  createdAt?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  ocr_payload_json?: string;
  ocrPayloadJson?: string;
  data_payload_json?: string;
  dataPayloadJson?: string;
  parsed_result_json?: string;
  parsedResultJson?: string;
}

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
  assets?: DataOpsAsset[];
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
  cover_asset_id?: number;
  coverAssetId?: number;
  cover_image_url?: string;
  coverImageUrl?: string;
  ocr_title?: string;
  ocrTitle?: string;
  ocr_account_name?: string;
  ocrAccountName?: string;
  ocr_payload_json?: string;
  ocrPayloadJson?: string;
  status?: string;
  ocr_status?: string;
  ocrStatus?: string;
  asset?: DataOpsAsset;
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
  data_payload_json?: string;
  dataPayloadJson?: string;
  assets?: DataOpsAsset[];
}

export interface DataOpsRecognitionResponse {
  requestId?: string;
  engine?: string;
  platform?: string;
  scene?: string;
  rawText?: string;
  result?: Record<string, any>;
  warnings?: string[];
  elapsedMs?: number;
  rawPayload?: Record<string, any>;
}

export interface DataOpsCurrentTopicGenerateResponse {
  topicId: number;
  packageId: number;
  coverRecognized: number;
  screenshotsRecognized: number;
  skipped: number;
  failed: number;
  failures?: Array<{ assetId?: number; type?: string; message?: string }>;
  package?: DataOpsPackage;
}

export const dataOpsApi = {
  async userOptions(role: DataOpsUserRole) {
    const res = await client.get('/data-ops/users', { params: { role } });
    return unwrapResponse<DataOpsUserOption[]>(res.data);
  },
  async packages(params?: { date?: string }) {
    const res = await client.get('/data-ops/packages', { params });
    return unwrapResponse<DataOpsPackage[]>(res.data);
  },
  async createPackage(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[] }) {
    const res = await client.post('/data-ops/packages', payload);
    return unwrapResponse<DataOpsPackage>(res.data);
  },
  async packageDetail(id: number | string) {
    const res = await client.get('/data-ops/packages/' + id);
    return unwrapResponse<DataOpsPackage>(res.data);
  },
  async createPlatformTopic(packageId: number | string, payload: { platformCode: PlatformCode; subTopicName?: string }) {
    const res = await client.post('/data-ops/packages/' + packageId + '/platform-topics', payload);
    return unwrapResponse<DataOpsPlatformTopic>(res.data);
  },
  async platformTopics(packageId: number | string) {
    const res = await client.get('/data-ops/packages/' + packageId + '/platform-topics');
    return unwrapResponse<DataOpsPlatformTopic[]>(res.data);
  },
  async uploadCover(topicId: number | string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/cover', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    return unwrapResponse<DataOpsPlatformTopic>(res.data);
  },
  async confirmContent(topicId: number | string, payload: { contentTitle?: string; contentSummary?: string; contentDate?: string }) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/contents/confirm', payload);
    return unwrapResponse<DataOpsContent>(res.data);
  },
  async uploadScreenshots(contentId: number | string, files: File[]) {
    const form = new FormData();
    files.forEach(file => form.append('files', file));
    const res = await client.post('/data-ops/contents/' + contentId + '/screenshots', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    return unwrapResponse<DataOpsContent>(res.data);
  },
  async recognizeAsset(assetId: number | string, params?: { platform?: PlatformCode; scene?: string }) {
    const res = await client.post('/data-ops/assets/' + assetId + '/recognize', null, { params, timeout: 0 });
    return unwrapResponse<DataOpsRecognitionResponse>(res.data);
  },
  async generateCurrentTopicData(topicId: number | string) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/generate-current-data', null, { timeout: 0 });
    return unwrapResponse<DataOpsCurrentTopicGenerateResponse>(res.data);
  },
  async recognizeUploadedImage(file: File, params: { platform: PlatformCode; scene: string }) {
    const form = new FormData();
    form.append('file', file);
    form.append('platform', params.platform);
    form.append('scene', params.scene);
    const res = await client.post('/recognition/social-metrics', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    return unwrapResponse<DataOpsRecognitionResponse>(res.data);
  },
  async generateDailyReport(payload: { date?: string }) {
    const res = await client.post('/data-ops/reports-export/daily', payload, {
      responseType: 'blob',
      timeout: 0
    });
    const contentType = String(res.headers['content-type'] || '');
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType || 'application/octet-stream' });
    if (!contentType.includes('spreadsheetml') && !contentType.includes('application/octet-stream')) {
      const text = await blob.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed?.message || parsed?.msg || '导出失败');
      } catch {
        throw new Error(text || '导出失败');
      }
    }
    if (!blob.size) throw new Error('导出的文件为空');
    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
    const fileName = decodeURIComponent(match?.[1] || match?.[2] || `数据操作日报_${payload.date || 'today'}.xlsx`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
      a.remove();
      window.URL.revokeObjectURL(url);
    }, 1000);
    return { fileName, size: blob.size };
  }
};