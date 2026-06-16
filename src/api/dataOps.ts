import client, { unwrapResponse } from './client';

export type PlatformCode = 'DOUYIN' | 'XIAOHONGSHU' | 'WECHAT_CHANNEL';
export type DataOpsUserRole = 'MEDIA' | 'OPERATOR' | 'DATA' | 'ADMINISTRATIVE' | 'CONSULTANT' | 'ANCHOR';
export type DataOpsContentType = 'IMAGE_TEXT' | 'VIDEO';
export type DataOpsAssetGroup = 'DOUYIN_OVERVIEW' | 'DOUYIN_OVERVIEW_CHART' | 'DOUYIN_FLOW_ANALYSIS';

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
  account_id?: number;
  accountId?: number;
  video_id?: number;
  videoId?: number;
  content_id?: number;
  contentId?: number;
  asset_type?: string;
  assetType?: string;
  content_type?: DataOpsContentType;
  contentType?: DataOpsContentType;
  asset_group?: DataOpsAssetGroup;
  assetGroup?: DataOpsAssetGroup;
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

export interface DataOpsMetricRow {
  id: number;
  platformTopicId: number;
  accountId?: number | null;
  accountName?: string | null;
  platformUserId?: string | null;
  videoId?: number | null;
  videoTitle?: string | null;
  contentId?: number;
  assetId?: number;
  platformCode: PlatformCode;
  contentType: DataOpsContentType;
  metricGroup: 'OVERVIEW' | 'OVERVIEW_CHART' | 'FLOW_ANALYSIS';
  metricKey: string;
  metricLabel: string;
  metricValue?: string | null;
  metricNumeric?: number | null;
  metricUnit?: string | null;
  recognitionStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  confidence?: number | null;
  source?: string | null;
  failReason?: string | null;
  recognizedAt?: string | null;
  displayOrder?: number | null;
}

export interface DataOpsTopicRecognitionStatus {
  status: string;
  label: string;
  color: string;
  total?: number;
  success?: number;
  failed?: number;
  missing?: number;
}

export interface DataOpsTopicMetricsResponse {
  topicId: number;
  status: DataOpsTopicRecognitionStatus;
  rows: DataOpsMetricRow[];
}

