import { Button, Card, Descriptions, Form, Input, Space, Switch, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components';
import { dictItems } from '@/mock/settings';
import { useEnterpriseActions } from '@/hooks/useEnterpriseActions';

interface DictDetailPageProps { mode: 'detail' | 'edit'; }

export default function DictDetailPage({ mode }: DictDetailPageProps){
  const { id = 'D1' } = useParams();
  const nav = useNavigate();
  const { openAction, contextHolder } = useEnterpriseActions('字典配置');
  const data = Object.values(dictItems).flat().find(item => item.id === id) || Object.values(dictItems).flat()[0];

  if (mode === 'edit') return <>{contextHolder}<PageHeader title='字典项编辑' extra={<Space><Button onClick={()=>nav(`/settings/dict/detail/${data.id}`)}>返回详情</Button><Button type='primary' onClick={()=>openAction('edit', data)}>保存</Button></Space>} /><Card><Form layout='vertical' initialValues={data}><Form.Item label='字典名称' name='name'><Input/></Form.Item><Form.Item label='字典编码' name='code'><Input/></Form.Item><Form.Item label='状态' name='status'><Input/></Form.Item><Form.Item label='排序' name='sort'><Input/></Form.Item><Form.Item label='备注' name='remark'><Input.TextArea rows={4}/></Form.Item><Form.Item label='启用'><Switch defaultChecked={data.status==='启用'} /></Form.Item></Form></Card></>;

  return <>{contextHolder}<PageHeader title='字典项详情' extra={<Space><Button onClick={()=>nav(`/settings/dict/edit/${data.id}`)}>编辑</Button><Button onClick={()=>openAction('log', data)}>查看日志</Button></Space>} /><Card><Descriptions bordered column={2} items={[{label:'字典编号',children:data.id},{label:'名称',children:data.name},{label:'编码',children:data.code},{label:'状态',children:<Tag color='green'>{data.status}</Tag>},{label:'排序',children:data.sort},{label:'备注',children:data.remark}]} /></Card></>;
}
