import { Card, Checkbox, Col, Row, Space, Tree } from 'antd';
import { PageHeader } from '@/components';
import { roles } from '@/mock/settings';

export default function RolesPage(){
  return <>
    <PageHeader title='角色权限中心'/>
    <Row gutter={[16,16]}>
      <Col span={6}><Card title='角色列表'>{roles.map(r=><p key={r}>{r}</p>)}</Card></Col>
      <Col span={18}>
        <Card title='权限配置区'>
          <Row gutter={[16,16]}>
            <Col span={12}><Card type='inner' title='菜单权限树'><Tree checkable defaultExpandAll treeData={[{title:'工作台',key:'1'},{title:'线索中心',key:'2',children:[{title:'线索列表',key:'2-1'},{title:'线索分配',key:'2-2'},{title:'跟进记录',key:'2-3'}]},{title:'系统设置',key:'3',children:[{title:'用户管理',key:'3-1'},{title:'角色权限',key:'3-2'}]}]}/></Card></Col>
            <Col span={12}><Card type='inner' title='按钮权限'><Checkbox.Group options={['查看','新增','编辑','删除','导出','分配','发布']} /></Card><Card className='mt12' type='inner' title='数据权限'><Space direction='vertical'><Checkbox>全部数据</Checkbox><Checkbox>部门数据</Checkbox><Checkbox>个人数据</Checkbox></Space></Card></Col>
          </Row>
        </Card>
      </Col>
    </Row>
  </>
}