export interface DataOpsAccountConfirmResponse {
  topicId: number;
  accountId?: number;
  accountName: string;
  platformUserId: string;
  contentType?: DataOpsContentType;
  status: string;
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
  content_type?: DataOpsContentType;
  contentType?: DataOpsContentType;
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
  ocr_platform_user_id?: string;
  ocrPlatformUserId?: string;
  ocr_content_title?: string;
  ocrContentTitle?: string;
  ocr_payload_json?: string;
  ocrPayloadJson?: string;
  account_confirmed_flag?: number;
  accountConfirmedFlag?: number;
  confirmed_account_id?: number;
  confirmedAccountId?: number;
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
  account_id?: number;
  accountId?: number;
  video_id?: number;
  videoId?: number;
  platform_code?: PlatformCode;
  platformCode?: PlatformCode;
  content_type?: DataOpsContentType;
  contentType?: DataOpsContentType;
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

function withStablePreviewUrl(asset: DataOpsAsset): DataOpsAsset {
  if (!asset?.id) return asset;
  const url = `/api/v1/data-ops/assets/${asset.id}/file`;
  return { ...asset, public_url: url, publicUrl: url, url, thumbnail_url: url, thumbnailUrl: url };
}

function normalizeAssetGroup(asset: DataOpsAsset): DataOpsAsset {
  const withPreview = withStablePreviewUrl(asset);
  const currentGroup = withPreview.asset_group || withPreview.assetGroup;
  if (currentGroup) return withPreview;
  const marker = `${withPreview.object_key || withPreview.objectKey || withPreview.public_url || withPreview.publicUrl || ''}`.toLowerCase();
  let group: DataOpsAssetGroup | undefined;
  if (marker.includes('douyin_flow_analysis')) group = 'DOUYIN_FLOW_ANALYSIS';
  else if (marker.includes('douyin_overview_chart')) group = 'DOUYIN_OVERVIEW_CHART';
  else if (marker.includes('douyin_overview')) group = 'DOUYIN_OVERVIEW';
  if (!group) return withPreview;
  return { ...withPreview, asset_group: group, assetGroup: group };
}

function normalizePackage(pkg: DataOpsPackage): DataOpsPackage {
  if (!pkg?.assets?.length) return pkg;
  return { ...pkg, assets: pkg.assets.map(normalizeAssetGroup) };
}

function renameForGroup(file: File, assetGroup?: DataOpsAssetGroup) {
  if (!assetGroup) return file;
  const prefix = assetGroup.toLowerCase();
  if (file.name.toLowerCase().includes(prefix)) return file;
  try {
    return new File([file], `${prefix}_${file.name}`, { type: file.type, lastModified: file.lastModified });
  } catch {
    return file;
  }
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
    return normalizePackage(unwrapResponse<DataOpsPackage>(res.data));
  },
  async packageDetail(id: number | string) {
    const res = await client.get('/data-ops/packages/' + id);
    return normalizePackage(unwrapResponse<DataOpsPackage>(res.data));
  },
  async createPlatformTopic(packageId: number | string, payload: { platformCode: PlatformCode; subTopicName?: string; contentType?: DataOpsContentType }) {
    const res = await client.post('/data-ops/packages/' + packageId + '/platform-topics', payload);
    return unwrapResponse<DataOpsPlatformTopic>(res.data);
  },
  async topicMetrics(topicId: number | string) {
    const res = await client.get('/data-ops/platform-topics/' + topicId + '/metrics');
    return unwrapResponse<DataOpsTopicMetricsResponse>(res.data);
  },
  async topicRecognitionStatus(topicId: number | string) {
    const res = await client.get('/data-ops/platform-topics/' + topicId + '/recognition-status');
    return unwrapResponse<DataOpsTopicRecognitionStatus>(res.data);
  },
  async confirmAccount(topicId: number | string, payload: { accountName: string; platformUserId: string; contentType: DataOpsContentType }) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/account/confirm', payload);
    return unwrapResponse<DataOpsAccountConfirmResponse>(res.data);
  },
  async updateTopicContentType(topicId: number | string, payload: { contentType: DataOpsContentType }) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/content-type', payload);
    return unwrapResponse<{ topicId: number; contentType: DataOpsContentType; status: string }>(res.data);
  },
  async uploadCover(topicId: number | string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/cover', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    return unwrapResponse<DataOpsPlatformTopic>(res.data);
  },
  async confirmContent(topicId: number | string, payload: { contentId?: number | string; contentTitle?: string; contentSummary?: string; contentDate?: string; contentType?: DataOpsContentType }) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/contents/confirm-current', payload);
    return unwrapResponse<DataOpsContent>(res.data);
  },
  async uploadScreenshots(contentId: number | string, files: File[], assetGroup?: DataOpsAssetGroup) {
    const form = new FormData();
    files.forEach(file => form.append('files', renameForGroup(file, assetGroup)));
    const res = await client.post('/data-ops/contents/' + contentId + '/screenshots', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    const content = unwrapResponse<DataOpsContent>(res.data);
    if (!content.assets?.length) return content;
    return { ...content, assets: content.assets.map(asset => normalizeAssetGroup(assetGroup ? { ...asset, asset_group: assetGroup, assetGroup } : asset)) };
  },
  async deleteAsset(assetId: number | string) {
    const res = await client.delete('/data-ops/assets/' + assetId);
    return unwrapResponse<any>(res.data);
  },
  async recognizeAsset(assetId: number | string, params?: { platform?: PlatformCode; scene?: string }) {
    const res = await client.post('/data-ops/assets/' + assetId + '/recognize-current', null, { params, timeout: 0 });
    return unwrapResponse<DataOpsRecognitionResponse>(res.data);
  },
  async generateCurrentTopicData(topicId: number | string) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/generate-current-data', null, { timeout: 0 });
    const result = unwrapResponse<DataOpsCurrentTopicGenerateResponse>(res.data);
    return result.package ? { ...result, package: normalizePackage(result.package) } : result;
  },
  async generateDailyReport(payload: { date?: string }) {
    const res = await client.post('/data-ops/reports-export/daily', payload, { responseType: 'blob', timeout: 0 });
    const contentType = String(res.headers['content-type'] || '');
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType || 'application/octet-stream' });
    if (!contentType.includes('spreadsheetml') && !contentType.includes('application/octet-stream') && !contentType.includes('zip')) {
      const text = await blob.text();
      throw new Error(text || '导出失败');
    }
    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
    const fileName = decodeURIComponent(match?.[1] || match?.[2] || `数据操作日报_${payload.date || 'today'}.xlsx`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => { a.remove(); window.URL.revokeObjectURL(url); }, 1000);
    return { fileName, size: blob.size };
  }
};
