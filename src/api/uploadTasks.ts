import axios from 'axios';
import { API_ROOT_URL, rootClient, unwrapResponse } from './client';

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

export interface MultipartPartsResponse {
  taskId: string | number;
  bucketName: string;
  objectKey: string;
  uploadId: string;
  fileSize?: number;
  partSize: number;
  partCount: number;
  completedPartCount: number;
  uploadedBytes: number;
  parts: Array<{ partNumber: number; etag: string; size: number }>;
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
interface MultipartSession extends MultipartCreateResponse {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: UploadTaskFileType;
  createdAt: number;
}

const DEFAULT_PART_SIZE = 10 * 1024 * 1024;
const DEFAULT_CONCURRENCY = 3;
const SESSION_PREFIX = 'ioas.multipart.session.';

function sessionKey(taskId: string | number) {
  return `${SESSION_PREFIX}${taskId}`;
}

function saveSession(session: MultipartSession) {
  localStorage.setItem(sessionKey(session.taskId), JSON.stringify(session));
}

function loadSession(taskId: string | number): MultipartSession | undefined {
  const raw = localStorage.getItem(sessionKey(taskId));
  if (!raw) return undefined;
  try { return JSON.parse(raw) as MultipartSession; } catch { return undefined; }
}

function clearSession(taskId: string | number) {
  localStorage.removeItem(sessionKey(taskId));
}

function assertSameFile(session: Pick<MultipartSession, 'fileName' | 'fileSize'>, file: File) {
  if (session.fileName && session.fileName !== file.name) throw new Error(`请选择同一个文件继续上传：${session.fileName}`);
  if (session.fileSize && session.fileSize !== file.size) throw new Error('文件大小不一致，请选择原始文件继续上传');
}

function installBeforeUnloadInterrupt(taskId: string | number) {
  const handler = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_ROOT_URL}/upload-tasks/${taskId}/multipart/interrupt?message=${encodeURIComponent('页面关闭或刷新，上传中断，可恢复')}`, {
      method: 'POST',
      keepalive: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    }).catch(() => undefined);
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}

export const uploadTasksApi = {
  async create(payload: UploadTaskCreatePayload) {
    const res = await rootClient.post('/upload-tasks', payload);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async createMultipart(taskId: string | number, payload: Omit<UploadTaskCreatePayload, 'packageId'> & { partSize?: number }) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart`, payload);
    return unwrapResponse<MultipartCreateResponse>(res.data);
  },
  async listMultipartParts(taskId: string | number) {
    const res = await rootClient.get(`/upload-tasks/${taskId}/multipart/parts`, { silent: true });
    return unwrapResponse<MultipartPartsResponse>(res.data);
  },
  async interruptMultipart(taskId: string | number, message?: string) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/interrupt`, null, { params: { message }, silent: true });
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async signMultipartPart(taskId: string | number, payload: { uploadId: string; bucketName: string; objectKey: string; partNumber: number }) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/sign-part`, payload, { silent: true });
    return unwrapResponse<MultipartSignPartResponse>(res.data);
  },
  async completeMultipart(taskId: string | number, payload: {
    uploadId: string;
    bucketName: string;
    objectKey: string;
    publicUrl?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: UploadTaskFileType;
    parts: Array<{ partNumber: number; etag: string }>;
  }) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/complete`, payload);
    clearSession(taskId);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async abortMultipart(taskId: string | number) {
    const res = await rootClient.post(`/upload-tasks/${taskId}/multipart/abort`);
    clearSession(taskId);
    return unwrapResponse<UploadTaskResponse>(res.data);
  },
  async uploadFile(taskId: string | number, file: File, fileType: UploadTaskFileType, onProgress?: (info: UploadProgressInfo) => void) {
    return uploadTasksApi.uploadMultipartFile(taskId, file, fileType, onProgress);
  },
  async uploadMultipartFile(taskId: string | number, file: File, fileType: UploadTaskFileType, onProgress?: (info: UploadProgressInfo) => void) {
    const mimeType = file.type || 'application/octet-stream';
    const multipart = await uploadTasksApi.createMultipart(taskId, {
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      fileType,
      partSize: DEFAULT_PART_SIZE
    });
    saveSession({ ...multipart, fileName: file.name, fileSize: file.size, mimeType, fileType, createdAt: Date.now() });
    return uploadTasksApi.runMultipartTransfer(taskId, file, fileType, multipart, [], onProgress);
  },
  async resumeMultipartFile(taskId: string | number, file: File, fileType?: UploadTaskFileType, onProgress?: (info: UploadProgressInfo) => void) {
    const session = loadSession(taskId);
    const remoteParts = await uploadTasksApi.listMultipartParts(taskId);
    if (session) assertSameFile(session, file);
    if (remoteParts.fileSize && remoteParts.fileSize !== file.size) throw new Error('文件大小与任务记录不一致，请选择原始文件继续上传');

    const mimeType = file.type || session?.mimeType || 'application/octet-stream';
    const actualFileType = fileType || session?.fileType || inferUploadTaskFileType(file);
    const multipart: MultipartCreateResponse = {
      taskId,
      bucketName: remoteParts.bucketName,
      objectKey: remoteParts.objectKey,
      uploadId: remoteParts.uploadId,
      publicUrl: session?.publicUrl || '',
      partSize: remoteParts.partSize || session?.partSize || DEFAULT_PART_SIZE,
      partCount: remoteParts.partCount || session?.partCount || Math.ceil(file.size / (remoteParts.partSize || DEFAULT_PART_SIZE))
    };
    saveSession({ ...multipart, fileName: file.name, fileSize: file.size, mimeType, fileType: actualFileType, createdAt: session?.createdAt || Date.now() });
    const completed = (remoteParts.parts || []).map(part => ({ partNumber: part.partNumber, etag: part.etag, size: part.size }));
    return uploadTasksApi.runMultipartTransfer(taskId, file, actualFileType, multipart, completed, onProgress);
  },
  async runMultipartTransfer(taskId: string | number, file: File, fileType: UploadTaskFileType, multipart: MultipartCreateResponse, completedParts: UploadedPart[], onProgress?: (info: UploadProgressInfo) => void) {
    const mimeType = file.type || 'application/octet-stream';
    const startedAt = Date.now();
    const removeBeforeUnload = installBeforeUnloadInterrupt(taskId);
    const partSize = multipart.partSize || DEFAULT_PART_SIZE;
    const partCount = multipart.partCount || Math.ceil(file.size / partSize);
    const uploadedParts: UploadedPart[] = [...completedParts];
    const completedPartNumbers = new Set(uploadedParts.map(part => part.partNumber));
    const partLoaded = new Map<number, number>();
    uploadedParts.forEach(part => partLoaded.set(part.partNumber, part.size));
    let nextPartNumber = 1;
    let lastReportTime = 0;
    let lastReportPercent = -1;

    const report = async (force = false) => {
      const uploadedBytes = Math.min(file.size, [...partLoaded.values()].reduce((sum, value) => sum + value, 0));
      const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.001);
      const avgSpeed = Math.max((uploadedBytes - completedParts.reduce((sum, part) => sum + part.size, 0)) / elapsed, 0);
      const percent = file.size ? Math.min(94, Math.max(1, Math.round((uploadedBytes / file.size) * 94))) : 1;
      const now = Date.now();
      onProgress?.({ loaded: uploadedBytes, total: file.size, percent, speed: avgSpeed, avgSpeed, partCount, completedPartCount: uploadedParts.length });
      if (force || (percent !== lastReportPercent && (now - lastReportTime > 1000 || percent >= 90))) {
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
        if (completedPartNumbers.has(partNumber)) continue;
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);
        const signed = await uploadTasksApi.signMultipartPart(taskId, { uploadId: multipart.uploadId, bucketName: multipart.bucketName, objectKey: multipart.objectKey, partNumber });
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
        completedPartNumbers.add(partNumber);
        await report(true);
      }
    };

    try {
      await report(true);
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
      const result = await uploadTasksApi.completeMultipart(taskId, {
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
      clearSession(taskId);
      return result;
    } catch (error) {
      await uploadTasksApi.interruptMultipart(taskId, error instanceof Error ? error.message : '上传中断，可稍后恢复').catch(() => undefined);
      throw error;
    } finally {
      removeBeforeUnload();
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
