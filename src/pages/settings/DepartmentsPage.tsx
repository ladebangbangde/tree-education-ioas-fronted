import { Button, Card, Col, Row, Space, Tag, Tree } from 'antd';
import { PageHeader } from '@/components';
import { departmentTree, departments } from '@/mock/settings';

export default function DepartmentsPage(){
  return <><PageHeader title='部门管理' extra={<Space><Button>调整排序</Button><Button type='primary'>新增部门</Button></Space>} /><Row gutter={[16,16]}><Col span={8}><Card title='组织架构'><Tree defaultExpandAll treeData={departmentTree}/></Card></Col><Col span={16}><Row gutter={[16,16]}>{departments.map(item=><Col span={12} key={item.id}><Card title={item.name} extra={<Tag color='green'>{item.status}</Tag>}><p>负责人：{item.owner}</p><p>人数：{item.members}</p><p>说明：{item.desc}</p></Card></Col>)}</Row></Col></Row></>;
}
