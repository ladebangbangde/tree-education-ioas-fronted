import { DashboardOutlined, TeamOutlined, UserOutlined, ProfileOutlined, ReadOutlined, MessageOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
export const menuConfig = [
{key:'dashboard',label:'工作台',path:'/dashboard',icon:<DashboardOutlined/>},
{key:'leads',label:'线索中心',icon:<TeamOutlined/>,children:[{key:'leads-list',label:'线索列表',path:'/leads/list'},{key:'leads-assign',label:'线索分配',path:'/leads/assign'}]},
{key:'students',label:'学生档案',icon:<UserOutlined/>,children:[{key:'students-list',label:'档案列表',path:'/students/list'}]},
{key:'applications',label:'申请交付',icon:<ProfileOutlined/>,children:[{key:'kanban',label:'申请看板',path:'/applications/kanban'},{key:'materials',label:'材料清单',path:'/applications/materials'},{key:'offers',label:'Offer管理',path:'/applications/offers'},{key:'visa',label:'签证管理',path:'/applications/visa'}]},
{key:'cms',label:'内容管理',icon:<ReadOutlined/>,children:[{key:'articles',label:'文章管理',path:'/cms/articles'},{key:'cases',label:'案例管理',path:'/cms/cases'}]},
{key:'knowledge',label:'知识库',icon:<ReadOutlined/>,path:'/knowledge/library'},
{key:'messages',label:'消息任务',icon:<MessageOutlined/>,path:'/messages/tasks'},
{key:'reports',label:'报表',icon:<BarChartOutlined/>,children:[{key:'reports-overview',label:'总览',path:'/reports/overview'},{key:'reports-leads',label:'线索分析',path:'/reports/leads'}]},
{key:'settings',label:'系统设置',icon:<SettingOutlined/>,children:[{key:'users',label:'用户管理',path:'/settings/users'},{key:'roles',label:'角色权限',path:'/settings/roles'},{key:'dicts',label:'字典配置',path:'/settings/dicts'},{key:'logs',label:'操作日志',path:'/settings/logs'}]}
];
