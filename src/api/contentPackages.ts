import { mockContentPackages } from '@/mock/mediaFlowApi';

export type ContentPackageTab = 'mine' | 'draft' | 'record' | 'recycle';
export interface ContentPackageQuery { pageNum?: number; pageSize?: number; keyword?: string; operatorId?: string; status?: string; tab?: ContentPackageTab; }
export interface ContentPackagePayload { topicName: string; operatorId: string; [key: string]: unknown; }

export const contentPackagesApi = {
  list: (params: ContentPackageQuery) => mockContentPackages.list(params),
  create: (payload: ContentPackagePayload) => mockContentPackages.create(payload),
  detail: (id: string) => mockContentPackages.detail(id),
  update: (id: string, payload: ContentPackagePayload) => mockContentPackages.update(id, payload),
  remove: (id: string) => mockContentPackages.remove(id),
  uploadFiles: (id: string, formData: FormData) => mockContentPackages.uploadFiles(id, formData)
};
