import client, { normalizePage, unwrapResponse } from './client';

export type RecognitionPlatform = 'DOUYIN' | 'XIAOHONGSHU' | 'WECHAT_CHANNEL' | 'UNKNOWN';
export type RecognitionContentType = 'AUTO' | 'IMAGE_TEXT' | 'VIDEO' | 'ACCOUNT_OVERVIEW' | 'UNKNOWN';
export type RecognitionStatus = 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';

export interface RecognitionMetrics {
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  favoriteCount?: number | null;
  shareCount?: number | null;
  followerCount?: number | null;
  followerGain?: number | null;
  completionRate?: string | null;
  interactionRate?: string | null;
  averageWatchSeconds?: number | null;
  profileVisitCount?: number | null;
}

export interface ImageTextStats {
  readCount?: number | null;
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  favoriteCount?: number | null;
  shareCount?: number | null;
  imageCount?: number | null;
  coverClickRate?: string | null;
  copyExpandRate?: string | null;
  copyFinishRate?: string | null;
  commentEnterRate?: string | null;
  slideAwayRate?: string | null;
  followerGain?: number | null;
}

export interface VideoStats {
  playCount?: number | null;
  exposureCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  favoriteCount?: number | null;
  shareCount?: number | null;
  completionRate?: string | null;
  fiveSecondCompletionRate?: string | null;
  averageWatchSeconds?: number | null;
  averageWatchText?: string | null;
  durationSeconds?: number | null;
  durationText?: string | null;
  interactionRate?: string | null;
  followerGain?: number | null;
  profileVisitCount?: number | null;
}

export interface RecognitionResult {
  accountName?: string | null;
  accountId?: string | null;
  douyinId?: string | null;
  wechatChannelId?: string | null;
  contentType?: RecognitionContentType | string | null;
  contentTitle?: string | null;
  candidateTitles?: string[];
  metrics?: RecognitionMetrics | null;
  imageTextStats?: ImageTextStats | null;
  videoStats?: VideoStats | null;
  keyValueMetrics?: Record<string, any>;
  confidence?: number | null;
}

export interface RecognitionResponse {
  requestId?: string;
  engine?: string;
  platform?: RecognitionPlatform | string;
  scene?: string;
  contentType?: RecognitionContentType | string;
  rawText?: string;
  result?: RecognitionResult;
  warnings?: string[];
  elapsedMs?: number;
}

export interface RecognitionRecordSummary {
  id: number;
  requestId?: string;
  platform?: string;
  scene?: string;
  contentType?: string;
  status?: RecognitionStatus | string;
  accountName?: string | null;
  accountId?: string | null;
  contentTitle?: string | null;
  confidence?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecognitionRecordDetail extends RecognitionRecordSummary {
  rawText?: string | null;
  result?: any;
  metrics?: any;
  imageTextStats?: any;
  videoStats?: any;
  keyValueMetrics?: Record<string, any> | null;
  correctedResult?: any;
  reviewRemark?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface RecognizeAndSaveResponse {
  recordId: number;
  recognition: RecognitionResponse;
}

export const dataRecognitionApi = {
  async recognizeAndSave(file: File, params: { platform: RecognitionPlatform; scene?: string; contentType?: RecognitionContentType }) {
    const form = new FormData();
    form.append('file', file);
    form.append('platform', params.platform || 'UNKNOWN');
    form.append('scene', params.scene || 'CONTENT_DETAIL');
    form.append('contentType', params.contentType || 'AUTO');
    const res = await client.post('/data-recognition/screenshots/recognize-and-save', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 });
    return unwrapResponse<RecognizeAndSaveResponse>(res.data);
  },
  async list(params?: { status?: string; contentType?: string; pageNum?: number; pageSize?: number }) {
    const res = await client.get('/data-recognition/records', { params });
    return normalizePage<RecognitionRecordSummary>(res.data);
  },
  async detail(id: number | string) {
    const res = await client.get('/data-recognition/records/' + id);
    return unwrapResponse<RecognitionRecordDetail>(res.data);
  },
  async confirm(id: number | string, payload: { correctedResult?: any; reviewRemark?: string; reviewedBy?: string }) {
    const res = await client.patch('/data-recognition/records/' + id + '/confirm', payload || {});
    return unwrapResponse<RecognitionRecordDetail>(res.data);
  },
  async reject(id: number | string, payload: { reviewRemark?: string; reviewedBy?: string }) {
    const res = await client.patch('/data-recognition/records/' + id + '/reject', payload || {});
    return unwrapResponse<RecognitionRecordDetail>(res.data);
  }
};
