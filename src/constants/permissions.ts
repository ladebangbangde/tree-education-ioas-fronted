import { matchPath } from 'react-router-dom';
import type { Department, Position, Role } from '@/types';

export const roles: Role[] = ['SUPER_ADMIN','STAFF','OPERATOR'];
export const staffPositions: Position[] = ['留学顾问','申请老师','文案老师','签证服务'];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: '超级管理员',
  STAFF: '老师',
  OPERATOR: '运营人员'
};

export const departmentByPosition: Record<Position, Department> = {
  超级管理员: '系统管理部',
  运营人员: '运营部',
  留学顾问: '咨询中心',
  申请老师: '申请交付中心',
  文案老师: '文案部',
  签证服务: '签证部'
};

export const defaultRouteByRole: Record<Role, string> = {
  SUPER_ADMIN: '/dashboard',
  STAFF: '/leads/list',
  OPERATOR: '/dashboard'
};

export const defaultRouteByStaffPosition: Partial<Record<Position, string>> = {
  留学顾问: '/leads/list',
  申请老师: '/applications/kanban',
  文案老师: '/applications/materials',
  签证服务: '/applications/visa'
};

export const getDefaultRoute = (role: Role, position?: Position) => role === 'STAFF' && position ? (defaultRouteByStaffPosition[position] || defaultRouteByRole.STAFF) : defaultRouteByRole[role];

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
  STAFF: ['/dashboard','/leads/list','/leads/detail/:id','/leads/follow','/students/list','/students/detail/:id','/applications/kanban','/applications/detail/:id','/applications/stage/:stage','/applications/materials','/applications/offers','/applications/visa','/knowledge/library','/messages/tasks'],
  OPERATOR: ['/dashboard','/leads/list','/leads/detail/:id','/leads/assign','/leads/follow','/cms/articles','/cms/cases','/cms/case/detail/:id','/cms/case/preview/:id','/cms/case/edit/:id','/cms/config/country','/cms/config/school','/cms/media','/cms/site-config','/cms/:type/:mode/:id','/cms/config/:mode','/knowledge/library','/messages/tasks','/reports/overview','/reports/leads']
};

export const routePermissionMap = allRoutes.reduce((acc, route) => {
  acc[route] = roles.filter(role => rolePageMatrix[role].includes(route));
  return acc;
}, {} as Record<string, Role[]>);

const allActions: ButtonAction[] = ['view','edit','export','assign','batch','publish','preview','permission','delete','resetPassword','follow','convert','highIntent','new','file','log','config','stage','advisor','offline','more'];
export const roleButtonMatrix: Record<Role, ButtonAction[]> = {
  SUPER_ADMIN: allActions,
  STAFF: ['view','edit','follow','file','log','stage','more'],
  OPERATOR: ['view','edit','export','assign','batch','publish','preview','new','file','log','config','offline','more']
};

export const oldRoleMigrationMap = {
  CONSULTANT: { role: 'STAFF', position: '留学顾问', department: '咨询中心' },
  APPLICANT_TEACHER: { role: 'STAFF', position: '申请老师', department: '申请交付中心' },
  COPYWRITER: { role: 'STAFF', position: '文案老师', department: '文案部' },
  AFTER_SERVICE: { role: 'STAFF', position: '签证服务', department: '签证部' },
  OPERATOR: { role: 'OPERATOR', position: '运营人员', department: '运营部' },
  SUPER_ADMIN: { role: 'SUPER_ADMIN', position: '超级管理员', department: '系统管理部' }
} as const;

export const canAccessRoute = (role: Role, pathname: string) => {
  if (role === 'SUPER_ADMIN') return true;
  return rolePageMatrix[role].some(pattern => Boolean(matchPath({ path: pattern, end: true }, pathname)));
};

export const getRouteRoles = (pathname: string) => roles.filter(role => canAccessRoute(role, pathname));
export const canUseButton = (role: Role, action: ButtonAction) => roleButtonMatrix[role].includes(action);
