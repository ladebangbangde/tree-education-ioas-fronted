import { assetFiles, contentPackages, mediaFlowLeads, mediaFlowTasks, operatorProfiles } from '@/mock/mediaFlow';
import type { AssetFile, AssetFileType, ContentPackage, Lead, OperatorProfile, Task } from '@/types/mediaFlow';
import type { PageResult } from '@/types/api';
import type { Role } from '@/types';

const wait = <T,>(value: T, delay = 120) => new Promise<T>(resolve => window.setTimeout(() => resolve(value), delay));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

let packagesStore: ContentPackage[] = clone(contentPackages);
let assetsStore: AssetFile[] = clone(assetFiles);
let recycleStore: AssetFile[] = [];
let leadsStore: Lead[] = clone(mediaFlowLeads);
let tasksStore: Task[] = clone(mediaFlowTasks);

const now = () => '2026-05-11 10:00';
const toPage = <T,>(records: T[], pageNum = 1, pageSize = records.length || 20): PageResult<T> => ({ records: clone(records).slice((pageNum - 1) * pageSize, pageNum * pageSize), total: records.length, pageNum, pageSize });
const includesText = (value: string | undefined, keyword?: string) => !keyword || (value || '').toLowerCase().includes(keyword.toLowerCase());
const operatorById = (operatorId: string): OperatorProfile => operatorProfiles.find(item => item.id === operatorId) || operatorProfiles[0];

function syncPackageCounts(packageId: string) {
  const pkg = packagesStore.find(item => item.id === packageId);
  if (!pkg) return;
  const files = assetsStore.filter(item => item.packageId === packageId);
  pkg.scriptCount = files.filter(item => item.fileType === 'script').length;
  pkg.videoCount = files.filter(item => item.fileType === 'video').length;
  pkg.imageCount = files.filter(item => item.fileType === 'image').length;
  pkg.uploadStatus = files.length === 0 ? 'pending_upload' : files.every(item => item.uploadStatus === 'success') ? 'completed' : 'partial_completed';
}

