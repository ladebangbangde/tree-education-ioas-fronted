import { Avatar, Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Row, Select, Space, Spin, Switch, Tag, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
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
  const [uploadingId, setUploadingId] = useState<number>();
  const [form] = Form.useForm<CreateConsultantPayload>();

  const load = async () => {
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
    form.setFieldsValue({
      enabled: true,
      assignEnabled: true,
      displayOnOfficial: true,
      maxDailyLeads: 30,
      sortOrder: rows.length + 1,
      regionCodes: ['AU']
    } as CreateConsultantPayload);
    setOpen(true);
  };

  const submitCreate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      const created = await advisorsApi.create(values);
      message.success('顾问注册成功，已同步创建账号、顾问档案和负责区域');
      setOpen(false);
      setRows(prev => [created, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  const beforeUpload = (advisor: AdvisorProfile): UploadProps['beforeUpload'] => async file => {
    setUploadingId(advisor.id);
    try {
      const data = await advisorsApi.uploadAvatar(advisor.id, file as File);
      message.success('顾问头像上传成功');
      setRows(prev => prev.map(item => item.id === advisor.id ? { ...item, avatarUrl: data.avatarUrl } : item));
    } finally {
      setUploadingId(undefined);
    }
    return Upload.LIST_IGNORE;
  };

  return <>
    <PageHeader title='顾问管理中心' extra={<Space><Button onClick={() => load()}>刷新</Button><Button type='primary' onClick={openCreate}>新增顾问</Button></Space>} />
    <Spin spinning={loading}>
      {rows.length === 0 ? <Card><Empty description='暂无顾问档案，请点击右上角新增顾问' /></Card> : <Row gutter={[16, 16]}>
        {rows.map(item => <Col xs={24} md={12} xl={8} key={item.id}>
          <Card
            title={<Space><Avatar src={item.avatarUrl}>{item.consultantName?.slice(0, 1)}</Avatar><span>{item.consultantName}</span></Space>}
            extra={<Space size={4}>{item.displayOnOfficial ? <Tag color='green'>官网展示</Tag> : <Tag>不展示</Tag>}{item.assignEnabled ? <Tag color='blue'>自动分配</Tag> : <Tag color='orange'>不分配</Tag>}</Space>}
          >
            <p>登录账号：{item.username || '-'}</p>
            <p>负责区域：{item.regions?.map(r => r.regionName).join('、') || '-'}</p>
            <p>顾问头衔：{item.publicTitle || '-'}</p>
            <p>线索负载：{item.currentDailyLeads || 0} / {item.maxDailyLeads || 0}</p>
            <p style={{ minHeight: 48 }}>简介：{item.publicBio || '-'}</p>
            <Upload showUploadList={false} accept='image/*' beforeUpload={beforeUpload(item)}>
              <Button loading={uploadingId === item.id}>上传/更换头像</Button>
            </Upload>
          </Card>
        </Col>)}
      </Row>}
    </Spin>

    <Modal title='新增顾问' open={open} onCancel={() => setOpen(false)} onOk={submitCreate} okText='创建顾问' confirmLoading={creating} width={860} destroyOnClose>
      <Form form={form} layout='vertical'>
        <Row gutter={16}>
          <Col span={12}><Form.Item name='username' label='登录账号' rules={[{ required: true, message: '请输入登录账号' }]}><Input placeholder='例如 emily.carter' /></Form.Item></Col>
          <Col span={12}><Form.Item name='password' label='初始密码' rules={[{ required: true, message: '请输入初始密码' }]}><Input.Password placeholder='创建后请安全交付给顾问' /></Form.Item></Col>
          <Col span={12}><Form.Item name='displayName' label='顾问姓名' rules={[{ required: true, message: '请输入顾问姓名' }]}><Input placeholder='例如 Emily Carter' /></Form.Item></Col>
          <Col span={12}><Form.Item name='teamName' label='所属团队'><Input placeholder='例如 澳洲顾问组' /></Form.Item></Col>
          <Col span={12}><Form.Item name='phone' label='手机号'><Input placeholder='可选' /></Form.Item></Col>
          <Col span={12}><Form.Item name='email' label='邮箱'><Input placeholder='可选' /></Form.Item></Col>
          <Col span={12}><Form.Item name='regionCodes' label='负责区域' rules={[{ required: true, message: '请选择负责区域' }]}><Select mode='multiple' options={regionOptions} /></Form.Item></Col>
          <Col span={12}><Form.Item name='maxDailyLeads' label='每日最大线索数'><InputNumber min={1} max={999} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item name='publicTitle' label='官网展示头衔'><Input placeholder='例如 澳洲申请规划顾问' /></Form.Item></Col>
          <Col span={12}><Form.Item name='sortOrder' label='官网排序'><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={24}><Form.Item name='publicBio' label='官网简介'><Input.TextArea rows={4} placeholder='填写官网顾问卡片展示简介' /></Form.Item></Col>
          <Col span={8}><Form.Item name='enabled' label='账号启用' valuePropName='checked'><Switch /></Form.Item></Col>
          <Col span={8}><Form.Item name='assignEnabled' label='参与自动分配' valuePropName='checked'><Switch /></Form.Item></Col>
          <Col span={8}><Form.Item name='displayOnOfficial' label='展示到官网' valuePropName='checked'><Switch /></Form.Item></Col>
        </Row>
      </Form>
    </Modal>
  </>;
}
