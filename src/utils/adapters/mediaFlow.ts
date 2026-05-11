import type { Role } from '@/types';
import type { AssetFile, AssetFileType, ContentPackage, ContentPackageStatus, Lead, LeadStatus, OperatorProfile, Task, TaskRoleType, TaskStatus, TaskType, UploadStatus } from '@/types/mediaFlow';

const stringValue = (...values: unknown[]) => values.find(v => v !== undefined && v !== null && v !== '')?.toString() || '';
const numberValue = (...values: unknown[]) => Number(values.find(v => v !== undefined && v !== null) ?? 0);

const normalizeRole = (role?: string, fallback: Role = 'OPERATOR'): Role => {
  const value = (role || fallback).toUpperCase();
  return (['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT'].includes(value) ? value : fallback) as Role;
};

export function normalizeAuthUser(dto: any, fallbackRole: Role = 'OPERATOR') {
  const user = dto?.user || dto || {};
  return {
    token: stringValue(dto?.token, dto?.accessToken, dto?.access_token, dto?.jwt),
    id: stringValue(user?.id, user?.userId, dto?.id, dto?.userId),
    role: normalizeRole(stringValue(user?.role, dto?.role), fallbackRole),
    userName: stringValue(user?.userName, user?.username, user?.name, dto?.userName, dto?.username, '用户'),
    department: stringValue(user?.department, user?.deptName, dto?.department)
  };
}

function folderFromDto(dto: any) {
  const createdAt = stringValue(dto?.createdAt, dto?.createTime, dto?.createdTime);
  const date = createdAt ? new Date(createdAt.replace(/-/g, '/')) : new Date();
  const folder = dto?.folderPath || dto?.folder || {};
  return {
    operatorId: stringValue(folder?.operatorId, dto?.operatorId),
    operatorName: stringValue(folder?.operatorName, dto?.operatorName),
    year: numberValue(folder?.year, dto?.year, date.getFullYear()),
    month: numberValue(folder?.month, dto?.month, date.getMonth() + 1),
    day: numberValue(folder?.day, dto?.day, date.getDate()),
    topicName: stringValue(folder?.topicName, dto?.topicName, dto?.name, dto?.title)
  };
}

export function adaptContentPackage(dto: any): ContentPackage {
  const folderPath = folderFromDto(dto);
  return {
    id: stringValue(dto?.id, dto?.packageId),
    topicName: stringValue(dto?.topicName, dto?.name, dto?.title),
    operatorId: stringValue(dto?.operatorId, dto?.operator?.id, folderPath.operatorId),
    operatorName: stringValue(dto?.operatorName, dto?.operator?.name, folderPath.operatorName),
    folderPath,
    coverUrl: stringValue(dto?.coverUrl, dto?.cover, dto?.thumbnailUrl),
    scriptCount: numberValue(dto?.scriptCount, dto?.scriptsCount),
    videoCount: numberValue(dto?.videoCount, dto?.videosCount),
    imageCount: numberValue(dto?.imageCount, dto?.imagesCount),
    uploadStatus: stringValue(dto?.uploadStatus, dto?.status, 'pending_upload') as ContentPackageStatus,
    createdBy: stringValue(dto?.createdBy, dto?.creatorName, dto?.mediaName),
    createdAt: stringValue(dto?.createdAt, dto?.createTime, dto?.createdTime)
  };
}

export function adaptAssetFile(dto: any): AssetFile {
  return {
    id: stringValue(dto?.id, dto?.assetId, dto?.fileId),
    packageId: stringValue(dto?.packageId, dto?.contentPackageId, dto?.relatedPackageId),
    fileName: stringValue(dto?.fileName, dto?.name, dto?.originalName),
    fileType: stringValue(dto?.fileType, dto?.type, 'script') as AssetFileType,
    mimeType: stringValue(dto?.mimeType, dto?.contentType),
    fileSize: numberValue(dto?.fileSize, dto?.size),
    thumbnailUrl: stringValue(dto?.thumbnailUrl, dto?.thumbUrl) || undefined,
    previewUrl: stringValue(dto?.previewUrl, dto?.url) || undefined,
    uploadStatus: stringValue(dto?.uploadStatus, dto?.status, 'success') as UploadStatus,
    sortOrder: numberValue(dto?.sortOrder, dto?.order, 0)
  };
}

