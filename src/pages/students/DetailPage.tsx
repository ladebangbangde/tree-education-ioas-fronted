import { Avatar, Card, Col, Descriptions, List, Progress, Row, Space, Table, Tabs, Tag } from 'antd';
import { PageHeader, StatusTag, StudentOverviewCard } from '@/components';
import { studentBackground, studentContract, studentFollowRecords, studentMaterials, studentPlan, students, studentTodos } from '@/mock/students';
import { LeadTimeline } from '@/components';

export default function StudentsDetailPage(){
  const st = students[0];
  const materialColumns=[{title:'材料名称',dataIndex:'name'},{title:'状态',dataIndex:'status',render:(v:string)=><StatusTag status={v}/>},{title:'截止时间',dataIndex:'deadline'},{title:'负责人',dataIndex:'owner'},{title:'备注',dataIndex:'remark'}];

  return <>
    <PageHeader title='学生档案详情' />
    <Row gutter={[16,16]}>
      <Col span={18}>
        <Card className='mb12'>
          <Space align='start' size={16}>
            <Avatar size={64}>{st.name[0]}</Avatar>
            <div>
              <h2>{st.name} <Tag color='blue'>{st.term}</Tag> <StatusTag status={st.status} /></h2>
              <Space wrap>
                <span>目标国家：{st.country}</span>
                <span>当前阶段：{st.stage}</span>
                <span>顾问：{st.advisor}</span>
                <span>本科：{st.university}</span>
              </Space>
            </div>
          </Space>
        </Card>

        <Card>
          <Tabs items={[
            {key:'basic',label:'基本信息',children:<Descriptions column={2} items={[
              {label:'姓名',children:st.name},{label:'性别',children:st.gender},{label:'生日',children:st.birthday},{label:'联系方式',children:st.phone},
              {label:'邮箱',children:st.email},{label:'本科院校',children:st.university},{label:'专业',children:st.major},{label:'GPA',children:st.gpa},
              {label:'语言成绩',children:`雅思 ${st.ielts}`},{label:'预算',children:st.budget},{label:'目标方向',children:st.target}
            ]}/>},
            {key:'bg',label:'背景资料',children:<>
              <Card type='inner' title='教育背景' className='mb12'><List dataSource={studentBackground.education} renderItem={i=><List.Item>{i}</List.Item>}/></Card>
              <Card type='inner' title='实习经历' className='mb12'><List dataSource={studentBackground.internships} renderItem={i=><List.Item>{i}</List.Item>}/></Card>
              <Card type='inner' title='科研经历' className='mb12'><List dataSource={studentBackground.research} renderItem={i=><List.Item>{i}</List.Item>}/></Card>
              <Card type='inner' title='竞赛经历' className='mb12'><List dataSource={studentBackground.awards} renderItem={i=><List.Item>{i}</List.Item>}/></Card>
              <Card type='inner' title='补充说明'>{studentBackground.notes}</Card>
            </>},
            {key:'plan',label:'申请方案',children:<Descriptions column={1} items={[
              {label:'国家方案',children:studentPlan.countryPlan},{label:'专业方向',children:studentPlan.majorDirection},{label:'院校梯度',children:studentPlan.schoolTier},
              {label:'冲刺院校',children:studentPlan.schools.sprint.join('；')},{label:'主申院校',children:studentPlan.schools.main.join('；')},{label:'保底院校',children:studentPlan.schools.safe.join('；')}
            ]}/>},
            {key:'contract',label:'合同信息',children:<Descriptions column={2} items={[
              {label:'签约时间',children:studentContract.signAt},{label:'套餐',children:studentContract.pkg},{label:'合同金额',children:studentContract.amount},{label:'当前支付状态',children:studentContract.paymentStatus},{label:'付款节点',children:studentContract.paymentNodes.join(' | ')}
            ]}/>},
            {key:'materials',label:'材料清单',children:<Table rowKey='id' columns={materialColumns} dataSource={studentMaterials} pagination={false}/>},
            {key:'follow',label:'跟进记录',children:<LeadTimeline items={studentFollowRecords} />}
          ]} />
        </Card>

        <Card className='mt12' title='进度与近期安排'>
          <Row gutter={[16,16]}>
            <Col span={8}><p>材料完成率</p><Progress percent={75} /></Col>
            <Col span={8}><p>申请整体进度</p><Progress percent={62} status='active' /></Col>
            <Col span={8}><p>近期待办</p><List size='small' dataSource={studentTodos} renderItem={i=><List.Item>{i}</List.Item>} /></Col>
          </Row>
        </Card>
      </Col>
      <Col span={6}>
        <StudentOverviewCard/>
        <Card className='mt12' title='风险等级'><Tag color='orange'>中风险</Tag><p className='mt12'>推荐信签字存在延期风险，需要在 2026-05-12 前完成。</p></Card>
      </Col>
    </Row>
  </>
}
