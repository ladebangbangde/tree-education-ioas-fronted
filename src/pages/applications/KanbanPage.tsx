import { Alert, Card, Col, List, Row, Tag } from 'antd';
import { ApplicationStageCard, PageHeader, TaskListCard } from '@/components';
import { kanbanColumns, kanbanData } from '@/mock/applications';
import { tasks } from '@/mock/tasks';

export default function ApplicationsKanbanPage(){
  return <>
    <PageHeader title='申请交付看板'/>
    <Row gutter={12}>
      {kanbanColumns.map(c=><Col span={4} key={c}><Card title={c} bodyStyle={{padding:8}}>{kanbanData[c as keyof typeof kanbanData].map(s=><div key={s.name}><ApplicationStageCard {...s} /><Tag color='orange'>{s.alert}</Tag></div>)}</Card></Col>)}
      <Col span={24} className='mt12'>
        <Row gutter={12}>
          <Col span={8}><TaskListCard title='今日待办' data={tasks.todo}/></Col>
          <Col span={8}><TaskListCard title='超期任务' data={tasks.timeout}/></Col>
          <Col span={8}><Card title='风险提醒'><List size='small' dataSource={['张成业：资金证明需更新','周可欣：推荐信签字延误','沈悦：面签材料缺体检回执']} renderItem={i=><List.Item><Alert type='warning' showIcon message={i}/></List.Item>}/></Card></Col>
        </Row>
      </Col>
    </Row>
  </>
}
