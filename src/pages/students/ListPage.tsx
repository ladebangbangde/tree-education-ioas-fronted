import { Button, Form, Input, Modal, Select, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, PageHeader, SearchFilterBar, StatusTag } from '@/components';
import { studentsApi } from '@/api/students';

type StudentRow = {
  id: number | string;
  studentNo?: string;
  studentName?: string;
  phone?: string;
  wechat?: string;
  intentionRegionName?: string;
  targetCountry?: string;
  targetMajor?: string;
  educationLevel?: string;
  budget?: string;
  ownerConsultantName?: string;
  profileStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  remark?: string;
};

const statusText: Record<string, string> = {
  ACTIVE: '服务中',
  ARCHIVED: '已归档',
  DELETED: '已删除'
};

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function StudentsListPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [profileStatus, setProfileStatus] = useState<string>();
  const [editing, setEditing] = useState<StudentRow>();
  const [editForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const page = await studentsApi.list({ keyword: keyword || undefined, profileStatus, pageNum: 1, pageSize: 100 });
      setRows(page.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const openEdit = (record: StudentRow) => {
    setEditing(record);
    editForm.setFieldsValue({
      studentName: record.studentName,
      phone: record.phone,
      wechat: record.wechat,
      educationLevel: record.educationLevel,
      targetMajor: record.targetMajor,
      budget: record.budget,
      profileStatus: record.profileStatus,
      remark: record.remark
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields();
    await studentsApi.update(String(editing.id), values);
    message.success('学生档案已更新');
    setEditing(undefined);
    await load();
  };

  const deleteStudent = async (record: StudentRow) => {
    await studentsApi.delete(String(record.id));
    message.success('学生档案已删除');
    await load();
  };

  const columns = [
    { title: '学生编号', dataIndex: 'studentNo', render: (v: string, r: StudentRow) => v || r.id },
    { title: '学生姓名', dataIndex: 'studentName', render: (v: string) => v || '-' },
    { title: '电话', dataIndex: 'phone', render: (v: string) => v || '-' },
    { title: '微信', dataIndex: 'wechat', render: (v: string) => v || '-' },
    { title: '意向区域', render: (_: unknown, r: StudentRow) => r.intentionRegionName || r.targetCountry || '-' },
    { title: '目标专业', dataIndex: 'targetMajor', render: (v: string) => v || '-' },
    { title: '学历', dataIndex: 'educationLevel', render: (v: string) => v || '-' },
    { title: '预算', dataIndex: 'budget', render: (v: string) => v || '-' },
    { title: '负责顾问', dataIndex: 'ownerConsultantName', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'profileStatus', render: (v: string) => <StatusTag status={statusText[v] || v || '未知'} /> },
    { title: '生成时间', dataIndex: 'createdAt', render: fmt },
    {
      title: '操作',
      fixed: 'right' as const,
      width: 210,
      render: (_: unknown, r: StudentRow) => <Space>
        <Button type='link' onClick={() => nav(`/students/detail/${r.id}`)}>查看</Button>
        <Button type='link' onClick={() => openEdit(r)}>修改</Button>
        <Button type='link' danger onClick={() => deleteStudent(r)}>删除</Button>
      </Space>
    }
  ];

  return <>
    <PageHeader title='学生档案列表' />
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='姓名/电话/微信/编号' /></Form.Item>
        <Form.Item label='状态'><Select allowClear value={profileStatus} onChange={setProfileStatus} style={{ width: 130 }} options={[{ label: '服务中', value: 'ACTIVE' }, { label: '已归档', value: 'ARCHIVED' }]} /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setProfileStatus(undefined); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <DataTable rowKey='id' columns={columns as any} dataSource={rows} loading={loading} pagination={{ total: rows.length, showSizeChanger: true }} />
    <Modal title='修改学生档案' open={Boolean(editing)} onCancel={() => setEditing(undefined)} onOk={submitEdit} okText='保存' cancelText='取消'>
      <Form form={editForm} layout='vertical'>
        <Form.Item label='学生姓名' name='studentName' rules={[{ required: true, message: '请输入学生姓名' }]}><Input /></Form.Item>
        <Form.Item label='电话' name='phone'><Input /></Form.Item>
        <Form.Item label='微信' name='wechat'><Input /></Form.Item>
        <Form.Item label='学历' name='educationLevel'><Input /></Form.Item>
        <Form.Item label='目标专业' name='targetMajor'><Input /></Form.Item>
        <Form.Item label='预算' name='budget'><Input /></Form.Item>
        <Form.Item label='状态' name='profileStatus'><Select options={[{ label: '服务中', value: 'ACTIVE' }, { label: '已归档', value: 'ARCHIVED' }]} /></Form.Item>
        <Form.Item label='备注' name='remark'><Input.TextArea rows={4} /></Form.Item>
      </Form>
    </Modal>
  </>;
}
