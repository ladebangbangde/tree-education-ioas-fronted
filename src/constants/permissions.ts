import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE'];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: '超管',
  MEDIA: '媒体',
  OPERATOR: '运营',
  CONSULTANT: '顾问',
  DATA: '数据员',
  ADMINISTRATIVE: '行政'
};

export const defaultRouteByRole: Record<Role, string> = {
  SUPER_ADMIN: '/settings/users',
  MEDIA: '/media/content',
  OPERATOR: '/operator/leads',
  CONSULTANT: '/students/list',
  DATA: '/data-ops/operation-data',
  ADMINISTRATIVE: '/dashboard'
};

export const getDefaultRoute = (role: Role) => defaultRouteByRole[role] || '/dashboard';

export type ButtonAction = 'view'|'edit'|'export'|'assign'|'batch'|'publish'|'preview'|'permission'|'delete'|'resetPassword'|'follow'|'convert'|'highIntent'|'new'|'file'|'log'|'config'|'stage'|'advisor'|'offline'|'more'|'retry'|'generateLead'|'upload'|'download'|'bindOperator'|'restore'|'createPackage'|'editOwnContent'|'deleteOwnContent'|'createDataPackage'|'createPlatformTopic'|'uploadCover'|'uploadScreenshot'|'confirmDataContent'|'generateDailyReport'|'downloadReport';

const superAdminGovernanceRoutes = [
  '/settings/users',
  '/settings/advisors',
  '/settings/departments',
  '/settings/positions',
  '/settings/roles',
  '/settings/data-permission',
  '/settings/menu-permission',
  '/settings/dict/detail/:id',
  '/settings/dict/edit/:id',
  '/settings/opLog/detail/:id',
  '/settings/loginLog/detail/:id',
  '/settings/:type/:mode/:id',
  '/settings/data-permission/config',
  '/settings/dicts',
  '/settings/logs'
] as const;

const allRoutes = [
  '/dashboard','/profile/settings',
  '/media/content','/operator/leads','/media-assets','/tasks','/reports',
  '/data-ops/operation-data',
  '/leads/list','/leads/detail/:id','/leads/follow',
  '/students/list','/students/detail/:id',
  '/applications/kanban','/applications/detail/:id','/applications/stage/:stage','/applications/materials','/applications/offers','/applications/visa',
  '/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/cms/case/edit/:id','/cms/config/country','/cms/config/school','/cms/media','/cms/site-config','/cms/:type/:mode/:id','/cms/config/:mode',
  '/knowledge/library','/messages/tasks',
  '/reports/overview','/reports/leads',
  ...superAdminGovernanceRoutes
] as const;

export const rolePageMatrix: Record<Role, string[]> = {
  SUPER_ADMIN: [...superAdminGovernanceRoutes, '/dashboard', '/data-ops/operation-data', '/tasks', '/reports'],
  MEDIA: ['/profile/settings','/media/content','/media-assets','/tasks','/reports'],
  OPERATOR: ['/profile/settings','/operator/leads','/media-assets','/tasks','/reports'],
  CONSULTANT: ['/profile/settings','/tasks','/dashboard','/leads/list','/leads/detail/:id','/leads/follow','/students/list','/students/detail/:id','/applications/kanban','/applications/detail/:id','/applications/stage/:stage','/applications/materials','/applications/offers','/applications/visa','/knowledge/library'],
  DATA: ['/profile/settings','/data-ops/operation-data','/tasks','/reports'],
  ADMINISTRATIVE: ['/profile/settings','/dashboard','/tasks']
};

export const routePermissionMap = allRoutes.reduce((acc, route) => {
  acc[route] = roles.filter(role => rolePageMatrix[role].includes(route));
  return acc;
}, {} as Record<string, Role[]>);

export const roleButtonMatrix: Record<Role, ButtonAction[]> = {
  SUPER_ADMIN: ['view','new','edit','delete','permission','resetPassword','config','log','upload','createDataPackage','createPlatformTopic','uploadCover','uploadScreenshot','confirmDataContent','generateDailyReport','downloadReport','retry'],
  MEDIA: ['view','new','createPackage','upload','download','preview','edit','editOwnContent','delete','deleteOwnContent','bindOperator','retry','restore','file'],
  CONSULTANT: ['view','edit','follow','convert','file','log','stage','advisor','more','upload'],
  OPERATOR: ['view','download','preview','file','log','generateLead','more'],
  DATA: ['view','new','createDataPackage','createPlatformTopic','upload','uploadCover','uploadScreenshot','confirmDataContent','generateDailyReport','downloadReport','retry','file','log'],
  ADMINISTRATIVE: ['view','file','log']
};

export const oldRoleMigrationMap = {
  CONSULTANT: 'CONSULTANT',
  APPLICANT_TEACHER: 'CONSULTANT',
  COPYWRITER: 'CONSULTANT',
  AFTER_SERVICE: 'CONSULTANT',
  MEDIA: 'MEDIA',
  OPERATOR: 'OPERATOR',
  SUPER_ADMIN: 'SUPER_ADMIN',
  DATA: 'DATA',
  DATA_OPERATOR: 'DATA',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  ADMIN: 'ADMINISTRATIVE'
} as const;

export const canAccessRoute = (role: Role, pathname: string) => {
  return rolePageMatrix[role]?.some(pattern => Boolean(matchPath({ path: pattern, end: true }, pathname))) || false;
};

export const getRouteRoles = (pathname: string) => roles.filter(role => canAccessRoute(role, pathname));
export const canUseButton = (role: Role, action: ButtonAction) => roleButtonMatrix[role]?.includes(action) || false;
