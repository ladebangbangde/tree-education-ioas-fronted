import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const statusText: Record<string, string> = {
  unassigned: '未分配',
  assigned: '已分配',
  following: '跟进中',
  converted: '已转化',
  closed: '已关闭'
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function LeadsListPage() {
  const nav = useNavigate();
  const role = useAuthStore(s => s.role);
  const isConsultant = role === 'CONSULTANT';
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [editing, setEditing] = useState<LeadRow>();
  const [editForm] = Form.useForm();

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

  useEffect(() => { load().catch(() => undefined); }, [role]);

  const openEdit = (record: LeadRow) => {
    setEditing(record);
    editForm.setFieldsValue({
      status: record.status,
      phone: record.phone,
      wechat: record.wechat,
      budget: record.budget,
      remark: record.remark
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

  const deleteLead = async (record: LeadRow) => {
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
        width: 160,
        render: (_: unknown, r: LeadRow) => <Space>
          <Button type='link' onClick={() => openEdit(r)}>修改</Button>
          <Popconfirm title='确认删除这条线索？这是真实数据删除，不可恢复。' onConfirm={() => deleteLead(r)}>
            <Button type='link' danger>删除</Button>
          </Popconfirm>
        </Space>
      }
    ];
    if (!isConsultant) {
      base.splice(7, 0, { title: '跟进顾问', dataIndex: 'assignedToName', render: (v: string) => v || '-' } as any);
    }
    return base;
  }, [isConsultant]);

  return <>
    <PageHeader title={isConsultant ? '我的线索' : '线索中心 / 线索列表'} />
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder='姓名/手机号/编号' /></Form.Item>
        <Form.Item label='意向区域'><Select allowClear style={{ width: 120 }} options={[{ value: '欧洲' }, { value: '英国' }, { value: '美国' }, { value: '澳洲' }, { value: '其他' }]} /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 120 }} options={[{ label: '未分配', value: 'unassigned' }, { label: '已分配', value: 'assigned' }, { label: '跟进中', value: 'following' }, { label: '已转化', value: 'converted' }, { label: '已关闭', value: 'closed' }]} /></Form.Item>
        <Form.Item label='生成时间'><DatePicker.RangePicker disabled /></Form.Item>
        <Button type='primary' onClick={() => load()}>搜索</Button>
        <Button onClick={() => { setKeyword(''); setStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <DataTable rowKey='id' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} />
    <Modal title='修改线索' open={Boolean(editing)} onCancel={() => setEditing(undefined)} onOk={submitEdit} okText='保存' cancelText='取消'>
      <Form form={editForm} layout='vertical'>
        <Form.Item label='状态' name='status'><Select options={[{ label: '已分配', value: 'assigned' }, { label: '跟进中', value: 'following' }, { label: '已转化', value: 'converted' }, { label: '已关闭', value: 'closed' }]} /></Form.Item>
        <Form.Item label='电话' name='phone'><Input /></Form.Item>
        <Form.Item label='微信' name='wechat'><Input /></Form.Item>
        <Form.Item label='预算' name='budget'><Input /></Form.Item>
        <Form.Item label='备注' name='remark'><Input.TextArea rows={4} /></Form.Item>
      </Form>
    </Modal>
  </>;
}