export function adaptOperator(dto: any): OperatorProfile {
  return {
    id: stringValue(dto?.id, dto?.operatorId, dto?.value),
    name: stringValue(dto?.name, dto?.operatorName, dto?.label),
    department: stringValue(dto?.department, dto?.deptName, '运营部')
  };
}

export function adaptLead(dto: any): Lead {
  return {
    id: stringValue(dto?.id, dto?.leadId),
    sourceType: stringValue(dto?.sourceType, 'content_package') as Lead['sourceType'],
    relatedPackageId: stringValue(dto?.relatedPackageId, dto?.packageId, dto?.contentPackageId),
    operatorId: stringValue(dto?.operatorId),
    leadNo: stringValue(dto?.leadNo, dto?.no, dto?.code),
    studentName: stringValue(dto?.studentName, dto?.name),
    phone: stringValue(dto?.phone, dto?.mobile),
    wechat: stringValue(dto?.wechat, dto?.wechatNo),
    sourceChannel: stringValue(dto?.sourceChannel, dto?.channel),
    targetCountry: stringValue(dto?.targetCountry, dto?.intentCountry),
    targetMajor: stringValue(dto?.targetMajor, dto?.intentMajor),
    budget: stringValue(dto?.budget),
    degreeLevel: stringValue(dto?.degreeLevel, dto?.degree),
    status: stringValue(dto?.status, 'unassigned') as LeadStatus,
    assignedTo: stringValue(dto?.assignedTo, dto?.assigneeId),
    assignedToName: stringValue(dto?.assignedToName, dto?.assigneeName),
    createdAt: stringValue(dto?.createdAt, dto?.createTime),
    updatedAt: stringValue(dto?.updatedAt, dto?.updateTime),
    remark: stringValue(dto?.remark, dto?.notes) || undefined
  };
}

export function adaptTask(dto: any, fallbackRoleType?: TaskRoleType): Task {
  return {
    id: stringValue(dto?.id, dto?.taskId),
    taskType: stringValue(dto?.taskType, dto?.type, fallbackRoleType === 'media' ? 'media_upload' : 'operator_lead_generate') as TaskType,
    roleType: stringValue(dto?.roleType, fallbackRoleType || 'operator') as TaskRoleType,
    relatedPackageId: stringValue(dto?.relatedPackageId, dto?.packageId, dto?.contentPackageId),
    relatedLeadId: stringValue(dto?.relatedLeadId, dto?.leadId) || undefined,
    assigneeId: stringValue(dto?.assigneeId, dto?.assignee?.id),
    assigneeName: stringValue(dto?.assigneeName, dto?.assignee?.name),
    status: stringValue(dto?.status, 'pending') as TaskStatus,
    progress: numberValue(dto?.progress, dto?.percent),
    errorMessage: stringValue(dto?.errorMessage, dto?.error) || undefined,
    createdAt: stringValue(dto?.createdAt, dto?.createTime),
    completedAt: stringValue(dto?.completedAt, dto?.finishTime) || undefined
  };
}

export function adaptReportMetrics(dto: any) {
  return {
    scriptCount: numberValue(dto?.scriptCount, dto?.scripts, dto?.scriptTotal),
    videoCount: numberValue(dto?.videoCount, dto?.videos, dto?.videoTotal),
    imageCount: numberValue(dto?.imageCount, dto?.images, dto?.imageTotal),
    weekPackageCount: numberValue(dto?.weekPackageCount, dto?.weeklyPackages, dto?.thisWeekPackages),
    monthPackageCount: numberValue(dto?.monthPackageCount, dto?.monthlyPackages, dto?.thisMonthPackages),
    totalLeads: numberValue(dto?.totalLeads, dto?.leadTotal, dto?.total),
    todayNew: numberValue(dto?.todayNew, dto?.todayLeads),
    weekNew: numberValue(dto?.weekNew, dto?.weeklyLeads),
    unassigned: numberValue(dto?.unassigned, dto?.unassignedCount),
    assigned: numberValue(dto?.assigned, dto?.assignedCount),
    completed: numberValue(dto?.completed, dto?.completedCount)
  };
}