const fileMeta: Record<AssetFileType, { mimeType: string; suffix: string; size: number; previewUrl: string; thumbnailUrl?: string }> = {
  script: { mimeType: 'text/plain', suffix: 'txt', size: 28000, previewUrl: '演示版本地 mock 上传的脚本摘要，可用于前端完整链路展示。' },
  video: { mimeType: 'video/mp4', suffix: 'mp4', size: 86800000, previewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=360&q=80' },
  image: { mimeType: 'image/jpeg', suffix: 'jpg', size: 1900000, previewUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=360&q=80' }
};

function filesFromFormData(packageId: string, formData: FormData): AssetFile[] {
  const created: AssetFile[] = [];
  const fields: Array<[string, AssetFileType]> = [['scripts', 'script'], ['videos', 'video'], ['images', 'image']];
  fields.forEach(([field, fileType]) => {
    const values = formData.getAll(field);
    const count = values.length || (formData.has(field) ? 1 : 0);
    Array.from({ length: count }).forEach((_, index) => {
      const file = values[index] as File | undefined;
      const meta = fileMeta[fileType];
      created.push({
        id: `AST-MOCK-${Date.now()}-${created.length}`,
        packageId,
        fileName: file?.name || `演示上传${fileType}-${index + 1}.${meta.suffix}`,
        fileType,
        mimeType: file?.type || meta.mimeType,
        fileSize: file?.size || meta.size,
        previewUrl: meta.previewUrl,
        thumbnailUrl: meta.thumbnailUrl,
        uploadStatus: 'success',
        sortOrder: assetsStore.filter(item => item.packageId === packageId && item.fileType === fileType).length + index + 1
      });
    });
  });
  return created;
}

export const mockAuth = {
  async login(username: string) {
    const account = username?.toLowerCase?.() || '';
    const role: Role = account.includes('admin') || account.includes('super') ? 'SUPER_ADMIN' : account.includes('media') ? 'MEDIA' : account.includes('consult') || account.includes('advisor') ? 'CONSULTANT' : 'OPERATOR';
    const labelByRole: Record<Role, string> = { SUPER_ADMIN: '超管演示账号', MEDIA: '媒体演示账号', OPERATOR: '运营演示账号', CONSULTANT: '顾问演示账号' };
    return wait({ token: `mock-token-${role.toLowerCase()}`, role, userName: labelByRole[role], username: labelByRole[role], department: role === 'SUPER_ADMIN' ? '系统管理部' : role === 'MEDIA' ? '媒体部' : role === 'CONSULTANT' ? '咨询中心' : '运营部', id: `mock-${role}` });
  },
  async me() {
    const role = (localStorage.getItem('role') as Role) || 'OPERATOR';
    const userName = localStorage.getItem('userName') || '演示用户';
    return wait({ id: localStorage.getItem('userId') || `mock-${role}`, username: userName, userName, role, department: localStorage.getItem('department') || '演示部门' });
  }
};

export const mockOperators = {
  options: () => wait(clone(operatorProfiles)),
  list: (params?: { name?: string; pageNum?: number; pageSize?: number }) => wait(toPage(operatorProfiles.filter(item => includesText(item.name, params?.name)), params?.pageNum, params?.pageSize))
};

export const mockContentPackages = {
  list: (params?: { pageNum?: number; pageSize?: number; keyword?: string; operatorId?: string; status?: string; tab?: string }) => {
    let records = packagesStore.filter(item => item.uploadStatus !== 'deleted');
    if (params?.tab === 'draft') records = records.filter(item => item.uploadStatus === 'pending_upload');
    if (params?.operatorId) records = records.filter(item => item.operatorId === params.operatorId);
    if (params?.status) records = records.filter(item => item.uploadStatus === params.status);
    if (params?.keyword) records = records.filter(item => includesText(item.topicName, params.keyword) || includesText(item.operatorName, params.keyword));
    return wait(toPage(records, params?.pageNum, params?.pageSize));
  },
  create: (payload: { topicName: string; operatorId: string }) => {
    const operator = operatorById(payload.operatorId);
    const item: ContentPackage = { id: `PKG-MOCK-${Date.now()}`, topicName: payload.topicName, operatorId: operator.id, operatorName: operator.name, folderPath: { operatorId: operator.id, operatorName: operator.name, year: 2026, month: 5, day: 11, topicName: payload.topicName }, coverUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=480&q=80', scriptCount: 0, videoCount: 0, imageCount: 0, uploadStatus: 'pending_upload', createdBy: '演示媒体账号', createdAt: now() };
    packagesStore.unshift(item);
    tasksStore.unshift({ id: `T-MOCK-M-${Date.now()}`, taskType: 'media_upload', roleType: 'media', relatedPackageId: item.id, assigneeId: 'MEDIA01', assigneeName: '媒体演示账号', status: 'pending_supplement', progress: 0, createdAt: now() });
    return wait(clone(item));
  },
  detail: (id: string) => wait(clone(packagesStore.find(item => item.id === id) || packagesStore[0])),
  update: (id: string, payload: { topicName: string; operatorId: string }) => {
    const item = packagesStore.find(pkg => pkg.id === id);
    if (item) {
      const operator = operatorById(payload.operatorId);
      item.topicName = payload.topicName;
      item.operatorId = operator.id;
      item.operatorName = operator.name;
      item.folderPath = { ...item.folderPath, operatorId: operator.id, operatorName: operator.name, topicName: payload.topicName };
    }
    return wait(clone(item));
  },
  remove: (id: string) => {
    const removedFiles = assetsStore.filter(item => item.packageId === id).map(item => ({ ...item, uploadStatus: 'failed' as const }));
    recycleStore.unshift(...removedFiles);
    assetsStore = assetsStore.filter(item => item.packageId !== id);
    packagesStore = packagesStore.map(item => item.id === id ? { ...item, uploadStatus: 'deleted' } : item);
    return wait({ id });
  },
  uploadFiles: (id: string, formData: FormData) => {
    const created = filesFromFormData(id, formData);
    assetsStore.unshift(...created);
    syncPackageCounts(id);
    const task = tasksStore.find(item => item.relatedPackageId === id && item.roleType === 'media');
    if (task) Object.assign(task, { status: 'success', progress: 100, completedAt: now(), errorMessage: undefined });
    return wait(created);
  }
};

export const mockAssets = {
  list: (params?: { packageId?: string; fileType?: string; pageNum?: number; pageSize?: number }) => {
    let records = assetsStore;
    if (params?.packageId) records = records.filter(item => item.packageId === params.packageId);
    if (params?.fileType && params.fileType !== 'all') records = records.filter(item => item.fileType === params.fileType);
    return wait(toPage(records, params?.pageNum, params?.pageSize));
  },
  detail: (id: string) => wait(clone(assetsStore.find(item => item.id === id) || recycleStore.find(item => item.id === id))),
  remove: (id: string) => {
    const file = assetsStore.find(item => item.id === id);
    if (file) recycleStore.unshift(file);
    assetsStore = assetsStore.filter(item => item.id !== id);
    if (file) syncPackageCounts(file.packageId);
    return wait({ id });
  },
  download: (id: string) => wait({ data: new Blob([`mock file ${id}`], { type: 'text/plain' }), status: 200 }),
  preview: (id: string) => wait(clone(assetsStore.find(item => item.id === id))),
  recycleBin: (params?: { keyword?: string; fileType?: string; packageId?: string; operatorId?: string; pageNum?: number; pageSize?: number }) => {
    let records = recycleStore;
    if (params?.keyword) records = records.filter(item => includesText(item.fileName, params.keyword));
    if (params?.fileType) records = records.filter(item => item.fileType === params.fileType);
    if (params?.packageId) records = records.filter(item => item.packageId === params.packageId);
    if (params?.operatorId) records = records.filter(item => packagesStore.find(pkg => pkg.id === item.packageId)?.operatorId === params.operatorId);
    return wait(toPage(records, params?.pageNum, params?.pageSize));
  },
  restore: (id: string) => {
    const file = recycleStore.find(item => item.id === id);
    if (file) assetsStore.unshift(file);
    recycleStore = recycleStore.filter(item => item.id !== id);
    if (file) syncPackageCounts(file.packageId);
    return wait(clone(file));
  },
  purge: (id: string) => { recycleStore = recycleStore.filter(item => item.id !== id); return wait({ id }); }
};

export const mockLeads = {
  list: (params?: { tab?: string; keyword?: string; relatedPackageId?: string; operatorId?: string; pageNum?: number; pageSize?: number }) => {
    let records = leadsStore;
    if (params?.tab === 'unassigned') records = records.filter(item => item.status === 'unassigned');
    if (params?.tab === 'assigned') records = records.filter(item => item.status !== 'unassigned');
    if (params?.relatedPackageId) records = records.filter(item => item.relatedPackageId === params.relatedPackageId);
    if (params?.operatorId) records = records.filter(item => item.operatorId === params.operatorId);
    if (params?.keyword) records = records.filter(item => [item.leadNo, item.studentName, item.phone].some(value => includesText(value, params.keyword)));
    return wait(toPage(records, params?.pageNum, params?.pageSize));
  },
  create: (payload: Partial<Lead>) => {
    const operator = operatorById(payload.operatorId || operatorProfiles[0].id);
    const item: Lead = { id: `LEAD-MOCK-${Date.now()}`, leadNo: `LD${Date.now().toString().slice(-8)}`, sourceType: payload.sourceType || 'content_package', relatedPackageId: payload.relatedPackageId || packagesStore[0]?.id || '', operatorId: operator.id, studentName: payload.studentName || '演示学生', phone: payload.phone || '13800000000', wechat: payload.wechat || 'mock_wechat', sourceChannel: payload.sourceChannel || '小红书', targetCountry: payload.targetCountry || '英国', targetMajor: payload.targetMajor || '商科', budget: payload.budget || '30-50万', degreeLevel: payload.degreeLevel || '本科升硕士', status: 'unassigned', assignedTo: '', assignedToName: '待分配', createdAt: now(), updatedAt: now(), remark: payload.remark || '演示版通过本地 mock 创建的线索。' };
    leadsStore.unshift(item);
    tasksStore.unshift({ id: `T-MOCK-O-${Date.now()}`, taskType: 'operator_lead_generate', roleType: 'operator', relatedPackageId: item.relatedPackageId, relatedLeadId: item.leadNo, assigneeId: operator.id, assigneeName: operator.name, status: 'completed', progress: 100, createdAt: now(), completedAt: now() });
    return wait(clone(item));
  },
  detail: (id: string) => wait(clone(leadsStore.find(item => item.id === id) || leadsStore[0])),
  update: (id: string, payload: Partial<Lead>) => { const item = leadsStore.find(lead => lead.id === id); if (item) Object.assign(item, payload, { updatedAt: now() }); return wait(clone(item)); },
  updateStatus: (id: string, payload: { status: Lead['status'] }) => mockLeads.update(id, { status: payload.status })
};

export const mockTasks = {
  media: () => wait(clone(tasksStore.filter(item => item.roleType === 'media'))),
  operator: () => wait(clone(tasksStore.filter(item => item.roleType === 'operator'))),
  update: (id: string, payload: Record<string, unknown>) => {
    const task = tasksStore.find(item => item.id === id);
    if (task) Object.assign(task, payload.action === 'retry' || payload.action === 'process' ? { status: 'completed', progress: 100, completedAt: now(), errorMessage: undefined } : payload);
    return wait(clone(task));
  }
};

export const mockReports = {
  mediaOutput: () => wait({ scriptCount: assetsStore.filter(item => item.fileType === 'script').length, videoCount: assetsStore.filter(item => item.fileType === 'video').length, imageCount: assetsStore.filter(item => item.fileType === 'image').length, weekPackageCount: packagesStore.length, monthPackageCount: packagesStore.length }),
  operatorLeads: () => wait({ totalLeads: leadsStore.length, todayNew: 2, weekNew: leadsStore.length, unassigned: leadsStore.filter(item => item.status === 'unassigned').length, assigned: leadsStore.filter(item => item.status === 'assigned' || item.status === 'following').length, completed: leadsStore.filter(item => item.status === 'completed').length }),
  operatorByPackage: () => wait(packagesStore.map(pkg => ({ topicName: pkg.topicName, count: leadsStore.filter(item => item.relatedPackageId === pkg.id).length })).filter(item => item.count > 0)),
  operatorTrend: () => wait([{ date: '05-06', count: 1 }, { date: '05-07', count: 2 }, { date: '05-08', count: 3 }, { date: '05-09', count: 2 }, { date: '05-10', count: 4 }, { date: '05-11', count: leadsStore.length }])
};

export const mockResources = {
  tree: () => wait(operatorProfiles.map(op => ({ key: op.id, title: op.name, children: packagesStore.filter(pkg => pkg.operatorId === op.id).map(pkg => ({ key: pkg.id, title: pkg.topicName })) }))),
  packages: (params?: { keyword?: string; operatorId?: string; pageNum?: number; pageSize?: number }) => mockContentPackages.list(params)
};
