import { Alert, Avatar, Button, Card, Col, Descriptions, Empty, Form, Input, Modal, Popconfirm, Result, Row, Select, Space, Spin, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components';
import { advisorsApi, type AdvisorProfile, type CreateConsultantPayload } from '@/api/advisors';

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

export default function AdvisorCenterPage() {
  const [rows, setRows] = useState<AdvisorProfile[]>([]);
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
      const data = await advisorsApi.list();
      setRows(data || []);
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
      message.success('顾问账号已创建，请复制账号信息交给顾问本人登录。');
      setOpen(false);
      setCreatedAccount(created);
      setRows(prev => [{ ...created, setupCode: undefined }, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  const copyAccount = async () => {
    if (!createdAccount) return;
    const text = `登录账号：${createdAccount.username || '-'}\n初始密码：${createdAccount.setupCode || '-'}`;
    await navigator.clipboard.writeText(text);
    message.success('账号信息已复制');
  };

  const remove = async (item: AdvisorProfile) => {
    await advisorsApi.remove(item.id);
    message.success('顾问账号已删除');
    setRows(prev => prev.filter(row => row.id !== item.id));
  };

  if (!isSuperAdmin) {
    return <>
      <PageHeader title='顾问管理中心' />
      <Card>
        <Result status='403' title='无权限访问' subTitle='只有超管可以新增和删除顾问账号。' />
      </Card>
    </>;
  }

  return <>
    <PageHeader title='顾问管理中心' extra={<Space><Button onClick={() => load()}>刷新</Button><Button type='primary' onClick={openCreate}>新增顾问</Button></Space>} />
    <Card style={{ marginBottom: 16 }}>
      超管这里只负责创建和删除顾问账号。顾问头像、官网标题、个人简介由顾问本人登录后在“个人信息设置”里自行完善。
    </Card>
    <Spin spinning={loading}>
      {rows.length === 0 ? <Card><Empty description='暂无顾问账号，请点击右上角新增顾问' /></Card> : <Row gutter={[16, 16]}>
        {rows.map(item => <Col xs={24} md={12} xl={8} key={item.id}>
          <Card
            title={<Space><Avatar src={item.avatarUrl}>{item.consultantName?.slice(0, 1)}</Avatar><span>{item.consultantName}</span></Space>}
            extra={<Tag color='blue'>{item.regions?.map(r => r.regionName).join('、') || '未配置区域'}</Tag>}
          >
            <p>登录账号：{item.username || '-'}</p>
            <p>负责区域：{item.regions?.map(r => r.regionName).join('、') || '-'}</p>
            <p>头像：{item.avatarUrl ? '顾问已上传' : '待顾问自行上传'}</p>
            <p>简介：{item.publicBio ? '顾问已填写' : '待顾问自行填写'}</p>
            <Popconfirm title='确认删除这个顾问账号？' description='删除后会移除账号、顾问档案和区域绑定。' okText='确认删除' cancelText='取消' onConfirm={() => remove(item)}>
              <Button danger>删除顾问</Button>
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

    <Modal title='顾问账号已创建' open={Boolean(createdAccount)} onCancel={() => setCreatedAccount(undefined)} footer={<Space><Button onClick={copyAccount}>复制账号信息</Button><Button type='primary' onClick={() => setCreatedAccount(undefined)}>我已保存</Button></Space>}>
      <Alert type='warning' showIcon style={{ marginBottom: 16 }} message='请立即复制并保存。初始密码只在创建成功后展示一次，刷新页面后不会再次显示。' />
      <Descriptions bordered column={1} size='small' items={[
        { label: '顾问姓名', children: createdAccount?.consultantName || '-' },
        { label: '登录账号', children: createdAccount?.username || '-' },
        { label: '初始密码', children: createdAccount?.setupCode || '-' },
        { label: '负责区域', children: createdAccount?.regions?.map(r => r.regionName).join('、') || '-' }
      ]} />
    </Modal>
  </>;
}
