import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = [
  'SUPER_ADMIN',
  'MEDIA',
  'OPERATOR',
  'CONSULTANT',
  'DATA',
  'ANCHOR',
  'ADMINISTRATIVE'
];

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
  CONSULTANT: '/students/list',
  DATA: '/data-ops/operation-data',
  ANCHOR: '/data-ops/operation-data',
  ADMINISTRATIVE: '/dashboard'
};

export const rolePageMatrix: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],
  MEDIA: ['/media/*', '/profile/settings', '/tasks'],
  OPERATOR: ['/operator/*', '/students/*', '/profile/settings', '/tasks'],
  CONSULTANT: ['/students/*', '/profile/settings', '/tasks'],
  DATA: ['/data-ops/*', '/profile/settings', '/tasks'],
  ANCHOR: ['/data-ops/operation-data', '/profile/settings', '/tasks'],
  ADMINISTRATIVE: ['/dashboard', '/profile/settings', '/tasks']
};

export const roleButtonMatrix: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],
  MEDIA: ['view', 'upload', 'file', 'log'],
  OPERATOR: ['view', 'create', 'edit', 'assign', 'follow', 'file', 'log'],
  CONSULTANT: ['view', 'follow', 'file', 'log'],
  DATA: [
    'view',
    'upload',
    'uploadCover',
    'uploadScreenshot',
    'confirmDataContent',
    'downloadReport',
    'file',
    'log'
  ],
  ANCHOR: [
    'view',
    'upload',
    'uploadCover',
    'uploadScreenshot',
    'confirmDataContent',
    'downloadReport',
    'file',
    'log'
  ],
  ADMINISTRATIVE: ['view', 'file', 'log']
};

export const getDefaultRoute = (role: Role) => defaultRouteByRole[role];

export const canAccessPage = (role: Role, pathname: string) => {
  const allowed = rolePageMatrix[role] || [];
  if (allowed.includes('*')) return true;

  return allowed.some(pattern => {
    if (pattern === pathname) return true;
    return Boolean(matchPath({ path: pattern, end: false }, pathname));
  });
};

export const canUseButton = (role: Role, action: string) => {
  const allowed = roleButtonMatrix[role] || [];
  return allowed.includes('*') || allowed.includes(action);
};