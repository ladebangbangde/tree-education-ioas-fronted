import { Button, Card, Col, Empty, Form, Input, Progress, Row, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { applicationFlowsApi, type ApplicationFlow, type ApplicationStepStatus } from '@/api/applicationFlows';

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function ApplicationsKanbanPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<ApplicationFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const page = await applicationFlowsApi.list({ keyword: keyword || undefined, pageNum: 1, pageSize: 100 });
      setRows(page.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const columns = [
    { title: '客户', dataIndex: 'studentName', render: (v: string, r: ApplicationFlow) => <Button type='link' onClick={() => nav(`/applications/detail/${r.id}`)}>{v || r.studentNo || r.id}</Button> },
    { title: '客户编号', dataIndex: 'studentNo', render: (v: string) => v || '-' },
    { title: '负责顾问', dataIndex: 'ownerConsultantName', render: (v: string) => v || '-' },
    { title: '当前阶段', dataIndex: 'currentStep', render: (_: string, r: ApplicationFlow) => {
      const step = r.steps?.find(s => s.stepCode === r.currentStep) || r.steps?.[0];
      return step ? <Tag color={statusMap[step.status]?.color}>{step.stepName} · {statusMap[step.status]?.text}</Tag> : '-';
    }},
    { title: '进度', dataIndex: 'progressPercent', render: (v: number) => <Progress percent={v || 0} size='small' /> },
    { title: '材料数', render: (_: unknown, r: ApplicationFlow) => r.steps?.reduce((sum, s) => sum + (s.uploadedFileCount || 0), 0) || 0 },
    { title: '更新时间', dataIndex: 'updatedAt', render: fmt },
    { title: '操作', fixed: 'right' as const, width: 120, render: (_: unknown, r: ApplicationFlow) => <Button type='primary' onClick={() => nav(`/applications/detail/${r.id}`)}>进入流程</Button> }
  ];

  const active = rows.filter(r => !r.completed).length;
  const completed = rows.filter(r => r.completed).length;
  const avg = rows.length ? Math.round(rows.reduce((sum, r) => sum + (r.progressPercent || 0), 0) / rows.length) : 0;

  return <>
    <PageHeader title='申请流程看板' extra={<Button type='primary' onClick={() => nav('/students/list')}>从客户档案创建/进入流程</Button>} />
    <Row gutter={[16, 16]} className='mb12'>
      <Col span={8}><Card><div className='text-muted'>进行中流程</div><div style={{ fontSize: 28, fontWeight: 700 }}>{active}</div></Card></Col>
      <Col span={8}><Card><div className='text-muted'>已完成流程</div><div style={{ fontSize: 28, fontWeight: 700 }}>{completed}</div></Card></Col>
      <Col span={8}><Card><div className='text-muted'>平均进度</div><Progress percent={avg} /></Card></Col>
    </Row>
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户姓名/编号' /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Card>
      <Table rowKey='id' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} locale={{ emptyText: <Empty description='暂无申请流程。请先在线索列表生成客户档案，再从客户档案进入申请流程。' /> }} />
    </Card>
  </>;
}
