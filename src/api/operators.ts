import { mockOperators } from '@/mock/mediaFlowApi';

export const operatorsApi = {
  options: () => mockOperators.options(),
  list: (params?: { name?: string; pageNum?: number; pageSize?: number }) => mockOperators.list(params)
};
