import axios from 'axios';
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

export interface MultipartCreateResponse {
  taskId: string | number;
  bucketName: string;
  objectKey: string;
  uploadId: string;
  publicUrl: string;
  partSize: number;
  partCount: number;
}

export interface MultipartSignPartResponse {
  url: string;
  partNumber: number;
}

export interface UploadTaskPresignResponse {
  taskId: string | number;
  bucketName: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expireSeconds: number;
}

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percent: number;
  speed: number;
  avgSpeed?: number;
  partCount?: number;
  completedPartCount?: number;
}

interface UploadedPart { partNumber: number; etag: string; size: number }

const DEFAULT_PART_SIZE = 10 * 1024 * 1024;
const DEFAULT_CONCURRENCY = 3;

export const uploadTasksApi = {
  async create(payload: UploadTaskCreatePayload) {
    const res = await rootClient.post('/upload-tasks', payload);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async createMultipart(taskId: string | number, payload: Omit<UploadTaskCreatePayload, 'packageId'> & { partSize?: number }) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart`, payload);
    return unwrapResponse<MultipartCreateResponse>(res.data);
  },
  async signMultipartPart(taskId: string | number, payload: { uploadId: string; bucketName: string; objectKey: string; partNumber: number }) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/sign-part`, payload, { silent: true });
    return unwrapResponse<MultipartSignPartResponse>(res.data);
  },
  async completeMultipart(taskId: string | number, payload: {
    uploadId: string;
    bucketName: string;
    objectKey: string;
    publicUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: UploadTaskFileType;
    parts: Array<{ partNumber: number; etag: string }>;
  }) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/complete`, payload);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async abortMultipart(taskId: string | number) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/abort`);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async uploadFile(taskId: string | number, file: File, fileType: UploadTaskFileType, onProgress?: (info: UploadProgressInfo) => void) {
    return uploadTasksApi.uploadMultipartFile(taskId, file, fileType, onProgress);
  },
  async uploadMultipartFile(taskId: string | number, file: File, fileType: UploadTaskFileType, onProgress?: (info: UploadProgressInfo) => void) {
    const mimeType = file.type || 'application/octet-stream';
    const startedAt = Date.now();
    const multipart = await uploadTasksApi.createMultipart(taskId, {
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      fileType,
      partSize: DEFAULT_PART_SIZE
    });

    const partSize = multipart.partSize || DEFAULT_PART_SIZE;
    const partCount = multipart.partCount || Math.ceil(file.size / partSize);
    const uploadedParts: UploadedPart[] = [];
    const partLoaded = new Map<number, number>();
    let nextPartNumber = 1;
    let lastReportTime = 0;
    let lastReportPercent = -1;

    const report = async (force = false) => {
      const uploadedBytes = Math.min(file.size, [...partLoaded.values()].reduce((sum, value) => sum + value, 0));
      const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.001);
      const avgSpeed = Math.max(uploadedBytes / elapsed, 0);
      const percent = file.size ? Math.min(94, Math.max(1, Math.round((uploadedBytes / file.size) * 94))) : 1;
      const now = Date.now();
      onProgress?.({
        loaded: uploadedBytes,
        total: file.size,
        percent,
        speed: avgSpeed,
        avgSpeed,
        partCount,
        completedPartCount: uploadedParts.length
      });

      if (force || percent !== lastReportPercent && (now - lastReportTime > 1000 || percent >= 90)) {
        lastReportPercent = percent;
        lastReportTime = now;
        await uploadTasksApi.reportProgress(taskId, percent, 'uploading', {
          uploadedBytes,
          totalBytes: file.size,
          speedBytesPerSecond: Math.round(avgSpeed),
          averageSpeedBytesPerSecond: Math.round(avgSpeed),
          partCount,
          completedPartCount: uploadedParts.length
        }).catch(() => undefined);
      }
    };

    const uploadOnePart = async () => {
      while (nextPartNumber <= partCount) {
        const partNumber = nextPartNumber++;
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);
        const signed = await uploadTasksApi.signMultipartPart(taskId, {
          uploadId: multipart.uploadId,
          bucketName: multipart.bucketName,
          objectKey: multipart.objectKey,
          partNumber
        });
        partLoaded.set(partNumber, 0);
        const response = await axios.put(signed.url, blob, {
          timeout: 0,
          headers: { 'Content-Type': mimeType },
          onUploadProgress: event => {
            partLoaded.set(partNumber, event.loaded || 0);
            report(false).catch(() => undefined);
          }
        });
        const etagHeader = response.headers?.etag || response.headers?.ETag;
        if (!etagHeader) throw new Error(`分片 ${partNumber} 上传成功但没有返回 ETag`);
        partLoaded.set(partNumber, blob.size);
        uploadedParts.push({ partNumber, etag: etagHeader, size: blob.size });
        await report(true);
      }
    };

    try {
      const workers = Array.from({ length: Math.min(DEFAULT_CONCURRENCY, partCount) }, () => uploadOnePart());
      await Promise.all(workers);
      await uploadTasksApi.reportProgress(taskId, 95, 'processing', {
        uploadedBytes: file.size,
        totalBytes: file.size,
        speedBytesPerSecond: 0,
        averageSpeedBytesPerSecond: Math.round(file.size / Math.max((Date.now() - startedAt) / 1000, 0.001)),
        partCount,
        completedPartCount: uploadedParts.length
      }).catch(() => undefined);
      return await uploadTasksApi.completeMultipart(taskId, {
        uploadId: multipart.uploadId,
        bucketName: multipart.bucketName,
        objectKey: multipart.objectKey,
        publicUrl: multipart.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        fileType,
        parts: uploadedParts.sort((a, b) => a.partNumber - b.partNumber).map(part => ({ partNumber: part.partNumber, etag: part.etag }))
      });
    } catch (error) {
      await uploadTasksApi.abortMultipart(taskId).catch(() => undefined);
      throw error;
    }
  },
  async presign(taskId: string | number, payload: Omit<UploadTaskCreatePayload, 'packageId'>) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/presign`, payload);
    return unwrapResponse<UploadTaskPresignResponse>(res.data);
  },
  async reportProgress(taskId: string | number, progress: number, status = 'uploading', extra?: Partial<{
    uploadedBytes: number;
    totalBytes: number;
    speedBytesPerSecond: number;
    averageSpeedBytesPerSecond: number;
    partCount: number;
    completedPartCount: number;
  }>) {
    const res = await rootClient.patch(`/upload-tasks/${taskId}/progress`, { progress, status, ...extra }, { silent: true });
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
