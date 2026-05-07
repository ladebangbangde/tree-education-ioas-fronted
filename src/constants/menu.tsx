import { BarChartOutlined, DashboardOutlined, FileTextOutlined, ProfileOutlined, ReadOutlined, SettingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { AppMenuItem } from '@/types';
export const menuConfig: AppMenuItem[] = [
  { key:'dashboard',label:'工作台',path:'/dashboard',icon:<DashboardOutlined/> },
  { key:'leads',label:'线索中心',icon:<TeamOutlined/>,children:[{key:'leads-list',label:'线索列表',path:'/leads/list'},{key:'leads-assign',label:'线索分配',path:'/leads/assign'},{key:'leads-follow',label:'跟进记录',path:'/leads/follow'}] },
  { key:'students',label:'学生档案',icon:<UserOutlined/>,children:[{key:'students-list',label:'档案列表',path:'/students/list'}] },
  { key:'applications',label:'申请交付',icon:<ProfileOutlined/>,children:[{key:'kanban',label:'申请看板',path:'/applications/kanban'},{key:'materials',label:'材料清单',path:'/applications/materials'},{key:'offers',label:'Offer管理',path:'/applications/offers'},{key:'visa',label:'签证管理',path:'/applications/visa'}] },
  { key:'cms',label:'内容管理',icon:<ReadOutlined/>,children:[{key:'articles',label:'文章管理',path:'/cms/articles'},{key:'cases',label:'成功案例',path:'/cms/cases'},{key:'media',label:'媒体资源中心',path:'/cms/media'},{key:'site-config',label:'站点配置中心',path:'/cms/site-config'}],roles:['SUPER_ADMIN','OPERATOR','COPYWRITER'] },
  { key:'knowledge',label:'知识库',path:'/knowledge/library',icon:<FileTextOutlined/> },
  { key:'messages',label:'任务中心',path:'/messages/tasks',icon:<FileTextOutlined/> },
  { key:'reports',label:'数据报表',icon:<BarChartOutlined/>,children:[{key:'overview',label:'报表总览',path:'/reports/overview'},{key:'leads',label:'线索分析',path:'/reports/leads'}] },
  { key:'settings',label:'系统设置',icon:<SettingOutlined/>,children:[{key:'users',label:'用户管理',path:'/settings/users'},{key:'advisors',label:'顾问管理中心',path:'/settings/advisors'},{key:'departments',label:'部门管理',path:'/settings/departments'},{key:'positions',label:'岗位管理',path:'/settings/positions'},{key:'roles',label:'角色权限',path:'/settings/roles'},{key:'data-permission',label:'数据权限配置',path:'/settings/data-permission'},{key:'menu-permission',label:'菜单权限配置',path:'/settings/menu-permission'},{key:'dicts',label:'字典配置',path:'/settings/dicts'},{key:'logs',label:'操作日志',path:'/settings/logs'}],roles:['SUPER_ADMIN','OPERATOR'] }
];
