import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = ['SUPER_ADMIN','OPERATOR','CONSULTANT','APPLICANT_TEACHER','COPYWRITER','AFTER_SERVICE'];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: '超级管理员',
  OPERATOR: '运营管理员',
  CONSULTANT: '留学顾问',
  APPLICANT_TEACHER: '申请老师',
  COPYWRITER: '文案/内容',
  AFTER_SERVICE: '签证后服务'
};

export const defaultRouteByRole: Record<Role, string> = {
  SUPER_ADMIN: '/dashboard',
  OPERATOR: '/dashboard',
  CONSULTANT: '/leads/list',
  APPLICANT_TEACHER: '/applications/kanban',
  COPYWRITER: '/cms/articles',
  AFTER_SERVICE: '/applications/visa'
};

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
  OPERATOR: [
    '/dashboard',
    '/leads/list','/leads/detail/:id','/leads/assign','/leads/follow',
    '/students/list','/students/detail/:id',
    '/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/cms/case/edit/:id','/cms/config/country','/cms/config/school','/cms/media','/cms/site-config','/cms/:type/:mode/:id','/cms/config/:mode',
    '/knowledge/library','/messages/tasks',
    '/reports/overview','/reports/leads',
    '/settings/users','/settings/advisors','/settings/departments','/settings/positions','/settings/dict/detail/:id','/settings/dict/edit/:id','/settings/opLog/detail/:id','/settings/loginLog/detail/:id','/settings/:type/:mode/:id','/settings/dicts','/settings/logs'
  ],
  CONSULTANT: ['/dashboard','/leads/list','/leads/detail/:id','/leads/follow','/students/list','/students/detail/:id','/messages/tasks','/knowledge/library'],
  APPLICANT_TEACHER: ['/dashboard','/students/list','/students/detail/:id','/applications/kanban','/applications/detail/:id','/applications/stage/:stage','/applications/materials','/applications/offers','/applications/visa','/messages/tasks','/knowledge/library'],
  COPYWRITER: ['/dashboard','/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/cms/case/edit/:id','/cms/config/country','/cms/config/school','/cms/media','/cms/site-config','/cms/:type/:mode/:id','/cms/config/:mode','/knowledge/library','/messages/tasks'],
  AFTER_SERVICE: ['/dashboard','/students/list','/students/detail/:id','/applications/visa','/applications/detail/:id','/messages/tasks','/knowledge/library']
};

export const routePermissionMap = allRoutes.reduce((acc, route) => {
  acc[route] = roles.filter(role => rolePageMatrix[role].includes(route));
  return acc;
}, {} as Record<string, Role[]>);

const allActions: ButtonAction[] = ['view','edit','export','assign','batch','publish','preview','permission','delete','resetPassword','follow','convert','highIntent','new','file','log','config','stage','advisor','offline','more'];
export const roleButtonMatrix: Record<Role, ButtonAction[]> = {
  SUPER_ADMIN: allActions,
  OPERATOR: ['view','edit','export','assign','batch','publish','preview','follow','convert','highIntent','new','file','log','config','stage','advisor','offline','more'],
  CONSULTANT: ['view','edit','follow','convert','highIntent','new','file','log','more'],
  APPLICANT_TEACHER: ['view','edit','preview','file','log','stage','new','more'],
  COPYWRITER: ['view','edit','preview','publish','new','file','log','config','offline','more'],
  AFTER_SERVICE: ['view','edit','file','log','stage','more']
};

const deniedRouteMatrix: Partial<Record<Role, string[]>> = {
  OPERATOR: ['/settings/roles','/settings/role/detail/:id','/settings/role/permission/:id','/settings/data-permission','/settings/data-permission/config','/settings/menu-permission'],
  CONSULTANT: ['/leads/assign'],
  COPYWRITER: ['/students/list','/students/detail/:id'],
  AFTER_SERVICE: ['/applications/kanban','/applications/materials','/applications/offers']
};

export const canAccessRoute = (role: Role, pathname: string) => {
  if (role !== 'SUPER_ADMIN' && deniedRouteMatrix[role]?.some(pattern => Boolean(matchPath({ path: pattern, end: true }, pathname)))) return false;
  if (role === 'SUPER_ADMIN') return true;
  return rolePageMatrix[role].some(pattern => Boolean(matchPath({ path: pattern, end: true }, pathname)));
};

export const getRouteRoles = (pathname: string) => roles.filter(role => canAccessRoute(role, pathname));
export const canUseButton = (role: Role, action: ButtonAction) => roleButtonMatrix[role].includes(action);
