import type { Role } from '@/types';

export const roles: Role[] = [
  'SUPER_ADMIN',
  'MEDIA',
  'OPERATOR',
  'CONSULTANT',
  'DATA',
  'ADMINISTRATIVE',
  'ANCHOR',
];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: '超级管理员',
  MEDIA: '媒体运营',
  OPERATOR: '运营人员',
  CONSULTANT: '顾问',
  DATA: '数据操作员',
  ADMINISTRATIVE: '行政人员',
  ANCHOR: '主播',
};

export type