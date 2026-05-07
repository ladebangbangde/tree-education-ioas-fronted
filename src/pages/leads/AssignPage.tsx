import { Alert, Avatar, Button, Card, Col, Descriptions, List, Progress, Radio, Row, Space, Statistic, Tag } from 'antd';
import { useState } from 'react';
import { PageHeader, StatusTag } from '@/components';
import { advisors, assignRecommendation, assignStats, leadsList } from '@/mock/leads';

export default function LeadsAssignPage(){
  const [rule, setRule] = useState('country');
  const [selectedAdvisor, setSelectedAdvisor] = useState(advisors[0].name);
  const lead = leadsList[0];

  return <>
    <PageHeader title='线索分配中心' />
    <Row gutter={[16,16]} className='mb12'>
      <Col span={8}><Card><Statistic title='当前待分配线索' value={assignStats.pending} /></Card></Col>
      <Col span={8}><Card><Statistic title='高意向线索' value={assignStats.highIntent} /></Card></Col>
      <Col span={8}><Card><Statistic title='今日新分配' value={assignStats.todayAssigned} /></Card></Col>
    </Row>

    <Card className='mb12' title='分配规则'>
      <Radio.Group value={rule} onChange={(e)=>setRule(e.target.value)} options={[
        { label: '按国家匹配', value: 'country' },
        { label: '按顾问负载', value: 'load' },
        { label: '按转化率优先', value: 'convert' },
        { label: '手动分配', value: 'manual' }
      ]} />
    </Card>

    <Row gutter={[16,16]}>
      <Col span={9}>
        <Card className='advisor-pool-card' title='顾问池（可选）'>
          <List dataSource={advisors} renderItem={(a)=><List.Item className={`advisor-item ${selectedAdvisor===a.name?'active':''}`} onClick={()=>setSelectedAdvisor(a.name)}>
            <List.Item.Meta avatar={<Avatar>{a.name[0]}</Avatar>} title={<Space>{a.name}{selectedAdvisor===a.name&&<Tag color='blue'>已选中</Tag>}</Space>} description={<Space direction='vertical' size={2}><span>擅长国家：{a.countries}</span><span>擅长方向：{a.focus}</span><span>当前负载：{a.load} 单</span><span>最近接单量：{a.recentOrders} 单</span><span>历史转化率：<b>{a.convert}%</b></span><Progress percent={a.convert} size='small'/></Space>} />
          </List.Item>} />
        </Card>
      </Col>

      <Col span={9}>
        <Card title='线索摘要与分配建议'>
          <Descriptions column={1} items={[
            {label:'学生姓名',children:lead.studentName},
            {label:'来源渠道',children:lead.source},
            {label:'意向国家',children:lead.intentCountry},
            {label:'学历背景',children:lead.degree},
            {label:'线索评分',children:<Tag color='gold'>{lead.score}</Tag>},
            {label:'最近跟进',children:lead.lastFollowAt},
            {label:'当前状态',children:<StatusTag status={lead.status}/>}
          ]} />
          <Alert className='mt12' showIcon type='info' message='推荐分配说明' description={assignRecommendation} />
        </Card>
      </Col>

      <Col span={6}>
        <Card title='确认分配'>
          <p>分配规则：{rule}</p>
          <p>目标顾问：<b>{selectedAdvisor}</b></p>
          <p>线索编号：{lead.id}</p>
          <Button type='primary' block className='mt12'>确认分配</Button>
          <Button block className='mt12'>取消</Button>
        </Card>
      </Col>
    </Row>
  </>;
}
