import type { AxiosProgressEvent } from 'axios';
import { rootClient, unwrapResponse } from './client';

export type UploadTaskFileType = 'image' | 'video' | 'script';

export interface UploadTaskCreatePayload {
  packageId?: string | number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: UploadTaskFileType;
}

export interface UploadTaskResponse {
  taskId: string | number;
  status: string;
  progress: number;
  packageId?: string | number;
}

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percent: number;
  speed: number;
}

export const uploadTasksApi = {
  async create(payload: UploadTaskCreatePayload) {
    const res = await rootClient.post('/upload-tasks', payload);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async uploadFile(taskId: string | number, file: File, fileType: UploadTaskFileType, onProgress?: (info: UploadProgressInfo) => void) {
    const formData = new FormData();
    formData.append('file', file);
    let lastLoaded = 0;
    let lastTime = Date.now();
    let lastReportTime = 0;
    let lastReportPercent = -1;
    const res = await rootClient.post(`/upload-tasks/${taskId}/files`, formData, {
      params: { fileType },
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      onUploadProgress: (event: AxiosProgressEvent) => {
        const loaded = event.loaded || 0;
        const total = event.total || file.size || 0;
        const now = Date.now();
        const duration = Math.max((now - lastTime) / 1000, 0.001);
        const speed = Math.max((loaded - lastLoaded) / duration, 0);
        const percent = total ? Math.min(99, Math.round((loaded / total) * 90)) : 0;
        lastLoaded = loaded;
        lastTime = now;
        onProgress?.({ loaded, total, percent, speed });

        if (percent !== lastReportPercent && (now - lastReportTime > 1000 || percent >= 90)) {
          lastReportPercent = percent;
          lastReportTime = now;
          uploadTasksApi.reportProgress(taskId, percent, 'uploading').catch(() => undefined);
        }
      }
    });
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async reportProgress(taskId: string | number, progress: number, status = 'uploading') {
    const res = await rootClient.patch(`/upload-tasks/${taskId}/progress`, { progress, status });
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async get(taskId: string | number) {
    const res = await rootClient.get(`/upload-tasks/${taskId}`);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async fail(taskId: string | number, message?: string) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/fail`, null, { params: { message } });
    return unwrapResponse<UploadTaskResponse>(res.data);
  }
};

export function inferUploadTaskFileType(file: File, fallback?: UploadTaskFileType): UploadTaskFileType {
  const mime = file.type || '';
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'script';
  if (name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx')) return 'script';
  if (mime.startsWith('text/') || name.endsWith('.txt')) return 'script';

  return fallback || 'script';
}
