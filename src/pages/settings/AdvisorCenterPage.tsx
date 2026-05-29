import { Alert, Avatar, Button, Card, Col, Descriptions, Empty, Form, Image, Input, Modal, Popconfirm, Result, Row, Select, Space, Spin, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader, StatusTag } from '@/components';
import { advisorsApi, type AdvisorProfile, type CreateConsultantPayload } from '@/api/advisors';
import { profileApi } from '@/api/profile';

const regionOptions = [
  { label: '澳洲', value: 'AU' },
  { label: '美国', value: 'US' },
  { label: '英国', value: 'UK' },
  { label: '欧洲', value: 'EU' },
  { label: '加拿大', value: 'CA' },
  { label: '新加坡', value: 'SG' },
  { label: '日本', value: 'JP' },
  { label: '中国香港', value: 'HK' }
];

const statusText: Record<string, string> = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' };

export default function AdvisorCenterPage() {
  const [rows, setRows] = useState<AdvisorProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<AdvisorProfile>();
  const [form] = Form.useForm<CreateConsultantPayload>();
  const isSuperAdmin = localStorage.getItem('role') === 'SUPER_ADMIN';

  const load = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const [data, pending] = await Promise.all([advisorsApi.list(), profileApi.pendingRegionChangeRequests()]);
      setRows(data || []);
      setPendingRequests(pending || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ regionCodes: ['AU'] } as CreateConsultantPayload);
    setOpen(true);
  };

  const submitCreate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      const created = await advisorsApi.create(values);
      message.success('顾问账号已创建，请复制登录信息交给顾问本人。');
      setOpen(false);
      setCreatedAccount(created);
      setRows(prev => [{ ...created, setupCode: undefined }, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  const copyAccount = async () => {
    if (!createdAccount) return;
    const text = `登录账号：${createdAccount.username || '-'}\n一次性登录凭证：${createdAccount.setupCode || '-'}`;
    await navigator.clipboard.writeText(text);
    message.success('登录信息已复制');
  };

  const approve = async (record: any) => {
    await profileApi.approveRegionChange(String(record.id));
    message.success('已通过顾问负责区域变更申请');
    await load();
  };

  const reject = async (record: any) => {
    await profileApi.rejectRegionChange(String(record.id));
    message.success('已拒绝顾问负责区域变更申请');
    await load();
  };

  const remove = async (item: AdvisorProfile) => {
    await advisorsApi.remove(item.id);
    message.success('顾问账号已删除');
    setRows(prev => prev.filter(row => row.id !== item.id));
  };

  const requestColumns = [
    { title: '顾问', dataIndex: 'consultantName', render: (v: string) => v || '-' },
    { title: '当前负责地区', dataIndex: 'currentRegionNames', render: (v: string) => v || '-' },
    { title: '申请负责地区', dataIndex: 'requestedRegionNames', render: (v: string) => v || '-' },
    { title: '理由', dataIndex: 'reason', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <StatusTag status={statusText[v] || v || '未知'} /> },
    { title: '操作', render: (_: unknown, r: any) => r.status === 'PENDING' ? <Space><Button type='link' onClick={() => approve(r)}>通过</Button><Button type='link' danger onClick={() => reject(r)}>拒绝</Button></Space> : '-' }
  ];

  if (!isSuperAdmin) {
    return <>
      <PageHeader title='顾问管理中心' />
      <Card>
        <Result status='403' title='无权限访问' subTitle='只有超管可以新增、删除顾问账号并审批顾问负责区域变更。' />
      </Card>
    </>;
  }

  return <>
    <PageHeader title='顾问管理中心' extra={<Space><Button onClick={() => load()}>刷新</Button><Button type='primary' onClick={openCreate}>新增顾问</Button></Space>} />
    <Card style={{ marginBottom: 16 }}>
      超管负责创建/删除顾问账号，并审批顾问负责区域变更。顾问本人登录后维护企业二维码、头像和简介。
    </Card>

    <Card title={`负责区域变更审批（${pendingRequests.length}）`} style={{ marginBottom: 16 }}>
      <Table rowKey='id' columns={requestColumns as any} dataSource={pendingRequests} pagination={false} locale={{ emptyText: '暂无待审批的顾问负责区域变更申请' }} />
    </Card>

    <Spin spinning={loading}>
      {rows.length === 0 ? <Card><Empty description='暂无顾问账号，请点击右上角新增顾问' /></Card> : <Row gutter={[16, 16]}>
        {rows.map(item => <Col xs={24} md={12} xl={8} key={item.id}>
          <Card title={<Space><Avatar src={item.avatarUrl}>{item.consultantName?.slice(0, 1)}</Avatar><span>{item.consultantName}</span></Space>} extra={<Tag color='blue'>{item.regions?.map(r => r.regionName).join('、') || '未配置区域'}</Tag>}>
            <Descriptions bordered column={1} size='small' items={[
              { label: '名称', children: item.consultantName || '-' },
              { label: '登录账号', children: item.username || '-' },
              { label: '负责地区', children: item.regions?.map(r => r.regionName).join('、') || '-' },
              { label: '企业二维码', children: item.qrUrl ? <Image src={item.qrUrl} width={96} /> : '待顾问上传' },
              { label: '简介', children: item.publicBio || '待顾问填写' }
            ]} />
            <Popconfirm title='确认删除这个顾问账号？' description='删除后会移除账号、顾问档案和区域绑定。' okText='确认删除' cancelText='取消' onConfirm={() => remove(item)}>
              <Button danger style={{ marginTop: 16 }}>删除顾问</Button>
            </Popconfirm>
          </Card>
        </Col>)}
      </Row>}
    </Spin>

    <Modal title='新增顾问' open={open} onCancel={() => setOpen(false)} onOk={submitCreate} okText='创建顾问' confirmLoading={creating} width={620} destroyOnClose>
      <Form form={form} layout='vertical'>
        <Form.Item name='displayName' label='顾问姓名' rules={[{ required: true, message: '请输入顾问姓名' }]}>
          <Input placeholder='例如 Emily Carter / 王老师' />
        </Form.Item>
        <Form.Item name='regionCodes' label='负责区域' rules={[{ required: true, message: '请选择负责区域' }]}>
          <Select mode='multiple' options={regionOptions} placeholder='请选择该顾问负责的国家/地区' />
        </Form.Item>
      </Form>
    </Modal>

    <Modal title='顾问账号已创建' open={Boolean(createdAccount)} onCancel={() => setCreatedAccount(undefined)} footer={<Space><Button onClick={copyAccount}>复制登录信息</Button><Button type='primary' onClick={() => setCreatedAccount(undefined)}>我已保存</Button></Space>}>
      <Alert type='warning' showIcon style={{ marginBottom: 16 }} message='请立即复制并保存。一次性登录凭证只在创建成功后展示一次，刷新页面后不会再次显示。' />
      <Descriptions bordered column={1} size='small' items={[
        { label: '顾问姓名', children: createdAccount?.consultantName || '-' },
        { label: '登录账号', children: createdAccount?.username || '-' },
        { label: '一次性登录凭证', children: createdAccount?.setupCode || '-' },
        { label: '负责区域', children: createdAccount?.regions?.map(r => r.regionName).join('、') || '-' }
      ]} />
    </Modal>
  </>;
}
