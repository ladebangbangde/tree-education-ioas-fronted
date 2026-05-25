import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { DataTable, PageHeader, SearchFilterBar, StatusTag } from '@/components';
import { leadsApi } from '@/api/leads';
import { useAuthStore } from '@/store/auth';

type LeadRow = {
  id: number | string;
  leadNo?: string;
  studentName?: string;
  targetCountry?: string;
  intentionRegionName?: string;
  degreeLevel?: string;
  sourceChannel?: string;
  sourceType?: string;
  status?: string;
  assignedToName?: string;
  createdAt?: string;
  updatedAt?: string;
  phone?: string;
  wechat?: string;
  budget?: string;
  remark?: string;
};

type ConsultantOption = { id: number | string; username?: string; displayName?: string };
type TransferRequest = {
  id: number | string;
  leadId: number | string;
  leadNo?: string;
  studentName?: string;
  fromConsultantName?: string;
  toConsultantName?: string;
  reason?: string;
  status?: string;
  requestedAt?: string;
};

const statusText: Record<string, string> = {
  unassigned: '未分配',
  assigned: '已分配',
  following: '跟进中',
  confirmed: '已确认',
  converted: '已转化',
  completed: '已完成',
  invalid: '无效',
  closed: '已关闭'
};

const transferStatusText: Record<string, string> = {
  PENDING: '待确认',
  ACCEPTED: '已同意',
  REJECTED: '已拒绝',
  CANCELLED: '已取消'
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
const canConvert = (record: LeadRow) => ['assigned', 'following', 'confirmed'].includes(record.status || '');

export default function LeadsListPage() {
  const role = useAuthStore(s => s.role);
  const isConsultant = role === 'CONSULTANT';
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [editing, setEditing] = useState<LeadRow>();
  const [transferring, setTransferring] = useState<LeadRow>();
  const [converting, setConverting] = useState<LeadRow>();
  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<TransferRequest[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [editForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [convertForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const page = await leadsApi.list({ tab: isConsultant ? 'mine' : undefined, keyword: keyword || undefined, pageNum: 1, pageSize: 100 });
      let data = page.records || [];
      if (status) data = data.filter((item: LeadRow) => item.status === status);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    if (!isConsultant) return;
    setLoadingTransfers(true);
    try {
      const [targetConsultants, transfers] = await Promise.all([
        leadsApi.consultants(),
        leadsApi.transferRequests('received')
      ]);
      setConsultants(targetConsultants || []);
      setReceivedTransfers((transfers || []).filter((item: TransferRequest) => item.status === 'PENDING'));
    } finally {
      setLoadingTransfers(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
    loadTransfers().catch(() => undefined);
  }, [role]);

  const openEdit = (record: LeadRow) => {
    setEditing(record);
    editForm.setFieldsValue({ status: record.status, phone: record.phone, wechat: record.wechat, budget: record.budget, remark: record.remark });
  };

  const openTransfer = (record: LeadRow) => {
    setTransferring(record);
    transferForm.resetFields();
  };

  const openConvert = (record: LeadRow) => {
    setConverting(record);
    convertForm.setFieldsValue({
      educationLevel: record.degreeLevel,
      targetMajor: undefined,
      budget: record.budget,
      confirmRemark: undefined
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields();
    await leadsApi.update(String(editing.id), values);
    message.success('线索已修改');
    setEditing(undefined);
    await load();
  };

  const submitTransfer = async () => {
    if (!transferring) return;
    const values = await transferForm.validateFields();
    await leadsApi.createTransferRequest(String(transferring.id), values);
    message.success('转让申请已发送，等待对方顾问确认');
    setTransferring(undefined);
    await loadTransfers();
  };

  const submitConvert = async () => {
    if (!converting) return;
    const values = await convertForm.validateFields();
    await leadsApi.convertToStudent(String(converting.id), values);
    message.success('学生档案已生成');
    setConverting(undefined);
    await load();
  };

  const acceptTransfer = async (record: TransferRequest) => {
    await leadsApi.acceptTransferRequest(String(record.id));
    message.success('已接收线索');
    await Promise.all([load(), loadTransfers()]);
  };

  const rejectTransfer = async (record: TransferRequest) => {
    await leadsApi.rejectTransferRequest(String(record.id));
    message.success('已拒绝转让');
    await loadTransfers();
  };

  const deleteLead = async (record: LeadRow) => {
    if (record.status === 'converted') {
      message.warning('已转化线索不能删除，请到学生档案中查看');
      return;
    }
    await leadsApi.delete(String(record.id));
    message.success('线索已删除');
    await load();
  };

  const columns = useMemo(() => {
    const base = [
      { title: '线索编号', dataIndex: 'leadNo', render: (v: string, r: LeadRow) => v || r.id },
      { title: '学生姓名', dataIndex: 'studentName' },
      { title: '意向区域', render: (_: unknown, r: LeadRow) => r.intentionRegionName || r.targetCountry || '-' },
      { title: '学历背景', dataIndex: 'degreeLevel', render: (v: string) => v || '-' },
      { title: '来源渠道', render: (_: unknown, r: LeadRow) => r.sourceChannel || r.sourceType || '-' },
      { title: '线索评分', render: () => '-' },
      { title: '当前状态', dataIndex: 'status', render: (v: string) => <StatusTag status={statusText[v] || v || '未知'} /> },
      { title: '生成时间', dataIndex: 'createdAt', render: fmt },
      {
        title: '操作',
        fixed: 'right' as const,
        width: isConsultant ? 290 : 180,
        render: (_: unknown, r: LeadRow) => <Space>
          <Button type='link' onClick={() => openEdit(r)}>修改</Button>
          {isConsultant && <Button type='link' onClick={() => openTransfer(r)} disabled={r.status === 'converted'}>转让</Button>}
          {isConsultant && canConvert(r) && <Button type='link' onClick={() => openConvert(r)}>生成档案</Button>}
          <Popconfirm title='确认删除这条线索？这是真实数据删除，不可恢复。' onConfirm={() => deleteLead(r)}>
            <Button type='link' danger disabled={r.status === 'converted'}>删除</Button>
          </Popconfirm>
        </Space>
      }
    ];
    if (!isConsultant) base.splice(7, 0, { title: '跟进顾问', dataIndex: 'assignedToName', render: (v: string) => v || '-' } as any);
    return base;
  }, [isConsultant]);

  const transferColumns = [
    { title: '线索编号', dataIndex: 'leadNo', render: (v: string, r: TransferRequest) => v || r.leadId },
    { title: '学生姓名', dataIndex: 'studentName', render: (v: string) => v || '-' },
    { title: '转出顾问', dataIndex: 'fromConsultantName', render: (v: string) => v || '-' },
    { title: '申请理由', dataIndex: 'reason', render: (v: string) => v || '-' },
    { title: '申请时间', dataIndex: 'requestedAt', render: fmt },
    { title: '状态', dataIndex: 'status', render: (v: string) => <StatusTag status={transferStatusText[v] || v || '未知'} /> },
    { title: '操作', width: 150, render: (_: unknown, r: TransferRequest) => <Space><Popconfirm title='确认接收这条线索？接收后线索会转到你名下。' onConfirm={() => acceptTransfer(r)}><Button type='link'>同意</Button></Popconfirm><Popconfirm title='确认拒绝这条转让申请？拒绝后线索仍归原顾问。' onConfirm={() => rejectTransfer(r)}><Button type='link' danger>拒绝</Button></Popconfirm></Space> }
  ];

  const listContent = <>
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder='姓名/手机号/编号' /></Form.Item>
        <Form.Item label='意向区域'><Select allowClear style={{ width: 120 }} options={[{ value: '欧洲' }, { value: '英国' }, { value: '美国' }, { value: '澳洲' }, { value: '其他' }]} /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 120 }} options={[{ label: '未分配', value: 'unassigned' }, { label: '已分配', value: 'assigned' }, { label: '跟进中', value: 'following' }, { label: '已确认', value: 'confirmed' }, { label: '已转化', value: 'converted' }, { label: '无效', value: 'invalid' }, { label: '已关闭', value: 'closed' }]} /></Form.Item>
        <Form.Item label='生成时间'><DatePicker.RangePicker disabled /></Form.Item>
        <Button type='primary' onClick={() => load()}>搜索</Button>
        <Button onClick={() => { setKeyword(''); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <DataTable rowKey='id' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} />
  </>;

  return <>
    <PageHeader title={isConsultant ? '我的线索' : '线索中心 / 线索列表'} />
    {isConsultant ? <Tabs items={[{ key: 'mine', label: '我的线索', children: listContent }, { key: 'transfer', label: `待我确认${receivedTransfers.length ? ` (${receivedTransfers.length})` : ''}`, children: <Card><Table rowKey='id' columns={transferColumns as any} dataSource={receivedTransfers} loading={loadingTransfers} pagination={false} /></Card> }]} /> : listContent}
    <Modal title='修改线索' open={Boolean(editing)} onCancel={() => setEditing(undefined)} onOk={submitEdit} okText='保存' cancelText='取消'>
      <Form form={editForm} layout='vertical'>
        <Form.Item label='状态' name='status'><Select options={[{ label: '已分配', value: 'assigned' }, { label: '跟进中', value: 'following' }, { label: '已确认', value: 'confirmed' }, { label: '已转化', value: 'converted' }, { label: '无效', value: 'invalid' }, { label: '已关闭', value: 'closed' }]} /></Form.Item>
        <Form.Item label='电话' name='phone'><Input /></Form.Item>
        <Form.Item label='微信' name='wechat'><Input /></Form.Item>
        <Form.Item label='预算' name='budget'><Input /></Form.Item>
        <Form.Item label='备注' name='remark'><Input.TextArea rows={4} /></Form.Item>
      </Form>
    </Modal>
    <Modal title='转让线索' open={Boolean(transferring)} onCancel={() => setTransferring(undefined)} onOk={submitTransfer} okText='发送转让申请' cancelText='取消'>
      <Form form={transferForm} layout='vertical'>
        <Form.Item label='当前线索'><Input value={transferring?.studentName || transferring?.leadNo || ''} disabled /></Form.Item>
        <Form.Item label='目标顾问' name='toConsultantId' rules={[{ required: true, message: '请选择目标顾问' }]}><Select placeholder='请选择要转让给哪位顾问' options={consultants.map(item => ({ label: item.displayName || item.username || item.id, value: item.id }))} /></Form.Item>
        <Form.Item label='转让理由' name='reason'><Input.TextArea rows={4} placeholder='例如：学生目标区域更适合该顾问跟进' /></Form.Item>
      </Form>
    </Modal>
    <Modal title='确认生成学生档案' open={Boolean(converting)} onCancel={() => setConverting(undefined)} onOk={submitConvert} okText='确认生成' cancelText='取消'>
      <Form form={convertForm} layout='vertical'>
        <Form.Item label='学生姓名'><Input value={converting?.studentName || ''} disabled /></Form.Item>
        <Form.Item label='电话'><Input value={converting?.phone || ''} disabled /></Form.Item>
        <Form.Item label='微信'><Input value={converting?.wechat || ''} disabled /></Form.Item>
        <Form.Item label='学历' name='educationLevel'><Input placeholder='例如：本科毕业' /></Form.Item>
        <Form.Item label='目标专业' name='targetMajor'><Input placeholder='例如：Data Science' /></Form.Item>
        <Form.Item label='预算' name='budget'><Input /></Form.Item>
        <Form.Item label='确认备注' name='confirmRemark' rules={[{ required: true, message: '请填写确认备注' }]}><Input.TextArea rows={4} placeholder='例如：已电话沟通，学生明确计划申请英国硕士' /></Form.Item>
      </Form>
    </Modal>
  </>;
}
