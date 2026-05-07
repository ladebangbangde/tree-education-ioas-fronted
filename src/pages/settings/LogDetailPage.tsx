import { Button, Card, Col, Descriptions, Row, Space, Tag, Timeline } from 'antd';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components';
import { logs } from '@/mock/settings';
import { useEnterpriseActions } from '@/hooks/useEnterpriseActions';

interface LogDetailPageProps { type: 'opLog' | 'loginLog'; }

export default function LogDetailPage({ type }: LogDetailPageProps){
  const { id = 'LG01' } = useParams();
  const { openAction, contextHolder } = useEnterpriseActions(type === 'opLog' ? '操作日志' : '登录日志');
  const data = logs.find(item => item.id === id) || logs[0];
  const title = type === 'opLog' ? '操作日志详情' : '登录日志详情';

  return <>{contextHolder}<PageHeader title={title} extra={<Space><Button onClick={()=>openAction('export', data)}>导出记录</Button><Button type='primary' onClick={()=>openAction('log', data)}>标记已审计</Button></Space>} /><Row gutter={[16,16]}><Col span={16}><Card><Descriptions bordered column={2} items={[{label:'日志编号',children:data.id},{label:type==='opLog'?'操作人':'登录账号',children:data.operator},{label:'模块',children:data.module},{label:'类型',children:data.type},{label:'描述',children:data.desc},{label:'IP地址',children:data.ip},{label:'发生时间',children:data.time},{label:'结果',children:<Tag color='green'>{data.result}</Tag>}]} /></Card></Col><Col span={8}><Card title='审计轨迹'><Timeline items={[{children:'系统采集日志'},{children:'风控规则检查通过'},{children:'等待管理员复核'}]} /></Card></Col></Row></>;
}
