import { inferUploadTaskFileType, uploadTasksApi, type UploadProgressInfo, type UploadTaskFileType } from '@/api/uploadTasks';

export type GlobalUploadStatus = 'queued' | 'uploading' | 'processing' | 'success' | 'failed' | 'cancelled' | 'interrupted' | 'paused';

export interface GlobalUploadItem {
  id: string;
  taskId?: string | number;
  packageId: string | number;
  file: File;
  fileName: string;
  fileSize: number;
  fileType: UploadTaskFileType;
  mimeType: string;
  status: GlobalUploadStatus;
  progress: number;
  loaded: number;
  total: number;
  speed: number;
  avgSpeed: number;
  partCount?: number;
  completedPartCount?: number;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

type Listener = (items: GlobalUploadItem[]) => void;

class UploadManager {
  private items = new Map<string, GlobalUploadItem>();
  private listeners = new Set<Listener>();
  private running = new Set<string>();
  private maxConcurrentTasks = 2;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return [...this.items.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  enqueue(packageId: string | number, file: File, fileType?: UploadTaskFileType) {
    const id = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const actualFileType = fileType || inferUploadTaskFileType(file);
    const item: GlobalUploadItem = {
      id,
      packageId,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: actualFileType,
      mimeType: file.type || 'application/octet-stream',
      status: 'queued',
      progress: 0,
      loaded: 0,
      total: file.size,
      speed: 0,
      avgSpeed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.items.set(id, item);
    this.emit();
    this.pump();
    return id;
  }

  enqueueMany(packageId: string | number, files: Array<{ file: File; fileType?: UploadTaskFileType }>) {
    return files.map(item => this.enqueue(packageId, item.file, item.fileType));
  }

  pause(id: string) {
    const item = this.items.get(id);
    if (!item || !['uploading', 'queued'].includes(item.status)) return;
    if (item.taskId) {
      uploadTasksApi.cancelActiveUpload(item.taskId);
      uploadTasksApi.interruptMultipart(item.taskId, '用户暂停上传，可继续上传').catch(() => undefined);
    }
    this.running.delete(id);
    this.patch(id, { status: 'paused', errorMessage: '用户暂停上传，可继续上传' });
    this.pump();
  }

  resume(id: string) {
    const item = this.items.get(id);
    if (!item || !['paused', 'interrupted', 'failed'].includes(item.status)) return;
    this.patch(id, { status: 'queued', errorMessage: undefined });
    this.pump();
  }

  cancel(id: string) {
    const item = this.items.get(id);
    if (!item || ['success', 'cancelled'].includes(item.status)) return;
    if (item.taskId) {
      uploadTasksApi.cancelActiveUpload(item.taskId);
      uploadTasksApi.abortMultipart(item.taskId).catch(() => undefined);
    }
    this.running.delete(id);
    this.patch(id, { status: 'cancelled', progress: 100, errorMessage: '用户取消上传' });
    this.pump();
  }

  remove(id: string) {
    const item = this.items.get(id);
    if (!item) return;
    if (['queued', 'uploading', 'processing'].includes(item.status)) return;
    this.items.delete(id);
    this.emit();
  }

  clearTerminal() {
    [...this.items.values()].forEach(item => {
      if (['success', 'failed', 'cancelled'].includes(item.status)) this.items.delete(item.id);
    });
    this.emit();
  }

  private pump() {
    while (this.running.size < this.maxConcurrentTasks) {
      const next = this.snapshot().reverse().find(item => item.status === 'queued' && !this.running.has(item.id));
      if (!next) break;
      this.running.add(next.id);
      this.run(next.id).finally(() => {
        this.running.delete(next.id);
        this.pump();
      });
    }
  }

  private async run(id: string) {
    const item = this.items.get(id);
    if (!item) return;
    try {
      let taskId = item.taskId;
      if (!taskId) {
        this.patch(id, { status: 'uploading', progress: 0, errorMessage: undefined });
        const task = await uploadTasksApi.create({
          packageId: item.packageId,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          fileType: item.fileType
        });
        taskId = task.taskId;
        this.patch(id, { taskId, status: 'uploading' });
        await uploadTasksApi.uploadFile(taskId, item.file, item.fileType, info => this.applyProgress(id, info));
      } else {
        this.patch(id, { status: 'uploading', errorMessage: undefined });
        await uploadTasksApi.resumeMultipartFile(taskId, item.file, item.fileType, info => this.applyProgress(id, info));
      }
      this.patch(id, { status: 'success', progress: 100, loaded: item.fileSize, total: item.fileSize, speed: 0, updatedAt: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败';
      const latest = this.items.get(id);
      if (!latest) return;
      if (latest.status === 'paused' || latest.status === 'cancelled') return;
      const nextStatus: GlobalUploadStatus = message.includes('取消') ? 'cancelled' : 'interrupted';
      this.patch(id, { status: nextStatus, errorMessage: message, updatedAt: Date.now() });
      if (latest.taskId && nextStatus === 'interrupted') {
        await uploadTasksApi.interruptMultipart(latest.taskId, message).catch(() => undefined);
      }
    }
  }

  private applyProgress(id: string, info: UploadProgressInfo) {
    this.patch(id, {
      status: info.percent >= 95 ? 'processing' : 'uploading',
      progress: info.percent,
      loaded: info.loaded,
      total: info.total,
      speed: info.speed,
      avgSpeed: info.avgSpeed || info.speed,
      partCount: info.partCount,
      completedPartCount: info.completedPartCount
    });
  }

  private patch(id: string, patch: Partial<GlobalUploadItem>) {
    const item = this.items.get(id);
    if (!item) return;
    this.items.set(id, { ...item, ...patch, updatedAt: Date.now() });
    this.emit();
  }

  private emit() {
    const rows = this.snapshot();
    this.listeners.forEach(listener => listener(rows));
  }
}

export const uploadManager = new UploadManager();
