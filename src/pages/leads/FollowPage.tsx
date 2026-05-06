import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Switch, Table, Tag } from 'antd';
import { LeadTimeline, PageHeader, StatusTag } from '@/components';
import { followHistoryTable, followLogs, followTags, leadsList } from '@/mock/leads';

export default function LeadsFollowPage(){
  const lead = leadsList[1];
  const columns=[{title:'跟进时间',dataIndex:'time'},{title:'方式',dataIndex:'method',render:(v:string)=><Tag color='blue'>{v}</Tag>},{title:'结果',dataIndex:'result',render:(v:string)=><StatusTag status={v==='高意向'?'高意向':'跟进中'}/>},{title:'顾问',dataIndex:'owner'},{title:'沟通纪要',dataIndex:'summary'}];

  return <>
    <PageHeader title='线索跟进工作台' />
    <Card className='mb12'>
      <Space wrap size={24}>
        <span>线索编号：{lead.id}</span><span>学生：{lead.studentName}</span><span>来源：{lead.source}</span><span>国家：{lead.intentCountry}</span><span>评分：<Tag color='gold'>{lead.score}</Tag></span><span>下次跟进：{lead.nextFollowAt}</span>
      </Space>
      <div className='mt12'><Space wrap>{followTags.map(t=><Tag key={t}>{t}</Tag>)}</Space></div>
    </Card>

    <Row gutter={[16,16]}>
      <Col span={12}><Card title='跟进时间线'><LeadTimeline items={followLogs.map(({time,content,owner})=>({time,content,owner}))} /></Card></Col>
      <Col span={12}><Card title='新增跟进记录'>
        <Form layout='vertical'>
          <Form.Item label='跟进方式'><Select options={['电话','微信','面谈','邮件'].map(v=>({value:v}))}/></Form.Item>
          <Form.Item label='跟进结果'><Select options={['已预约','待回访','高意向'].map(v=>({value:v}))}/></Form.Item>
          <Form.Item label='沟通纪要'><Input.TextArea rows={4} placeholder='记录本次沟通重点、异议与下一步动作'/></Form.Item>
          <Form.Item label='下次跟进时间'><DatePicker showTime style={{width:'100%'}}/></Form.Item>
          <Form.Item label='是否高意向' valuePropName='checked'><Switch /></Form.Item>
          <Button type='primary' block>保存跟进</Button>
        </Form>
      </Card></Col>
    </Row>

    <Card className='mt12' title='跟进历史列表'>
      <Table rowKey='id' pagination={false} dataSource={followHistoryTable} columns={columns} />
    </Card>
  </>
}
