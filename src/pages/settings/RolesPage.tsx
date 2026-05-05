import { Card, Checkbox, Col, Row, Tree } from 'antd';
import { PageHeader } from '@/components';
import { roles } from '@/mock/settings';

export default function RolesPage(){return <><PageHeader title='角色权限'/><Row gutter={12}><Col span={6}><Card title='角色列表'>{roles.map(r=><p key={r}>{r}</p>)}</Card></Col><Col span={18}><Card title='菜单权限'><Tree checkable defaultExpandAll treeData={[{title:'工作台',key:'1'},{title:'线索中心',key:'2',children:[{title:'线索列表',key:'2-1'},{title:'线索分配',key:'2-2'},{title:'跟进记录',key:'2-3'}]},{title:'系统设置',key:'3',children:[{title:'用户管理',key:'3-1'},{title:'角色权限',key:'3-2'}]}]}/><Card type='inner' title='按钮权限配置' className='mt12'><Checkbox.Group options={['查看','新建','编辑','删除','导出','分配']} /></Card><Card type='inner' title='数据权限' className='mt12'>全部数据 / 部门数据 / 个人数据</Card></Card></Col></Row></>}
