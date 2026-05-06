import { Card, Col, Descriptions, Row, Steps, Table, Tabs, Tag } from 'antd';
import { LeadTimeline, PageHeader, StatusTag } from '@/components';
import { appOverview, essayRows, materialRows, nodeLogs, riskCards, schoolRows } from '@/mock/applications';

export default function ApplicationsDetailPage(){
  return <>
    <PageHeader title='申请详情'/>
    <Card className='mb12'>
      <Descriptions column={3} items={[{label:'申请编号',children:appOverview.id},{label:'学生姓名',children:appOverview.student},{label:'国家',children:appOverview.country},{label:'目标院校',children:appOverview.targetSchools},{label:'当前阶段',children:<StatusTag status='申请中'/>},{label:'负责人',children:appOverview.owner}]} />
      <Steps current={2} items={['选校','文书','网申','Offer','签证','行前'].map(t=>({title:t}))} className='mt12'/>
    </Card>
    <Card>
      <Tabs items={[
        {key:'school',label:'院校清单',children:<Table rowKey='id' pagination={false} dataSource={schoolRows} columns={[{title:'院校',dataIndex:'school'},{title:'专业',dataIndex:'major'},{title:'状态',dataIndex:'status',render:(v:string)=><Tag color={v==='已提交'?'green':'blue'}>{v}</Tag>},{title:'截止时间',dataIndex:'deadline'}]} />},
        {key:'essay',label:'文书清单',children:<Table rowKey='id' pagination={false} dataSource={essayRows} columns={[{title:'文书名称',dataIndex:'name'},{title:'负责人',dataIndex:'owner'},{title:'状态',dataIndex:'status'},{title:'更新时间',dataIndex:'updated'}]} />},
        {key:'material',label:'材料清单',children:<Table rowKey='id' pagination={false} dataSource={materialRows} columns={[{title:'材料',dataIndex:'name'},{title:'状态',dataIndex:'status'},{title:'截止时间',dataIndex:'deadline'},{title:'负责人',dataIndex:'owner'}]} />},
        {key:'nodes',label:'节点记录',children:<LeadTimeline items={nodeLogs} />},
        {key:'risk',label:'风险提醒',children:<Row gutter={[16,16]}>{riskCards.map(r=><Col span={12} key={r.title}><Card type='inner' title={r.title} extra={<Tag color={r.level==='高'?'red':r.level==='中'?'orange':'green'}>{r.level}风险</Tag>}>{r.desc}</Card></Col>)}</Row>}
      ]} />
    </Card>
  </>
}
