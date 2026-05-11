import { mockResources } from '@/mock/mediaFlowApi';

export const resourcesApi = {
  tree: () => mockResources.tree(),
  packages: (params?: { keyword?: string; operatorId?: string; pageNum?: number; pageSize?: number }) => mockResources.packages(params)
};
