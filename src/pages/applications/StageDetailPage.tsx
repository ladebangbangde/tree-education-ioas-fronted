import { Button, Card, Empty, Form, Input, Progress, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { applicationFlowsApi, type ApplicationFlow, type ApplicationStepCode, type ApplicationStepStatus } from '@/api/applicationFlows';

type StageRow = {
  key: string;
  flowId: number;
  studentName: string;
  studentNo?: string;
  ownerConsultantName: string;
  stepCode: ApplicationStepCode;
  stepName: string;
  status: ApplicationStepStatus;
  uploadedFileCount: number;
  note?: string;
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
};

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const stageMap: Record<string, { title: string; codes: ApplicationStepCode[] }> = {
  material: { title: '材料阶段详情', codes: ['PREPARE_MATERIALS'] },
  school: { title: '申请材料阶段详情', codes: ['PREPARE_MATERIALS'] },
  essay: { title: '申请材料阶段详情', codes: ['PREPARE_MATERIALS'] },
  online: { title: '学校申请阶段详情', codes: ['SCHOOL_OFFER'] },
  offer: { title: 'Offer阶段详情', codes: ['SCHOOL_OFFER'] },
  visa: { title: '签证阶段详情', codes: ['VISA_PROCESSING', 'VISA_PROCEDURES', 'VISA_APPROVED_TICKET'] },
  pre: { title: '签证获批与机票阶段详情', codes: ['VISA_APPROVED_TICKET'] },
  risk: { title: '流程风险提醒', codes: ['PREPARE_MATERIALS', 'SCHOOL_OFFER', 'VISA_PROCESSING', 'VISA_PROCEDURES', 'VISA_APPROVED_TICKET'] }
};

const stepText: Record<ApplicationStepCode, string> = {
  PREPARE_MATERIALS: '准备申请材料',
  SCHOOL_OFFER: '申请获批学校发Offer',
  VISA_PROCESSING: '签证办理',
  VISA_PROCEDURES: '完成签证相关手续',
  VISA_APPROVED_TICKET: '签证获批购买机票'
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function StageDetailPage() {
  const nav = useNavigate();
  const { stage = 'material' } = useParams();
  const config = stageMap[stage] || stageMap.material;
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

  useEffect(() => { load().catch(() => undefined); }, [stage]);

  const rows = useMemo<StageRow[]>(() => {
    const result: StageRow[] = [];
    flows.forEach(flow => flow.steps?.forEach(step => {
      if (!config.codes.includes(step.stepCode)) return;
      if (status && step.status !== status) return;
      result.push({
        key: `${flow.id}-${step.id}`,
        flowId: flow.id,
        studentName: flow.studentName,
        studentNo: flow.studentNo,
        ownerConsultantName: flow.ownerConsultantName,
        stepCode: step.stepCode,
        stepName: step.stepName || stepText[step.stepCode],
        status: step.status,
        uploadedFileCount: step.uploadedFileCount || 0,
        note: step.customerVisibleNote || step.consultantNote,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        progressPercent: flow.progressPercent || 0
      });
    }));
    const k = keyword.trim();
    return result.filter(item => !k || `${item.studentName}${item.studentNo || ''}${item.ownerConsultantName}${item.note || ''}${item.stepName}`.includes(k));
  }, [flows, keyword, status, stage]);

  const waiting = rows.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length;
  const completed = rows.filter(r => r.status === 'COMPLETED').length;
  const rejected = rows.filter(r => r.status === 'REJECTED').length;
  const avg = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.progressPercent, 0) / rows.length) : 0;

  const columns = [
    { title: '客户', render: (_: unknown, r: StageRow) => <Space direction='vertical' size={0}><b>{r.studentName}</b><span className='text-muted'>{r.studentNo || '-'}</span></Space> },
    { title: '流程阶段', dataIndex: 'stepName', render: (v: string, r: StageRow) => <Tag color={r.stepCode.startsWith('VISA') ? 'purple' : r.stepCode === 'SCHOOL_OFFER' ? 'gold' : 'blue'}>{v}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v: ApplicationStepStatus) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '材料数', dataIndex: 'uploadedFileCount', render: (v: number) => <Tag color={v > 0 ? 'green' : 'default'}>{v}</Tag> },
    { title: '整体进度', dataIndex: 'progressPercent', render: (v: number) => <Progress percent={v || 0} size='small' /> },
    { title: '负责顾问', dataIndex: 'ownerConsultantName', render: (v: string) => v || '-' },
    { title: '备注', dataIndex: 'note', render: (v: string) => v || '-' },
    { title: '开始时间', dataIndex: 'startedAt', render: fmt },
    { title: '完成时间', dataIndex: 'completedAt', render: fmt },
    { title: '操作', width: 120, render: (_: unknown, r: StageRow) => <Button type='primary' onClick={() => nav(`/applications/detail/${r.flowId}`)}>进入流程</Button> }
  ];

  return <>
    <PageHeader title={config.title} extra={<Button onClick={() => nav('/applications/kanban')}>返回流程看板</Button>} />
    <Space className='mb12' size={16} style={{ width: '100%' }}>
      <Card style={{ flex: 1 }}><div className='text-muted'>处理中</div><div style={{ fontSize: 28, fontWeight: 700 }}>{waiting}</div></Card>
      <Card style={{ flex: 1 }}><div className='text-muted'>已完成</div><div style={{ fontSize: 28, fontWeight: 700 }}>{completed}</div></Card>
      <Card style={{ flex: 1 }}><div className='text-muted'>异常/退回</div><div style={{ fontSize: 28, fontWeight: 700 }}>{rejected}</div></Card>
      <Card style={{ flex: 1 }}><div className='text-muted'>平均进度</div><Progress percent={avg} /></Card>
    </Space>
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户/编号/顾问/备注' allowClear /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 130 }} options={Object.entries(statusMap).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Card>
      <Table rowKey='key' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} locale={{ emptyText: <Empty description='暂无真实阶段数据。请先从客户档案进入申请流程并推进节点。' /> }} />
    </Card>
  </>;
}
