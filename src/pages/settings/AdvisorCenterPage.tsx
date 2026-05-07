import { Button, Card, Col, Progress, Row, Space, Tag } from 'antd';
import { PageHeader } from '@/components';
import { advisorProfiles } from '@/mock/settings';

export default function AdvisorCenterPage(){
  return <><PageHeader title='顾问管理中心' extra={<Space><Button>批量导入</Button><Button type='primary'>新增顾问</Button></Space>} /><Row gutter={[16,16]}>{advisorProfiles.map(item=><Col span={8} key={item.id}><Card title={item.name} extra={<Tag color='blue'>{item.level}</Tag>}><p>擅长国家：{item.countries}</p><p>擅长方向：{item.focus}</p><p>当前负载：{item.load} 单</p><Progress percent={item.convert} size='small'/></Card></Col>)}</Row></>;
}
