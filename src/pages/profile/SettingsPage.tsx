import { Button, Card, Descriptions, Form, Image, Input, Select, Space, Table, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { PageHeader, StatusTag } from '@/components';
import { profileApi } from '@/api/profile';
import { useAuthStore } from '@/store/auth';

const regionOptions = [
  { label: '澳洲', value: 'AUSTRALIA' },
  { label: '英国', value: 'UK' },
  { label: '欧洲', value: 'EUROPE' },
  { label: '美国', value: 'US' },
  { label: '其他', value: 'OTHER' }
];

const statusText: Record<string, string> = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' };

export default function ProfileSettingsPage() {
  const role = useAuthStore(s => s.role);
  const isConsultant = role === 'CONSULTANT';
  const isAdmin = role === 'SUPER_ADMIN';
  const [me, setMe] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const current = await profileApi.me();
      setMe(current);
      if (isConsultant) setMyRequests(await profileApi.myRegionChangeRequests());
      if (isAdmin) setPendingRequests(await profileApi.pendingRegionChangeRequests());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [role]);

  const uploadQr = async (file: File) => {
    await profileApi.uploadQr(file);
    message.success('企业微信二维码已上传，任务中心已生成上传完成任务');
    await load();
    return false;
  };

  const submitRegionChange = async () => {
    const values = await form.validateFields();
    const selected = regionOptions.filter(item => values.regionCodes.includes(item.value));
    await profileApi.requestRegionChange({
      requestedRegionCodes: selected.map(item => item.value).join(','),
      requestedRegionNames: selected.map(item => item.label).join(','),
      reason: values.reason
    });
    message.success('已提交给超管审批');
    form.resetFields();
    await load();
  };

  const approve = async (record: any) => {
    await profileApi.approveRegionChange(String(record.id));
    message.success('已通过申请');
    await load();
  };

  const reject = async (record: any) => {
    await profileApi.rejectRegionChange(String(record.id));
    message.success('已拒绝申请');
    await load();
  };

  const requestColumns = [
    { title: '顾问', dataIndex: 'consultantName', render: (v: string) => v || '-' },
    { title: '当前地区', dataIndex: 'currentRegionNames', render: (v: string) => v || '-' },
    { title: '申请地区', dataIndex: 'requestedRegionNames', render: (v: string) => v || '-' },
    { title: '理由', dataIndex: 'reason', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <StatusTag status={statusText[v] || v || '未知'} /> },
    { title: '操作', render: (_: unknown, r: any) => isAdmin && r.status === 'PENDING' ? <Space><Button type='link' onClick={() => approve(r)}>通过</Button><Button type='link' danger onClick={() => reject(r)}>拒绝</Button></Space> : '-' }
  ];

  return <>
    <PageHeader title='个人信息设置' />
    <Card loading={loading} title='我的信息'>
      <Descriptions bordered column={2} size='small' items={[
        { label: '账号', children: me?.username || '-' },
        { label: '姓名', children: me?.displayName || '-' },
        { label: '角色', children: me?.roleCode || '-' },
        { label: '部门', children: me?.department || '-' },
        { label: '团队', children: me?.teamName || '-' },
        { label: '电话', children: me?.phone || '-' },
        { label: '擅长地区', children: me?.specialityRegionNames || '-' },
        { label: '顾问标题', children: me?.publicTitle || '-' }
      ]} />
    </Card>

    {isConsultant && <Card title='企业微信二维码' style={{ marginTop: 16 }} extra={<Upload accept='image/*' showUploadList={false} beforeUpload={uploadQr as any}><Button icon={<UploadOutlined />}>上传/替换二维码</Button></Upload>}>
      {me?.consultantQrPublicUrl ? <Space align='start'><Image src={me.consultantQrPublicUrl} width={180} /><div>官网学生提交咨询后，会展示这个企业微信二维码。</div></Space> : <div>暂未上传二维码。请上传自己的企业微信二维码。</div>}
    </Card>}

    {isConsultant && <Card title='擅长地区变更申请' style={{ marginTop: 16 }}>
      <Form form={form} layout='vertical'>
        <Form.Item label='申请擅长地区' name='regionCodes' rules={[{ required: true, message: '请选择擅长地区' }]}><Select mode='multiple' options={regionOptions} /></Form.Item>
        <Form.Item label='申请理由' name='reason'><Input.TextArea rows={3} placeholder='例如：近期主要负责澳洲方向案例，希望调整承接区域' /></Form.Item>
        <Button type='primary' onClick={submitRegionChange}>提交给超管审批</Button>
      </Form>
      <Table style={{ marginTop: 16 }} rowKey='id' columns={requestColumns as any} dataSource={myRequests} pagination={false} />
    </Card>}

    {isAdmin && <Card title='顾问擅长地区变更审批' style={{ marginTop: 16 }}>
      <Table rowKey='id' columns={requestColumns as any} dataSource={pendingRequests} pagination={false} />
    </Card>}
  </>;
}
