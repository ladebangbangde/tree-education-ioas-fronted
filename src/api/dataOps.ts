import client, { unwrapResponse } from './client';

export type PlatformCode = 'DOUYIN' | 'XIAOHONGSHU' | 'WECHAT_CHANNEL';
export type DataOpsUserRole = 'MEDIA' | 'OPERATOR' | 'DATA' | 'ADMINISTRATIVE' | 'CONSULTANT';
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

function normalizeAssetGroup(asset: DataOpsAsset): DataOpsAsset {
  if (asset.asset_group || asset.assetGroup) return asset;
  const marker = `${asset.object_key || asset.objectKey || asset.public_url || asset.publicUrl || asset.url || ''}`.toLowerCase();
  let group: DataOpsAssetGroup | undefined;
  if (marker.includes('douyin_flow_analysis')) group = 'DOUYIN_FLOW_ANALYSIS';
  else if (marker.includes('douyin_overview_chart')) group = 'DOUYIN_OVERVIEW_CHART';
  else if (marker.includes('douyin_overview')) group = 'DOUYIN_OVERVIEW';
  if (!group) return asset;
  return { ...asset, asset_group: group, assetGroup: group };
}

function normalizePackage(pkg: DataOpsPackage): DataOpsPackage {
  if (!pkg?.assets?.length) return pkg;
  return {
    ...pkg,
    assets: pkg.assets.map(normalizeAssetGroup)
  };
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
    const res = await client.post('/data-ops/packages/' + packageId + '/platform-topics', {
      platformCode: payload.platformCode,
      subTopicName: payload.subTopicName,
      contentType: payload.contentType
    });
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
  async confirmContent(topicId: number | string, payload: { contentTitle?: string; contentSummary?: string; contentDate?: string; contentType?: DataOpsContentType }) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/contents/confirm', {
      contentTitle: payload.contentTitle,
      contentSummary: payload.contentSummary,
      contentDate: payload.contentDate,
      contentType: payload.contentType
    });
    return unwrapResponse<DataOpsContent>(res.data);
  },
  async uploadScreenshots(contentId: number | string, files: File[], assetGroup?: DataOpsAssetGroup) {
    const form = new FormData();
    files.forEach(file => form.append('files', file));
    if (assetGroup) form.append('assetGroup', assetGroup);
    const res = await client.post('/data-ops/contents/' + contentId + '/screenshots', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    const content = unwrapResponse<DataOpsContent>(res.data);
    if (!content.assets?.length || !assetGroup) return content;
    return {
      ...content,
      assets: content.assets.map(asset => ({ ...asset, asset_group: assetGroup, assetGroup }))
    };
  },
  async recognizeAsset(assetId: number | string, params?: { platform?: PlatformCode; scene?: string }) {
    const res = await client.post('/data-ops/assets/' + assetId + '/recognize', null, { params, timeout: 0 });
    return unwrapResponse<DataOpsRecognitionResponse>(res.data);
  },
  async generateCurrentTopicData(topicId: number | string) {
    const res = await client.post('/data-ops/platform-topics/' + topicId + '/generate-current-data', null, { timeout: 0 });
    const result = unwrapResponse<DataOpsCurrentTopicGenerateResponse>(res.data);
    return result.package ? { ...result, package: normalizePackage(result.package) } : result;
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
    const res = await client.post('/data-ops/reports/daily', payload);
    return unwrapResponse<any>(res.data);
  }
};
