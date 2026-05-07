import { Button, Card, Col, Descriptions, Form, Input, Row, Space, Tag, Timeline } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components';
import { cases } from '@/mock/cms';
import { useEnterpriseActions } from '@/hooks/useEnterpriseActions';

interface CaseDetailPageProps { mode: 'detail' | 'preview' | 'edit'; }

export default function CaseDetailPage({ mode }: CaseDetailPageProps){
  const { id = 'C01' } = useParams();
  const nav = useNavigate();
  const { openAction, contextHolder } = useEnterpriseActions('成功案例');
  const data = cases.find(item => item.id === id) || cases[0];
  const titleMap = { detail: '成功案例详情', preview: '成功案例预览', edit: id === 'new' ? '新建成功案例' : '编辑成功案例' };

  if (mode === 'preview') return <>{contextHolder}<PageHeader title={titleMap.preview} extra={<Space><Button onClick={()=>nav(`/cms/case/edit/${data.id}`)}>编辑</Button><Button type='primary' onClick={()=>openAction('publish', data)}>发布</Button></Space>} /><Card><Tag color='green'>前台预览</Tag><h1>{data.title}</h1><p>{data.country} · {data.school} · {data.major}</p><p>学生背景、申请亮点、录取结果和顾问点评将在这里以内容页样式展示，便于运营在发布前确认排版。</p></Card></>;

  if (mode === 'edit') return <>{contextHolder}<PageHeader title={titleMap.edit} extra={<Space><Button onClick={()=>nav(`/cms/case/preview/${data.id}`)}>预览</Button><Button onClick={()=>openAction('log', data)}>查看日志</Button><Button type='primary' onClick={()=>openAction('edit', data)}>保存草稿</Button></Space>} /><Card><Form layout='vertical' initialValues={data}><Form.Item label='案例标题' name='title'><Input/></Form.Item><Form.Item label='国家' name='country'><Input/></Form.Item><Form.Item label='院校' name='school'><Input/></Form.Item><Form.Item label='专业' name='major'><Input/></Form.Item><Form.Item label='顾问' name='advisor'><Input/></Form.Item><Form.Item label='案例正文'><Input.TextArea rows={8} defaultValue='Mock 编辑区：填写学生背景、申请难点、方案策略、录取结果与顾问点评。'/></Form.Item></Form></Card></>;

  return <>{contextHolder}<PageHeader title={titleMap.detail} extra={<Space><Button onClick={()=>nav(`/cms/case/preview/${data.id}`)}>预览</Button><Button onClick={()=>nav(`/cms/case/edit/${data.id}`)}>编辑</Button><Button type='primary' onClick={()=>openAction('publish', data)}>发布</Button></Space>} /><Row gutter={[16,16]}><Col span={16}><Card><Descriptions bordered column={2} items={[{label:'案例编号',children:data.id},{label:'案例标题',children:data.title},{label:'国家',children:data.country},{label:'院校',children:data.school},{label:'专业',children:data.major},{label:'负责顾问',children:data.advisor},{label:'发布时间',children:data.publishAt},{label:'状态',children:<Tag color={data.status==='已发布'?'green':'blue'}>{data.status}</Tag>}]} /></Card></Col><Col span={8}><Card title='内容流转'><Timeline items={[{children:'案例素材已归档'},{children:'文案完成初稿'},{children:'运营完成 SEO 检查'}]} /></Card></Col></Row></>;
}
