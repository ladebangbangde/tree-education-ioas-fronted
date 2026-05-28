import { Button, Card, Empty, Form, Input, Progress, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { applicationFlowsApi, type ApplicationFlow, type ApplicationStepStatus } from '@/api/applicationFlows';

type OfferRow = {
  key: string;
  flowId: number;
  studentName: string;
  studentNo?: string;
  ownerConsultantName: string;
  status: ApplicationStepStatus;
  progressPercent: number;
  note?: string;
  updatedAt?: string;
  offerFiles: number;
};

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function OffersPage() {
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

  const rows = useMemo<OfferRow[]>(() => flows.map(flow => {
    const step = flow.steps?.find(item => item.stepCode === 'SCHOOL_OFFER');
    const offerFiles = step?.attachments?.filter(file => file.attachmentType === 'OFFER_LETTER').length || 0;
    return {
      key: String(flow.id),
      flowId: flow.id,
      studentName: flow.studentName,
      studentNo: flow.studentNo,
      ownerConsultantName: flow.ownerConsultantName,
      status: step?.status || 'LOCKED',
      progressPercent: flow.progressPercent || 0,
      note: step?.customerVisibleNote || step?.consultantNote,
      updatedAt: step?.completedAt || step?.startedAt || flow.updatedAt,
      offerFiles
    };
  }).filter(row => {
    if (status && row.status !== status) return false;
    const k = keyword.trim();
    return !k || `${row.studentName}${row.studentNo || ''}${row.ownerConsultantName}${row.note || ''}`.includes(k);
  }), [flows, keyword, status]);

  const columns = [
    { title: '客户', render: (_: unknown, r: OfferRow) => <Space direction='vertical' size={0}><b>{r.studentName}</b><span className='text-muted'>{r.studentNo || '-'}</span></Space> },
    { title: 'Offer阶段状态', dataIndex: 'status', render: (v: ApplicationStepStatus) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '整体进度', dataIndex: 'progressPercent', render: (v: number) => <Progress percent={v || 0} size='small' /> },
    { title: 'Offer文件数', dataIndex: 'offerFiles', render: (v: number) => <Tag color={v > 0 ? 'green' : 'default'}>{v}</Tag> },
    { title: '负责顾问', dataIndex: 'ownerConsultantName', render: (v: string) => v || '-' },
    { title: '备注', dataIndex: 'note', render: (v: string) => v || '-' },
    { title: '更新时间', dataIndex: 'updatedAt', render: fmt },
    { title: '操作', width: 130, render: (_: unknown, r: OfferRow) => <Button type='primary' onClick={() => nav(`/applications/detail/${r.flowId}`)}>进入Offer阶段</Button> }
  ];

  return <>
    <PageHeader title='Offer管理' />
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户/编号/顾问/备注' allowClear /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 130 }} options={Object.entries(statusMap).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Card>
      <Table rowKey='key' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} locale={{ emptyText: <Empty description='暂无真实Offer流程数据。请先在申请流程中推进到Offer阶段。' /> }} />
    </Card>
  </>;
}
