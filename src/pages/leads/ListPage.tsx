import { Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Modal, Popconfirm, Select, Space, Typography, message } from 'antd';
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
  intentionRegionCode?: string;
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
  targetMajor?: string;
  sourcePage?: string;
  assignMode?: string;
  assignReason?: string;
  assignedAt?: string;
  convertedStudentId?: number | string;
  convertedAt?: string;
};

type FilterState = { keyword: string; status?: string; region?: string; dateRange?: any };

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

const regionOptions = [
  { label: '欧洲', value: '欧洲' },
  { label: '英国', value: '英国' },
  { label: '美国', value: '美国' },
  { label: '澳洲', value: '澳洲' },
  { label: '加拿大', value: '加拿大' },
  { label: '其他', value: '其他' }
];

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
const canConvert = (record: LeadRow) => ['assigned', 'following', 'confirmed'].includes(record.status || '') && !record.convertedStudentId;

function applyLocalFilters(data: LeadRow[], filters: FilterState) {
  return data.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.region) {
      const regionText = `${item.intentionRegionName || ''}${item.intentionRegionCode || ''}${item.targetCountry || ''}`;
      if (!regionText.includes(filters.region)) return false;
    }
    if (filters.dateRange?.[0] && filters.dateRange?.[1] && item.createdAt) {
      const created = dayjs(item.createdAt);
      if (created.isBefore(filters.dateRange[0].startOf('day')) || created.isAfter(filters.dateRange[1].endOf('day'))) return false;
    }
    return true;
  });
}

