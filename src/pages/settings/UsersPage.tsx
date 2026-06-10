import { Button, Form, Input, Modal, Select, Space, Switch, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader, SearchFilterBar } from '@/components';
import { adminUsersApi, type AdminUser, type AdminUserStatus, type CreateUserPayload, type OptionItem } from '@/api/adminUsers';

const defaultOptions = {
  roles: [
    { value: 'SUPER_ADMIN', label: '系统超管' },
    { value: 'CONSULTANT', label: '顾问' },
    { value: 'MEDIA', label: '媒体' },
    { value: 'OPERATOR', label: '运营' },
    { value: 'DATA', label: '数据操作员' },
    { value: 'ANCHOR', label: '主播' },
    { value: 'ADMINISTRATIVE', label: '行政' }
  ],
  departments: [
    { value: 'SYSTEM', label: '系统管理部' },
    { value: 'CONSULTING', label: '咨询中心' },
    { value: 'DELIVERY', label: '申请交付中心' },
    { value: 'MEDIA', label: '媒体部' },
    { value: 'OPERATION', label: '运营部' },
    { value: 'DATA', label: '数据部' },
    { value: 'ADMIN', label: '行政部' }
  ],
  statuses: [
    { value: 'ACTIVE', label: '启用' },
    { value: 'DISABLED', label: '停用' }
  ]
};

const optionLabel = (options: OptionItem[], value?: string) => options.find(item => item.value === value)?.label || value || '-';

export default function UsersPage(){
  const [form] = Form.useForm<CreateUserPayload & { id?: number }>();
  const [queryForm] = Form.useForm();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [options, setOptions] = useState(defaultOptions);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = queryForm.getFieldsValue();
      const [optionData, users] = await Promise.all([
        adminUsersApi.options().catch(() => defaultOptions),
        adminUsersApi.list(params)
      ]);
      setOptions({ roles: optionData?.roles || defaultOptions.roles, departments: optionData?.departments || defaultOptions.departments, statuses: optionData?.statuses || defaultOptions.statuses });
      setRows(users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const roleOptions = useMemo(() => options.roles, [options]);
  const departmentOptions = useMemo(() => options.departments, [options]);
  const statusOptions = useMemo(() => options.statuses, [options]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', roleCode: 'DATA', department: 'DATA' });
    setOpen(true);
  };

  const openEdit = (row: AdminUser) => {
    setEditing(row);
    form.setFieldsValue({ id: row.id, username: row.username, displayName: row.displayName, department: row.department, roleCode: row.roleCode, status: row.status });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await adminUsersApi.update(editing.id, { displayName: values.displayName, department: values.department, roleCode: values.roleCode, status: values.status });
      message.success('用户已更新');
    } else {
      const result = await adminUsersApi.create(values);
      Modal.success({ title: '用户创建成功', content: `账号：${result.username}，初始密码：${result.initialCode}` });
    }
    setOpen(false);
    await load();
  };

  const resetCode = async (row: AdminUser) => {
    const result = await adminUsersApi.resetCode(row.id);
    Modal.success({ title: '密码已重置', content: `账号：${result.username}，新密码：${result.initialCode}` });
  };

  const toggleStatus = async (row: AdminUser, checked: boolean) => {
    await adminUsersApi.updateStatus(row.id, checked ? 'ACTIVE' : 'DISABLED');
    message.success(checked ? '账号已启用' : '账号已停用');
    await load();
  };

  const columns = [
    { title: '姓名', dataIndex: 'displayName' },
    { title: '用户名', dataIndex: 'username' },
    { title: '部门', dataIndex: 'department', render: (v: string) => optionLabel(departmentOptions, v) },
    { title: '角色', dataIndex: 'roleCode', render: (v: string) => <Tag>{optionLabel(roleOptions, v)}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v: AdminUserStatus, r: AdminUser) => <Switch checked={v === 'ACTIVE'} onChange={checked => toggleStatus(r, checked)} /> },
    { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => v ? v.replace('T', ' ').slice(0, 19) : '-' },
    { title: '操作', render: (_: unknown, row: AdminUser) => <Space><Button type='link' onClick={() => openEdit(row)}>编辑</Button><Button type='link' onClick={() => resetCode(row)}>重置密码</Button></Space> }
  ];

  return <>
    <PageHeader title='用户管理' extra={<Button type='primary' onClick={openCreate}>新建账号</Button>} />
    <SearchFilterBar>
      <Form form={queryForm} layout='inline'>
        <Form.Item name='keyword' label='关键词'><Input placeholder='姓名或用户名' /></Form.Item>
        <Form.Item name='department' label='部门'><Select allowClear style={{ width: 160 }} options={departmentOptions} /></Form.Item>
        <Form.Item name='roleCode' label='角色'><Select allowClear style={{ width: 160 }} options={roleOptions} /></Form.Item>
        <Form.Item name='status' label='状态'><Select allowClear style={{ width: 120 }} options={statusOptions} /></Form.Item>
        <Button type='primary' onClick={load}>查询</Button>
        <Button onClick={() => { queryForm.resetFields(); load(); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Table rowKey='id' loading={loading} columns={columns as any} dataSource={rows} />
    <Modal title={editing ? '编辑账号' : '新建账号'} open={open} onOk={submit} onCancel={() => setOpen(false)} destroyOnClose>
      <Form form={form} layout='vertical'>
        <Form.Item name='username' label='用户名' rules={[{ required: true, message: '请输入用户名' }]}><Input disabled={Boolean(editing)} /></Form.Item>
        <Form.Item name='displayName' label='姓名' rules={[{ required: true, message: '请输入姓名' }]}><Input /></Form.Item>
        <Form.Item name='department' label='部门' rules={[{ required: true, message: '请选择部门' }]}><Select options={departmentOptions} /></Form.Item>
        <Form.Item name='roleCode' label='角色' rules={[{ required: true, message: '请选择角色' }]}><Select options={roleOptions} /></Form.Item>
        <Form.Item name='status' label='状态' rules={[{ required: true, message: '请选择状态' }]}><Select options={statusOptions} /></Form.Item>
        {!editing && <Form.Item name='initialCode' label='初始密码'><Input placeholder='不填则系统自动生成' /></Form.Item>}
      </Form>
    </Modal>
  </>;
}
