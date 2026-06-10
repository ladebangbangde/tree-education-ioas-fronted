import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = [
  'SUPER_ADMIN',
  'MEDIA',
  'OPERATOR',
  'CONSULTANT',
  'DATA',
  'ANCHOR',
  'ADMINISTRATIVE',
];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: '超级管理员',
  MEDIA: '媒体',
  OPERATOR: '运营',
  CONSULTANT: '顾问',
  DATA: '数据',
  ANCHOR: '主播',
  ADMINISTRATIVE: '行政',
};

