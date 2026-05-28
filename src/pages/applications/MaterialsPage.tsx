import { Button, Card, Empty, Form, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { applicationFlowsApi, type ApplicationAttachment, type ApplicationFlow, type ApplicationStepCode, type ApplicationStepStatus } from '@/api/applicationFlows';

type MaterialRow = ApplicationAttachment & {
  key: string;
  flowId: number;
  studentName: string;
  studentNo?: string;
  stepName: string;
  stepCode: ApplicationStepCode;
  stepStatus: ApplicationStepStatus;
  ownerConsultantName: string;
};

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const stepText: Record<ApplicationStepCode, string> = {
  PREPARE_MATERIALS: '准备申请材料',
  SCHOOL_OFFER: '申请获批学校发Offer',
  VISA_PROCESSING: '签证办理',
  VISA_PROCEDURES: '完成签证相关手续',
  VISA_APPROVED_TICKET: '签证获批购买机票'
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function MaterialsPage() {
  const nav = useNavigate();
  const [flows, setFlows] = useState<ApplicationFlow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [stepCode, setStepCode] = useState<ApplicationStepCode>();
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

  const rows = useMemo<MaterialRow[]>(() => {
    const result: MaterialRow[] = [];
    flows.forEach(flow => flow.steps?.forEach(step => {
      if (stepCode && step.stepCode !== stepCode) return;
      if (status && step.status !== status) return;
      step.attachments?.forEach(file => result.push({
        ...file,
        key: `${flow.id}-${step.id}-${file.id}`,
        flowId: flow.id,
        studentName: flow.studentName,
        studentNo: flow.studentNo,
        stepName: step.stepName,
        stepCode: step.stepCode,
        stepStatus: step.status,
        ownerConsultantName: flow.ownerConsultantName
      }));
    }));
    const k = keyword.trim();
    return result.filter(item => !k || `${item.studentName}${item.studentNo || ''}${item.originalFilename}${item.note || ''}${item.stepName}`.includes(k));
  }, [flows, keyword, stepCode, status]);

  const columns = [
    { title: '客户', render: (_: unknown, r: MaterialRow) => <Space direction='vertical' size={0}><b>{r.studentName}</b><span className='text-muted'>{r.studentNo || '-'}</span></Space> },
    { title: '流程阶段', dataIndex: 'stepName', render: (v: string, r: MaterialRow) => <Tag color={r.stepCode === 'SCHOOL_OFFER' ? 'gold' : r.stepCode.startsWith('VISA') ? 'purple' : 'blue'}>{v}</Tag> },
    { title: '阶段状态', dataIndex: 'stepStatus', render: (v: ApplicationStepStatus) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '材料类型', dataIndex: 'attachmentType' },
    { title: '文件名', dataIndex: 'originalFilename', render: (v: string, r: MaterialRow) => r.fileUrl ? <a href={r.fileUrl} target='_blank' rel='noreferrer'>{v}</a> : v },
    { title: '大小', dataIndex: 'sizeBytes', render: (v: number) => v ? `${(v / 1024 / 1024).toFixed(2)} MB` : '-' },
    { title: '上传人', dataIndex: 'uploadedByName', render: (v: string, r: MaterialRow) => v || r.ownerConsultantName || '-' },
    { title: '上传时间', dataIndex: 'createdAt', render: fmt },
    { title: '说明', dataIndex: 'note', render: (v: string) => v || '-' },
    { title: '操作', width: 120, render: (_: unknown, r: MaterialRow) => <Button type='link' onClick={() => nav(`/applications/detail/${r.flowId}`)}>查看流程</Button> }
  ];

  return <>
    <PageHeader title='材料清单' />
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户/编号/文件名/备注' allowClear /></Form.Item>
        <Form.Item label='阶段'><Select allowClear value={stepCode} onChange={setStepCode} style={{ width: 210 }} options={Object.entries(stepText).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 130 }} options={Object.entries(statusMap).map(([value, meta]) => ({ value, label: meta.text }))} /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setStepCode(undefined); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Card>
      <Table rowKey='key' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} locale={{ emptyText: <Empty description='暂无真实材料。请进入申请流程详情页上传材料。' /> }} />
    </Card>
  </>;
}
