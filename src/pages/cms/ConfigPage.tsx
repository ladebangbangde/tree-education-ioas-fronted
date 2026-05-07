import { Button, Card, Col, Descriptions, Form, Input, Row, Select, Space, Tabs, Tag } from 'antd';
import { PageHeader } from '@/components';
import { countryConfigs, schoolConfigs } from '@/mock/cms';
import { useEnterpriseActions } from '@/hooks/useEnterpriseActions';

interface ConfigPageProps { mode: 'country' | 'school'; }

export default function ConfigPage({ mode }: ConfigPageProps){
  const { openAction, contextHolder } = useEnterpriseActions('站点配置');
  const data = mode === 'country' ? countryConfigs[0] : schoolConfigs[0];
  const title = mode === 'country' ? '国家页详情配置' : '院校页详情配置';

  return <>{contextHolder}<PageHeader title={title} extra={<Space><Button onClick={()=>openAction('preview', data)}>预览前台</Button><Button onClick={()=>openAction('log', data)}>查看日志</Button><Button type='primary' onClick={()=>openAction('config', data)}>保存配置</Button></Space>} /><Row gutter={[16,16]}><Col span={16}><Card><Tabs items={[{key:'basic',label:'基础配置',children:<Form layout='vertical' initialValues={data}><Form.Item label='页面标题' name='title'><Input/></Form.Item><Form.Item label='页面编码' name='code'><Input/></Form.Item><Form.Item label='推荐模块'><Select mode='multiple' defaultValue={data.modules} options={['banner','advantages','schools','cases','articles','faq','apply-form'].map(value=>({value}))}/></Form.Item><Form.Item label='页面摘要' name='summary'><Input.TextArea rows={5}/></Form.Item></Form>},{key:'seo',label:'SEO 与发布',children:<Descriptions bordered column={1} items={[{label:'SEO标题',children:data.seoTitle},{label:'关键词',children:data.keywords},{label:'发布状态',children:<Tag color='blue'>{data.status}</Tag>}]} />}]} /></Card></Col><Col span={8}><Card title='前台模块预览'><p>Banner、优势介绍、推荐院校/专业、成功案例、FAQ 与咨询转化表单将按配置顺序展示。</p><Descriptions column={1} items={[{label:'负责人',children:data.owner},{label:'最后保存',children:data.updatedAt}]} /></Card></Col></Row></>;
}
