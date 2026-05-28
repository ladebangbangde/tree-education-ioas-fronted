import { Button, Card, Empty, Form, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { applicationFlowsApi, type ApplicationFlow, type ApplicationStepStatus } from '@/api/applicationFlows';
import { studentsApi } from '@/api/students';

type CustomerRow = { id: number | string; studentNo?: string; studentName?: string; ownerConsultantName?: string; createdAt?: string; updatedAt?: string };
type RecordRow = { id: string; customerName: string; customerNo?: string; module: string; action: string; content: string; operator?: string; time?: string; status?: ApplicationStepStatus; flowId?: number };

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function LeadsFollowPage() {
  const nav = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ApplicationStepStatus>();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [flows, setFlows] = useState<ApplicationFlow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [customerPage, flowPage] = await Promise.all([
        studentsApi.list({ keyword: keyword || undefined, profileStatus: 'ACTIVE', pageNum: 1, pageSize: 200 }),
        applicationFlowsApi.list({ keyword: keyword || undefined, pageNum: 1, pageSize: 200 })
      ]);
      setCustomers(customerPage.records || []);
      setFlows(flowPage.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const rows = useMemo<RecordRow[]>(() => {
    const data: RecordRow[] = [];
    customers.forEach(c => data.push({ id: `customer-${c.id}`, customerName: c.studentName || '-', customerNo: c.studentNo, module: '客户档案', action: '客户档案已生成/更新', content: '该客户已从线索转为正式客资，可进入申请流程。', operator: c.ownerConsultantName, time: c.updatedAt || c.createdAt }));
    flows.forEach(flow => flow.steps?.forEach(step => {
      if (status && step.status !== status) return;
      data.push({ id: `step-${flow.id}-${step.id}`, customerName: flow.studentName, customerNo: flow.studentNo, module: '申请流程', action: step.stepName, content: step.customerVisibleNote || step.consultantNote || `已上传材料 ${step.uploadedFileCount || 0} 份`, operator: flow.ownerConsultantName, time: step.completedAt || step.startedAt || flow.updatedAt, status: step.status, flowId: flow.id });
      step.attachments?.forEach(file => data.push({ id: `file-${file.id}`, customerName: flow.studentName, customerNo: flow.studentNo, module: '流程材料', action: file.originalFilename, content: file.note || file.attachmentType, operator: file.uploadedByName || flow.ownerConsultantName, time: file.createdAt, flowId: flow.id }));
    }));
    return data.sort((a, b) => dayjs(b.time || 0).valueOf() - dayjs(a.time || 0).valueOf());
  }, [customers, flows, status]);

  const filtered = rows.filter(r => !keyword.trim() || `${r.customerName}${r.customerNo || ''}${r.module}${r.action}${r.content}`.includes(keyword.trim()));

  const columns = [
    { title: '客户', render: (_: unknown, r: RecordRow) => <Space direction='vertical' size={0}><b>{r.customerName}</b><span className='text-muted'>{r.customerNo || '-'}</span></Space> },
    { title: '模块', dataIndex: 'module', render: (v: string) => <Tag color={v === '申请流程' ? 'blue' : v === '流程材料' ? 'purple' : 'green'}>{v}</Tag> },
    { title: '操作/节点', dataIndex: 'action' },
    { title: '状态', dataIndex: 'status', render: (v: ApplicationStepStatus) => v ? <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> : '-' },
    { title: '内容', dataIndex: 'content', render: (v: string) => v || '-' },
    { title: '操作人', dataIndex: 'operator', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'time', render: fmt },
    { title: '操作', width: 120, render: (_: unknown, r: RecordRow) => r.flowId ? <Button type='link' onClick={() => nav(`/applications/detail/${r.flowId}`)}>查看流程</Button> : <Button type='link' onClick={() => nav('/students/list')}>客户档案</Button> }
  ];

  return <>
    <PageHeader title='客资操作记录' />
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户姓名/编号/流程节点' allowClear /></Form.Item>
        <Form.Item label='节点状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 150 }} options={Object.entries(statusMap).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Card>
      <Table rowKey='id' columns={columns as any} dataSource={filtered} loading={loading} pagination={{ total: filtered.length, showSizeChanger: true }} locale={{ emptyText: <Empty description='暂无客资操作记录。请先从线索生成客户档案，再进入申请流程。' /> }} />
    </Card>
  </>;
}
