export type AssetFileType = 'script' | 'video' | 'image';
export type UploadStatus = 'uploading' | 'success' | 'failed' | 'partial_success' | 'pending_supplement';
export type ContentPackageStatus = 'pending_upload' | 'uploading' | 'partial_completed' | 'completed' | 'deleted';
export type TaskType = 'package_create' | 'media_upload' | 'operator_lead_generate';
export type TaskRoleType = 'media' | 'operator';
export type MediaTaskStatus = 'created' | 'processing' | 'uploading' | 'success' | 'failed' | 'cancelled' | 'partial_success' | 'pending_supplement';
export type OperatorTaskStatus = 'pending' | 'processing' | 'completed' | 'overdue' | 'rejected';
export type TaskStatus = MediaTaskStatus | OperatorTaskStatus;
export type LeadStatus = 'unassigned' | 'assigned' | 'following' | 'confirmed' | 'converted' | 'completed' | 'invalid' | 'closed';
export type SourceType = 'content_package' | 'official_website' | 'manual' | 'campaign';

export interface FolderPathNode {
  operatorId: string;
  operatorName: string;
  year: number;
  month: number;
  day: number;
  topicName: string;
}

export interface ContentPackage {
  id: string;
  topicName: string;
  operatorId: string;
  operatorName: string;
  folderPath: FolderPathNode;
  coverUrl: string;
  scriptCount: number;
  videoCount: number;
  imageCount: number;
  uploadStatus: ContentPackageStatus;
  createdBy: string;
  createdAt: string;
}

export interface AssetFile {
  id: string;
  packageId: string;
  fileName: string;
  fileType: AssetFileType;
  mimeType: string;
  fileSize: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  uploadStatus: UploadStatus;
  sortOrder: number;
}

export interface Task {
  id: string;
  title?: string;
  taskType: TaskType;
  roleType: TaskRoleType;
  relatedPackageId: string;
  topicName?: string;
  operatorId?: string;
  operatorName?: string;
  fullPath?: string;
  scriptCount?: number;
  videoCount?: number;
  imageCount?: number;
  fileTotal?: number;
  successCount?: number;
  failedCount?: number;
  relatedLeadId?: string;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  progress: number;
  errorMessage?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBytes?: number;
  speedBytesPerSecond?: number;
  averageSpeedBytesPerSecond?: number;
  partCount?: number;
  completedPartCount?: number;
  lastProgressAt?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  sourceType: SourceType;
  relatedPackageId: string;
  operatorId: string;
  leadNo: string;
  studentName: string;
  phone: string;
  wechat: string;
  sourceChannel: string;
  targetCountry: string;
  targetMajor: string;
  budget: string;
  degreeLevel: string;
  status: LeadStatus;
  assignedTo: string;
  assignedToName: string;
  convertedStudentId?: string;
  convertedAt?: string;
  convertedBy?: string;
  archived?: boolean;
  mutable?: boolean;
  createdAt: string;
  updatedAt: string;
  remark?: string;
}

export interface OperatorProfile {
  id: string;
  name: string;
  department: string;
}
