import { mockTasks } from '@/mock/mediaFlowApi';

export const tasksApi = {
  media: () => mockTasks.media(),
  operator: () => mockTasks.operator(),
  update: (id: string, payload: Record<string, unknown>) => mockTasks.update(id, payload)
};
