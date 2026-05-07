import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = ['SUPER_ADMIN','OPERATOR','CONSULTANT'];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: '超管',
  OPERATOR: '运营',
  CONSULTANT: '顾问'
};

export const defaultRouteByRole: Record<Role, string> = {
  SUPER_ADMIN: '/dashboard',
  OPERATOR: '/dashboard',
  CONSULTANT: '/leads/list'
};

export const getDefaultRoute = (role: Role) => defaultRouteByRole[role];

export type ButtonAction = 'view'|'edit'|'export'|'assign'|'batch'|'publish'|'preview'|'permission'|'delete'|'resetPassword'|'follow'|'convert'|'highIntent'|'new'|'file'|'log'|'config'|'stage'|'advisor'|'offline'|'more';

const allRoutes = [
  '/dashboard',
  '/leads/list','/leads/detail/:id','/leads/assign','/leads/follow',
  '/students/list','/students/detail/:id',
  '/applications/kanban','/applications/detail/:id','/applications/stage/:stage','/applications/materials','/applications/offers','/applications/visa',
  '/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/cms/case/edit/:id','/cms/config/country','/cms/config/school','/cms/media','/cms/site-config','/cms/:type/:mode/:id','/cms/config/:mode',
  '/knowledge/library','/messages/tasks',
  '/reports/overview','/reports/leads',
  '/settings/users','/settings/advisors','/settings/departments','/settings/positions','/settings/data-permission','/settings/menu-permission','/settings/dict/detail/:id','/settings/dict/edit/:id','/settings/opLog/detail/:id','/settings/loginLog/detail/:id','/settings/:type/:mode/:id','/settings/data-permission/config','/settings/roles','/settings/dicts','/settings/logs'
] as const;

export const rolePageMatrix: Record<Role, string[]> = {
  SUPER_ADMIN: [...allRoutes],
  CONSULTANT: ['/dashboard','/leads/list','/leads/detail/:id','/leads/assign','/leads/follow','/students/list','/students/detail/:id','/applications/kanban','/applications/detail/:id','/applications/stage/:stage','/applications/materials','/applications/offers','/applications/visa','/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/knowledge/library','/messages/tasks'],
  OPERATOR: ['/dashboard','/leads/list','/leads/detail/:id','/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/cms/case/edit/:id','/cms/config/country','/cms/config/school','/cms/media','/cms/site-config','/cms/:type/:mode/:id','/cms/config/:mode','/knowledge/library','/messages/tasks','/reports/overview','/reports/leads']
};

export const routePermissionMap = allRoutes.reduce((acc, route) => {
  acc[route] = roles.filter(role => rolePageMatrix[role].includes(route));
  return acc;
}, {} as Record<string, Role[]>);

const allActions: ButtonAction[] = ['view','edit','export','assign','batch','publish','preview','permission','delete','resetPassword','follow','convert','highIntent','new','file','log','config','stage','advisor','offline','more'];
export const roleButtonMatrix: Record<Role, ButtonAction[]> = {
  SUPER_ADMIN: allActions,
  CONSULTANT: ['view','edit','assign','follow','file','log','stage','advisor','more'],
  OPERATOR: ['view','edit','export','publish','preview','new','file','log','config','offline','more']
};

export const oldRoleMigrationMap = {
  CONSULTANT: 'CONSULTANT',
  APPLICANT_TEACHER: 'CONSULTANT',
  COPYWRITER: 'CONSULTANT',
  AFTER_SERVICE: 'CONSULTANT',
  OPERATOR: 'OPERATOR',
  SUPER_ADMIN: 'SUPER_ADMIN'
} as const;

export const canAccessRoute = (role: Role, pathname: string) => {
  if (role === 'SUPER_ADMIN') return true;
  return rolePageMatrix[role].some(pattern => Boolean(matchPath({ path: pattern, end: true }, pathname)));
};

export const getRouteRoles = (pathname: string) => roles.filter(role => canAccessRoute(role, pathname));
export const canUseButton = (role: Role, action: ButtonAction) => roleButtonMatrix[role].includes(action);
