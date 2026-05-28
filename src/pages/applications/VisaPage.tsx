import { Button, Card, Col, Empty, Form, Input, Progress, Row, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { applicationFlowsApi, type ApplicationFlow, type ApplicationStepStatus } from '@/api/applicationFlows';

type VisaRow = {
  key: string;
  flowId: number;
  studentName: string;
  studentNo?: string;
  ownerConsultantName: string;
  visaProcessing: ApplicationStepStatus;
  visaProcedures: ApplicationStepStatus;
  visaApprovedTicket: ApplicationStepStatus;
  visaFiles: number;
  progress: number;
  updatedAt?: string;
};

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
const tag = (v: ApplicationStepStatus) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>;

export default function VisaPage() {
  const nav = useNavigate();
  const [flows, setFlows] = useState<ApplicationFlow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ApplicationStepStatus>();
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const page = await applicationFlowsApi.list({ keyword: keyword || undefined, pageNum: 1, pageSize: 200 });
      setFlows(page.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const rows = useMemo<VisaRow[]>(() => flows.map(flow => {
    const processing = flow.steps?.find(s => s.stepCode === 'VISA_PROCESSING');
    const procedures = flow.steps?.find(s => s.stepCode === 'VISA_PROCEDURES');
    const ticket = flow.steps?.find(s => s.stepCode === 'VISA_APPROVED_TICKET');
    const visaFiles = [processing, procedures, ticket].reduce((sum, step) => sum + (step?.attachments?.length || 0), 0);
    const done = [processing, procedures, ticket].filter(step => step?.status === 'COMPLETED').length;
    return {
      key: String(flow.id),
      flowId: flow.id,
      studentName: flow.studentName,
      studentNo: flow.studentNo,
      ownerConsultantName: flow.ownerConsultantName,
      visaProcessing: processing?.status || 'LOCKED',
      visaProcedures: procedures?.status || 'LOCKED',
      visaApprovedTicket: ticket?.status || 'LOCKED',
      visaFiles,
      progress: Math.round(done * 100 / 3),
      updatedAt: ticket?.completedAt || ticket?.startedAt || procedures?.completedAt || procedures?.startedAt || processing?.completedAt || processing?.startedAt || flow.updatedAt
    };
  }).filter(row => {
    if (status && ![row.visaProcessing, row.visaProcedures, row.visaApprovedTicket].includes(status)) return false;
    const k = keyword.trim();
    return !k || `${row.studentName}${row.studentNo || ''}${row.ownerConsultantName}`.includes(k);
  }), [flows, keyword, status]);

  const waitingSubmit = rows.filter(r => r.visaProcessing === 'PENDING' || r.visaProcessing === 'IN_PROGRESS').length;
  const procedureDoing = rows.filter(r => r.visaProcedures === 'PENDING' || r.visaProcedures === 'IN_PROGRESS').length;
  const approved = rows.filter(r => r.visaApprovedTicket === 'COMPLETED').length;
  const avg = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.progress, 0) / rows.length) : 0;

  const columns = [
    { title: '客户', render: (_: unknown, r: VisaRow) => <Space direction='vertical' size={0}><b>{r.studentName}</b><span className='text-muted'>{r.studentNo || '-'}</span></Space> },
    { title: '签证办理', dataIndex: 'visaProcessing', render: tag },
    { title: '完成签证手续', dataIndex: 'visaProcedures', render: tag },
    { title: '获批/机票', dataIndex: 'visaApprovedTicket', render: tag },
    { title: '签证材料数', dataIndex: 'visaFiles', render: (v: number) => <Tag color={v > 0 ? 'green' : 'default'}>{v}</Tag> },
    { title: '签证进度', dataIndex: 'progress', render: (v: number) => <Progress percent={v} size='small' /> },
    { title: '负责顾问', dataIndex: 'ownerConsultantName', render: (v: string) => v || '-' },
    { title: '更新时间', dataIndex: 'updatedAt', render: fmt },
    { title: '操作', width: 130, render: (_: unknown, r: VisaRow) => <Button type='primary' onClick={() => nav(`/applications/detail/${r.flowId}`)}>进入签证流程</Button> }
  ];

  return <>
    <PageHeader title='签证管理' />
    <Row gutter={[16, 16]} className='mb12'>
      <Col span={6}><Card><div className='text-muted'>待递签/办理中</div><div style={{ fontSize: 28, fontWeight: 700 }}>{waitingSubmit}</div></Card></Col>
      <Col span={6}><Card><div className='text-muted'>签证手续处理中</div><div style={{ fontSize: 28, fontWeight: 700 }}>{procedureDoing}</div></Card></Col>
      <Col span={6}><Card><div className='text-muted'>已获批并买票</div><div style={{ fontSize: 28, fontWeight: 700 }}>{approved}</div></Card></Col>
      <Col span={6}><Card><div className='text-muted'>平均签证进度</div><Progress percent={avg} /></Card></Col>
    </Row>
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户/编号/顾问' allowClear /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 150 }} options={Object.entries(statusMap).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Card>
      <Table rowKey='key' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} locale={{ emptyText: <Empty description='暂无真实签证流程数据。请先在申请流程中推进到签证阶段。' /> }} />
    </Card>
  </>;
}
