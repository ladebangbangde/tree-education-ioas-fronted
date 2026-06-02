import {
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ReadOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { AppMenuItem } from '@/types';

export const menuConfig: AppMenuItem[] = [
  { key: 'profile-settings', label: '个人信息设置', path: '/profile/settings', icon: <UserOutlined />, roles: ['MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE'] },
  { key: 'media-content', label: '内容管理', path: '/media/content', icon: <ReadOutlined />, roles: ['MEDIA'] },
  { key: 'operator-leads', label: '线索中心', path: '/operator/leads', icon: <TeamOutlined />, roles: ['OPERATOR'] },
  { key: 'media-assets', label: '媒体资源中心', path: '/media-assets', icon: <FolderOpenOutlined />, roles: ['MEDIA', 'OPERATOR'] },
  { key: 'role-tasks', label: '任务中心', path: '/tasks', icon: <FileTextOutlined />, roles: ['MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE'] },
  { key: 'role-reports', label: '数据报表', path: '/reports', icon: <BarChartOutlined />, roles: ['MEDIA', 'OPERATOR'] },
  {
    key: 'data-ops',
    label: '数据操作',
    icon: <DatabaseOutlined />,
    roles: ['DATA'],
    children: [
      { key: 'operation-data', label: '运营数据', path: '/data-ops/operation-data' }
    ]
  },
  { key: 'dashboard', label: '工作台', path: '/dashboard', icon: <DashboardOutlined />, roles: ['CONSULTANT', 'ADMINISTRATIVE'] },
  {
    key: 'leads',
    label: '线索中心',
    icon: <TeamOutlined />,
    roles: ['CONSULTANT'],
    children: [
      { key: 'leads-list', label: '线索列表', path: '/leads/list' },
      { key: 'leads-follow', label: '客资操作记录', path: '/leads/follow' }
    ]
  },
  { key: 'students', label: '客户档案', icon: <UserOutlined />, roles: ['CONSULTANT'], children: [{ key: 'students-list', label: '档案列表', path: '/students/list' }] },
  {
    key: 'applications',
    label: '申请流程',
    icon: <UserOutlined />,
    roles: ['CONSULTANT'],
    children: [
      { key: 'kanban', label: '流程看板', path: '/applications/kanban' },
      { key: 'materials', label: '材料清单', path: '/applications/materials' },
      { key: 'offers', label: 'Offer管理', path: '/applications/offers' },
      { key: 'visa', label: '签证管理', path: '/applications/visa' }
    ]
  },
  { key: 'knowledge', label: '知识库', path: '/knowledge/library', icon: <FileTextOutlined />, roles: ['CONSULTANT'] },
  {
    key: 'settings',
    label: '系统治理',
    icon: <SettingOutlined />,
    roles: ['SUPER_ADMIN'],
    children: [
      { key: 'users', label: '账号注册与用户管理', path: '/settings/users' },
      { key: 'advisors', label: '顾问注册与档案配置', path: '/settings/advisors' },
      { key: 'departments', label: '组织部门管理', path: '/settings/departments' },
      { key: 'positions', label: '岗位管理', path: '/settings/positions' },
      { key: 'roles', label: '角色权限配置', path: '/settings/roles' },
      { key: 'data-permission', label: '数据权限配置', path: '/settings/data-permission' },
      { key: 'menu-permission', label: '菜单权限配置', path: '/settings/menu-permission' },
      { key: 'dicts', label: '系统字典配置', path: '/settings/dicts' },
      { key: 'logs', label: '审计与操作日志', path: '/settings/logs' }
    ]
  }
];
