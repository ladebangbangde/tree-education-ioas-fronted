import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ANCHOR', 'ADMINISTRATIVE'];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MEDIA: 'Media',
  OPERATOR: 'Operator',
  CONSULTANT: 'Consultant',
  DATA: 'Data Operator',
  ANCHOR: '主播',
  ADMINISTRATIVE: 'Administrative'
};

export const defaultRouteByRole: Record<Role, string> = {
  SUPER_ADMIN: '/settings/users',
  MEDIA: '/media/content',
  OPERATOR: '/operator/leads',
  CONSULTANT