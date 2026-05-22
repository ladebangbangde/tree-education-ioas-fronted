const SESSION_PREFIX = 'ioas.multipart.session.';
const RECOVERABLE_STATUSES = new Set(['interrupted', 'failed']);

export interface UploadSessionTaskSnapshot {
  id?: string | number;
  status?: string;
  taskType?: string;
}

const sessionKey = (taskId: string | number) => `${SESSION_PREFIX}${taskId}`;

export function hasRecoverableUploadSession(taskId?: string | number) {
  if (taskId === undefined || taskId === null || taskId === '') return false;
  return Boolean(localStorage.getItem(sessionKey(taskId)));
}

export function removeRecoverableUploadSession(taskId?: string | number) {
  if (taskId === undefined || taskId === null || taskId === '') return;
  localStorage.removeItem(sessionKey(taskId));
}

export function pruneRecoverableUploadSessions(tasks: UploadSessionTaskSnapshot[]) {
  tasks.forEach(task => {
    if (!task?.id || !hasRecoverableUploadSession(task.id)) return;
    const isMediaUpload = !task.taskType || task.taskType === 'media_upload';
    const isRecoverable = isMediaUpload && RECOVERABLE_STATUSES.has(String(task.status || ''));
    if (!isRecoverable) removeRecoverableUploadSession(task.id);
  });
}
