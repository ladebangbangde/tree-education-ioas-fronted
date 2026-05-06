import { Card, Col, Progress, Row, Table, Tag } from 'antd';
import { PageHeader } from '@/components';
import { visaCases } from '@/mock/applications';

export default function VisaPage(){
  return <>
    <PageHeader title='签证管理'/>
    <Row gutter={[16,16]} className='mb12'>
      <Col span={8}><Card title='签证总览'><p>待递签：6</p><p>面签待安排：4</p><p>已出签：12</p></Card></Col>
      <Col span={8}><Card title='材料准备度'><Progress percent={74} /></Card></Col>
      <Col span={8}><Card title='行前关联'><p>住宿确认：9/14</p><p>机票确认：7/14</p><p>接机登记：6/14</p></Card></Col>
    </Row>
    <Card>
      <Table rowKey='id' pagination={false} dataSource={visaCases} columns={[
        {title:'学生',dataIndex:'student'},{title:'签证状态',dataIndex:'status'},{title:'材料进度',dataIndex:'progress',render:(v:number)=><Progress percent={v} size='small'/>},{title:'面签时间',dataIndex:'interview'},{title:'风险标签',dataIndex:'risk',render:(v:string)=><Tag color={v==='高'?'red':v==='中'?'orange':'green'}>{v}风险</Tag>},{title:'行前关联',dataIndex:'preDeparture'}
      ]} />
    </Card>
  </>
}
