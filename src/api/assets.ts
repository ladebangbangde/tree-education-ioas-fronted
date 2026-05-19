import { mockAssets } from '@/mock/mediaFlowApi';

export interface AssetQuery { packageId?: string; fileType?: 'all' | 'script' | 'video' | 'image' | string; pageNum?: number; pageSize?: number; }
export interface RecycleQuery { keyword?: string; fileType?: string; deletedBy?: string; packageId?: string; operatorId?: string; pageNum?: number; pageSize?: number; }

export const assetsApi = {
  list: (params?: AssetQuery) => mockAssets.list(params),
  detail: (id: string) => mockAssets.detail(id),
  remove: (id: string) => mockAssets.remove(id),
  download: (id: string) => mockAssets.download(id),
  preview: (id: string) => mockAssets.preview(id),
  recycleBin: (params?: RecycleQuery) => mockAssets.recycleBin(params),
  restore: (id: string) => mockAssets.restore(id),
  purge: (id: string) => mockAssets.purge(id)
};
