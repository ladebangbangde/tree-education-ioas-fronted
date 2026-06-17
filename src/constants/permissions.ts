import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export type ButtonAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'restore'
  | 'purge'
  | 'upload'
  | 'download'
  | 'preview'
  | 'assign'
  | 'follow'
  | 'confirm'
  | 'reject'
  | 'export'
  | 'import'
  | 'review'
  | 'publish'
  | 'unpublish'
  | 'manage'
  | 'view'
  | string;

export const roles: Role[] = [
  'SUPER_ADMIN',
  'MEDIA',
  'OPERATOR',
  'CONSULTANT',
  'DATA',
  'ADMINISTRATIVE',
  'ANCHOR',
  'IDLE_ANCHOR'
];

export const roleLabels = {
  SUPER_ADMIN: '系统超管',
  MEDIA: '媒体',
  OPERATOR: '运营',
  CONSULTANT: '顾问',
  DATA: '数据操作员',
  ADMINISTRATIVE: '行政',
  ANCHOR: '主播',
  IDLE_ANCHOR: '闲杂主播'
} as Record<Role, string>;

const routeRoles: Array<{ pattern: string; roles: Role[] }> = [
  { pattern: '/403', roles },
  { pattern: '/profile/settings', roles: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE', 'ANCHOR'] },
  { pattern: '/dashboard', roles: ['CONSULTANT', 'ADMINISTRATIVE'] },
  { pattern: '/media/content', roles: ['MEDIA'] },
  { pattern: '/media-assets', roles: ['MEDIA', 'OPERATOR'] },
  { pattern: '/operator/leads', roles: ['OPERATOR'] },
  { pattern: '/tasks', roles: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE'] },
  { pattern: '/reports', roles: ['MEDIA', 'OPERATOR'] },
  { pattern: '/data-ops/operation-data', roles: ['DATA'] },
  { pattern: '/data-ops/recognition-review', roles: ['DATA'] },
  { pattern: '/leads/list', roles: ['CONSULTANT'] },
  { pattern: '/leads/detail/:id', roles: ['CONSULTANT'] },
  { pattern: '/leads/assign', roles: ['CONSULTANT'] },
  { pattern: '/leads/follow', roles: ['CONSULTANT'] },
  { pattern: '/students/list', roles: ['CONSULTANT'] },
  { pattern: '/students/detail/:id', roles: ['CONSULTANT'] },
  { pattern: '/applications/kanban', roles: ['CONSULTANT'] },
  { pattern: '/applications/detail/:id', roles: ['CONSULTANT'] },
  { pattern: '/applications/stage/:stage', roles: ['CONSULTANT'] },
  { pattern: '/applications/materials', roles: ['CONSULTANT'] },
  { pattern: '/applications/offers', roles: ['CONSULTANT'] },
  { pattern: '/applications/visa', roles: ['CONSULTANT'] },
  { pattern: '/cms/articles', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/cases', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/case/detail/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/case/preview/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/case/edit/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/config/country', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/config/school', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/media', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/site-config', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/:type/:mode/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/cms/config/:mode', roles: ['SUPER_ADMIN'] },
  { pattern: '/knowledge/library', roles: ['CONSULTANT'] },
  { pattern: '/messages/tasks', roles: ['CONSULTANT'] },
  { pattern: '/reports/overview', roles: ['SUPER_ADMIN'] },
  { pattern: '/reports/leads', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/users', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/advisors', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/departments', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/positions', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/data-permission', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/menu-permission', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/dict/detail/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/dict/edit/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/opLog/detail/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/loginLog/detail/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/:type/:mode/:id', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/data-permission/config', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/roles', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/dicts', roles: ['SUPER_ADMIN'] },
  { pattern: '/settings/logs', roles: ['SUPER_ADMIN'] }
];

const buttonRoles: Partial<Record<ButtonAction, Role[]>> = {
  view: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE', 'ANCHOR'],
  create: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE'],
  edit: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE'],
  delete: ['SUPER_ADMIN', 'MEDIA'],
  restore: ['SUPER_ADMIN', 'MEDIA'],
  purge: ['SUPER_ADMIN'],
  upload: ['SUPER_ADMIN', 'MEDIA', 'DATA'],
  download: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'DATA'],
  preview: ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'DATA'],
  assign: ['SUPER_ADMIN', 'OPERATOR', 'CONSULTANT'],
  follow: ['SUPER_ADMIN', 'OPERATOR', 'CONSULTANT'],
  confirm: ['SUPER_ADMIN', 'DATA'],
  reject: ['SUPER_ADMIN', 'DATA'],
  export: ['SUPER_ADMIN', 'DATA', 'ADMINISTRATIVE'],
  import: ['SUPER_ADMIN', 'DATA'],
  review: ['SUPER_ADMIN', 'DATA'],
  publish: ['SUPER_ADMIN'],
  unpublish: ['SUPER_ADMIN'],
  manage: ['SUPER_ADMIN']
};

export function canAccessRoute(role: Role, pathname: string) {
  if (role === 'IDLE_ANCHOR') return pathname === '/403';
  const matched = routeRoles.find(route => matchPath({ path: route.pattern, end: true }, pathname));
  return Boolean(matched?.roles.includes(role));
}

export function canUseButton(role: Role, action: ButtonAction) {
  if (role === 'IDLE_ANCHOR') return false;
  if (role === 'SUPER_ADMIN') return true;
  const allowedRoles = buttonRoles[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function getDefaultRoute(role: Role) {
  if (role === 'SUPER_ADMIN') return '/settings/users';
  if (role === 'MEDIA') return '/media/content';
  if (role === 'OPERATOR') return '/operator/leads';
  if (role === 'CONSULTANT') return '/dashboard';
  if (role === 'DATA') return '/data-ops/operation-data';
  if (role === 'ADMINISTRATIVE') return '/dashboard';
  if (role === 'ANCHOR') return '/profile/settings';
  return '/403';
}
