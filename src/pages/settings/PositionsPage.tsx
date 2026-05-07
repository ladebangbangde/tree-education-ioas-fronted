import { Button, Card, Col, Row, Space, Tag } from 'antd';
import { PageHeader } from '@/components';
import { positions } from '@/mock/settings';

export default function PositionsPage(){
  return <><PageHeader title='岗位管理' extra={<Space><Button>岗位排序</Button><Button type='primary'>新增岗位</Button></Space>} /><Row gutter={[16,16]}>{positions.map(item=><Col span={8} key={item.id}><Card title={item.name} extra={<Tag color='blue'>{item.grade}</Tag>}><p>所属部门：{item.dept}</p><p>权限模板：{item.permission}</p><p>在岗人数：{item.members}</p></Card></Col>)}</Row></>;
}