export default function LeadsListPage() {
  const role = useAuthStore(s => s.role);
  const isConsultant = role === 'CONSULTANT';
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [region, setRegion] = useState<string>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [editing, setEditing] = useState<LeadRow>();
  const [converting, setConverting] = useState<LeadRow>();
  const [detail, setDetail] = useState<LeadRow>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [convertForm] = Form.useForm();

  const currentFilters = (): FilterState => ({ keyword, status, region, dateRange });

  const load = async (override?: Partial<FilterState>) => {
    const filters = { ...currentFilters(), ...override };
    setLoading(true);
    try {
      const page = await leadsApi.list({ tab: isConsultant ? 'mine' : undefined, keyword: filters.keyword || undefined, pageNum: 1, pageSize: 200 });
      setRows(applyLocalFilters(page.records || [], filters));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [role]);

  const openDetail = async (record: LeadRow) => {
    setDetail(record);
    setDetailLoading(true);
    try {
      const latest = await leadsApi.detail(String(record.id));
      setDetail(latest || record);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (record: LeadRow) => {
    setEditing(record);
    editForm.setFieldsValue({ status: record.status, phone: record.phone, wechat: record.wechat, budget: record.budget, remark: record.remark });
  };

  const openConvert = (record: LeadRow) => {
    setConverting(record);
    convertForm.setFieldsValue({
      educationLevel: record.degreeLevel,
      targetMajor: record.targetMajor,
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

  const submitConvert = async () => {
    if (!converting) return;
    const values = await convertForm.validateFields();
    await leadsApi.convertToCustomer(String(converting.id), values);
    message.success('客户档案已生成');
    setConverting(undefined);
    await load();
  };

  const deleteLead = async (record: LeadRow) => {
    if (record.status === 'converted') {
      message.warning('已转化线索不能删除，请到客户档案中查看');
      return;
    }
    await leadsApi.delete(String(record.id));
    message.success('线索已删除');
    await load();
  };

  const resetSearch = async () => {
    setKeyword('');
    setStatus(undefined);
    setRegion(undefined);
    setDateRange(null);
    await load({ keyword: '', status: undefined, region: undefined, dateRange: null });
  };

  const columns = useMemo(() => {
    const base = [
      { title: '线索编号', dataIndex: 'leadNo', render: (v: string, r: LeadRow) => <Button type='link' onClick={event => { event.stopPropagation(); openDetail(r); }}>{v || r.id}</Button> },
      { title: '学生姓名', dataIndex: 'studentName', render: (v: string, r: LeadRow) => <Typography.Link onClick={event => { event.stopPropagation(); openDetail(r); }}>{v || '-'}</Typography.Link> },
      { title: '意向区域', render: (_: unknown, r: LeadRow) => r.intentionRegionName || r.targetCountry || '-' },
      { title: '学历背景', dataIndex: 'degreeLevel', render: (v: string) => v || '-' },
      { title: '来源渠道', render: (_: unknown, r: LeadRow) => r.sourceChannel || r.sourceType || '-' },
      { title: '线索评分', render: () => '-' },
      { title: '当前状态', dataIndex: 'status', render: (v: string) => <StatusTag status={statusText[v] || v || '未知'} /> },
      { title: '生成时间', dataIndex: 'createdAt', render: fmt },
      {
        title: '操作',
        fixed: 'right' as const,
        width: isConsultant ? 270 : 230,
        render: (_: unknown, r: LeadRow) => <Space>
          <Button type='link' onClick={event => { event.stopPropagation(); openDetail(r); }}>查看</Button>
          <Button type='link' onClick={event => { event.stopPropagation(); openEdit(r); }}>修改</Button>
          {isConsultant && canConvert(r) && <Button type='link' onClick={event => { event.stopPropagation(); openConvert(r); }}>生成客户档案</Button>}
          <Popconfirm title='确认删除这条线索？这是真实数据删除，不可恢复。' onConfirm={() => deleteLead(r)}>
            <Button type='link' danger onClick={event => event.stopPropagation()} disabled={r.status === 'converted'}>删除</Button>
          </Popconfirm>
        </Space>
      }
    ];
    if (!isConsultant) base.splice(7, 0, { title: '跟进顾问', dataIndex: 'assignedToName', render: (v: string) => v || '-' } as any);
    return base;
  }, [isConsultant, rows]);

  const listContent = <>
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder='姓名/手机号/编号' allowClear /></Form.Item>
        <Form.Item label='意向区域'><Select allowClear value={region} onChange={setRegion} style={{ width: 150 }} placeholder='全部区域' options={regionOptions} /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={status} onChange={setStatus} style={{ width: 150 }} placeholder='全部状态' options={[{ label: '未分配', value: 'unassigned' }, { label: '已分配', value: 'assigned' }, { label: '跟进中', value: 'following' }, { label: '已确认', value: 'confirmed' }, { label: '已转化', value: 'converted' }, { label: '无效', value: 'invalid' }, { label: '已关闭', value: 'closed' }]} /></Form.Item>
        <Form.Item label='生成时间'><DatePicker.RangePicker value={dateRange} onChange={setDateRange} /></Form.Item>
        <Button type='primary' onClick={() => load()}>搜索</Button>
        <Button onClick={resetSearch}>重置</Button>
      </Form>
    </SearchFilterBar>
    <DataTable rowKey='id' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} onRow={(record: LeadRow) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })} />
  </>;

  return <>
    <PageHeader title={isConsultant ? '我的线索' : '线索中心 / 线索列表'} />
    {listContent}

    <Drawer title='线索详细信息' open={Boolean(detail)} width={560} onClose={() => setDetail(undefined)} loading={detailLoading as any}>
      {detail && <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Card size='small'>
          <Space direction='vertical'>
            <Typography.Title level={4} style={{ margin: 0 }}>{detail.studentName || '未命名线索'}</Typography.Title>
            <Space wrap>
              <StatusTag status={statusText[detail.status || ''] || detail.status || '未知'} />
              <span>线索编号：{detail.leadNo || detail.id}</span>
            </Space>
          </Space>
        </Card>
        <Descriptions bordered column={1} size='small' items={[
          { label: '学生姓名', children: detail.studentName || '-' },
          { label: '手机号', children: detail.phone || '-' },
          { label: '微信', children: detail.wechat || '-' },
          { label: '意向区域', children: detail.intentionRegionName || detail.targetCountry || '-' },
          { label: '目标国家', children: detail.targetCountry || '-' },
          { label: '目标专业', children: detail.targetMajor || '-' },
          { label: '学历背景', children: detail.degreeLevel || '-' },
          { label: '预算', children: detail.budget || '-' },
          { label: '来源渠道', children: detail.sourceChannel || detail.sourceType || '-' },
          { label: '来源页面', children: detail.sourcePage || '-' },
          { label: '跟进顾问', children: detail.assignedToName || '-' },
          { label: '分配原因', children: detail.assignReason || '-' },
          { label: '生成时间', children: fmt(detail.createdAt) },
          { label: '分配时间', children: fmt(detail.assignedAt) },
          { label: '转化时间', children: fmt(detail.convertedAt) },
          { label: '备注', children: detail.remark || '-' }
        ]} />
        {isConsultant && canConvert(detail) && <Button type='primary' onClick={() => openConvert(detail)}>生成客户档案</Button>}
      </Space>}
    </Drawer>

    <Modal title='修改线索' open={Boolean(editing)} onCancel={() => setEditing(undefined)} onOk={submitEdit} okText='保存' cancelText='取消'>
      <Form form={editForm} layout='vertical'>
        <Form.Item label='状态' name='status'><Select options={[{ label: '已分配', value: 'assigned' }, { label: '跟进中', value: 'following' }, { label: '已确认', value: 'confirmed' }, { label: '已转化', value: 'converted' }, { label: '无效', value: 'invalid' }, { label: '已关闭', value: 'closed' }]} /></Form.Item>
        <Form.Item label='电话' name='phone'><Input /></Form.Item>
        <Form.Item label='微信' name='wechat'><Input /></Form.Item>
        <Form.Item label='预算' name='budget'><Input /></Form.Item>
        <Form.Item label='备注' name='remark'><Input.TextArea rows={4} /></Form.Item>
      </Form>
    </Modal>
    <Modal title='确认生成客户档案' open={Boolean(converting)} onCancel={() => setConverting(undefined)} onOk={submitConvert} okText='确认生成' cancelText='取消'>
      <Form form={convertForm} layout='vertical'>
        <Form.Item label='客户姓名'><Input value={converting?.studentName || ''} disabled /></Form.Item>
        <Form.Item label='电话'><Input value={converting?.phone || ''} disabled /></Form.Item>
        <Form.Item label='微信'><Input value={converting?.wechat || ''} disabled /></Form.Item>
        <Form.Item label='学历' name='educationLevel'><Input placeholder='例如：本科毕业' /></Form.Item>
        <Form.Item label='目标专业' name='targetMajor'><Input placeholder='例如：Data Science' /></Form.Item>
        <Form.Item label='预算' name='budget'><Input /></Form.Item>
        <Form.Item label='确认备注' name='confirmRemark' rules={[{ required: true, message: '请填写确认备注' }]}><Input.TextArea rows={4} placeholder='例如：已电话沟通，客户明确计划申请英国硕士' /></Form.Item>
      </Form>
    </Modal>
  </>;
}
