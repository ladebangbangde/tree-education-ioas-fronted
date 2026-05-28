import { Button, Card, Col, Descriptions, Empty, Form, Input, Modal, Progress, Row, Select, Space, Steps, Table, Tag, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components';
import { applicationFlowsApi, type ApplicationAttachmentType, type ApplicationFlow, type ApplicationFlowStep, type ApplicationStepStatus } from '@/api/applicationFlows';

const statusMap: Record<ApplicationStepStatus, { text: string; color: string }> = {
  LOCKED: { text: '未解锁', color: 'default' },
  PENDING: { text: '待处理', color: 'blue' },
  IN_PROGRESS: { text: '处理中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' },
  REJECTED: { text: '已退回', color: 'red' }
};

const attachmentOptions: { label: string; value: ApplicationAttachmentType }[] = [
  { label: '护照', value: 'PASSPORT' },
  { label: '身份证', value: 'ID_CARD' },
  { label: '成绩单', value: 'TRANSCRIPT' },
  { label: '毕业证/学位证', value: 'DIPLOMA' },
  { label: '语言成绩', value: 'LANGUAGE_SCORE' },
  { label: '简历', value: 'RESUME' },
  { label: '个人陈述', value: 'PERSONAL_STATEMENT' },
  { label: '推荐信', value: 'RECOMMENDATION_LETTER' },
  { label: '工作证明', value: 'WORK_EXPERIENCE' },
  { label: '资金证明', value: 'FINANCIAL_PROOF' },
  { label: '学校申请表', value: 'SCHOOL_APPLICATION_FORM' },
  { label: 'Offer文件', value: 'OFFER_LETTER' },
  { label: '签证申请表', value: 'VISA_APPLICATION_FORM' },
  { label: '签证缴费回执', value: 'VISA_PAYMENT_RECEIPT' },
  { label: '体检材料', value: 'MEDICAL_CHECK' },
  { label: '录指纹/预约材料', value: 'BIOMETRIC_APPOINTMENT' },
  { label: '签证结果', value: 'VISA_RESULT' },
  { label: '机票', value: 'FLIGHT_TICKET' },
  { label: '住宿信息', value: 'ACCOMMODATION' },
  { label: '其他', value: 'OTHER' }
];

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export default function ApplicationsDetailPage() {
  const { id } = useParams();
  const [flow, setFlow] = useState<ApplicationFlow>();
  const [loading, setLoading] = useState(false);
  const [activeStepId, setActiveStepId] = useState<number>();
  const [noteForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const activeStep = useMemo(() => flow?.steps?.find(s => s.id === activeStepId) || flow?.steps?.find(s => s.stepCode === flow.currentStep) || flow?.steps?.[0], [flow, activeStepId]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await applicationFlowsApi.detail(id);
      setFlow(data);
      const step = data.steps?.find(s => s.stepCode === data.currentStep) || data.steps?.[0];
      setActiveStepId(current => current || step?.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [id]);

  useEffect(() => {
    if (!activeStep) return;
    noteForm.setFieldsValue({ consultantNote: activeStep.consultantNote, customerVisibleNote: activeStep.customerVisibleNote });
    uploadForm.resetFields();
    uploadForm.setFieldsValue({ attachmentType: defaultAttachmentType(activeStep) });
  }, [activeStep?.id]);

  const updateStep = async (status: ApplicationStepStatus) => {
    if (!flow || !activeStep) return;
    const values = await noteForm.validateFields();
    await applicationFlowsApi.updateStep(flow.id, activeStep.stepCode, {
      status,
      consultantNote: values.consultantNote,
      customerVisibleNote: values.customerVisibleNote,
      version: activeStep.version
    });
    message.success('流程节点已更新');
    await load();
  };

  const uploadProps: UploadProps = {
    beforeUpload: async file => {
      if (!flow || !activeStep) return Upload.LIST_IGNORE;
      const values = await uploadForm.validateFields();
      setUploading(true);
      try {
        await applicationFlowsApi.uploadAttachment(flow.id, activeStep.stepCode, {
          file,
          attachmentType: values.attachmentType,
          note: values.note
        });
        message.success('材料已上传');
        await load();
      } finally {
        setUploading(false);
      }
      return Upload.LIST_IGNORE;
    },
    showUploadList: false
  };

  if (!flow && !loading) return <><PageHeader title='申请流程详情' /><Card><Empty description='申请流程不存在' /></Card></>;

  const currentIndex = Math.max(0, flow?.steps?.findIndex(s => s.stepCode === flow.currentStep) ?? 0);

  return <>
    <PageHeader title='申请流程详情' extra={<Button onClick={() => load()}>刷新</Button>} />
    <Card className='mb12' loading={loading}>
      {flow ? <>
        <Descriptions column={3} items={[
          { label: '客户姓名', children: flow.studentName },
          { label: '客户编号', children: flow.studentNo || '-' },
          { label: '负责顾问', children: flow.ownerConsultantName },
          { label: '整体进度', children: <Progress percent={flow.progressPercent || 0} size='small' /> },
          { label: '当前阶段', children: activeStep ? <Tag color={statusMap[activeStep.status]?.color}>{activeStep.stepName} · {statusMap[activeStep.status]?.text}</Tag> : '-' },
          { label: '更新时间', children: fmt(flow.updatedAt) }
        ]} />
        <Steps current={currentIndex} className='mt12' items={flow.steps.map(step => ({
          title: step.stepName,
          description: <Tag color={statusMap[step.status]?.color}>{statusMap[step.status]?.text}</Tag>,
          status: step.status === 'COMPLETED' ? 'finish' : step.status === 'LOCKED' ? 'wait' : step.status === 'REJECTED' ? 'error' : 'process'
        }))} />
      </> : null}
    </Card>

    {flow ? <Row gutter={[16, 16]}>
      <Col span={7}>
        <Card title='流程节点'>
          <Space direction='vertical' style={{ width: '100%' }}>
            {flow.steps.map(step => <Card key={step.id} size='small' onClick={() => setActiveStepId(step.id)} style={{ cursor: 'pointer', borderColor: activeStep?.id === step.id ? '#1677ff' : undefined }}>
              <Space direction='vertical' style={{ width: '100%' }} size={4}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <b>{step.orderNo}. {step.stepName}</b>
                  <Tag color={statusMap[step.status]?.color}>{statusMap[step.status]?.text}</Tag>
                </Space>
                <div className='text-muted'>已上传材料：{step.uploadedFileCount || 0}</div>
                <div className='text-muted'>完成时间：{fmt(step.completedAt)}</div>
              </Space>
            </Card>)}
          </Space>
        </Card>
      </Col>

      <Col span={17}>
        <Card title={activeStep ? `${activeStep.orderNo}. ${activeStep.stepName}` : '节点详情'} extra={activeStep ? <Tag color={statusMap[activeStep.status]?.color}>{statusMap[activeStep.status]?.text}</Tag> : null}>
          {activeStep ? <>
            <Form form={noteForm} layout='vertical'>
              <Row gutter={16}>
                <Col span={12}><Form.Item label='顾问内部备注' name='consultantNote'><Input.TextArea rows={4} placeholder='记录内部处理细节、风险点、下一步动作' /></Form.Item></Col>
                <Col span={12}><Form.Item label='客户可见进度说明' name='customerVisibleNote'><Input.TextArea rows={4} placeholder='未来客资端展示给客户看的说明' /></Form.Item></Col>
              </Row>
            </Form>
            <Space className='mb12'>
              <Button disabled={activeStep.status === 'LOCKED' || activeStep.status === 'COMPLETED'} onClick={() => updateStep('IN_PROGRESS')}>标记处理中</Button>
              <Button type='primary' disabled={activeStep.status === 'LOCKED' || activeStep.status === 'COMPLETED'} onClick={() => updateStep('COMPLETED')}>完成本阶段并解锁下一步</Button>
              <Button danger disabled={activeStep.status === 'LOCKED' || activeStep.status === 'COMPLETED'} onClick={() => updateStep('REJECTED')}>退回/异常</Button>
            </Space>

            <Card type='inner' title='上传本阶段材料' className='mb12'>
              <Form form={uploadForm} layout='inline'>
                <Form.Item label='材料类型' name='attachmentType' rules={[{ required: true, message: '请选择材料类型' }]}><Select style={{ width: 180 }} options={attachmentOptions} /></Form.Item>
                <Form.Item label='说明' name='note'><Input placeholder='例如：护照首页/学校正式Offer/签证获批信' style={{ width: 280 }} /></Form.Item>
                <Upload {...uploadProps}><Button loading={uploading} icon={<UploadOutlined />} disabled={activeStep.status === 'LOCKED' || activeStep.status === 'COMPLETED'}>选择文件并上传到MinIO</Button></Upload>
              </Form>
            </Card>

            <Table rowKey='id' pagination={false} dataSource={activeStep.attachments || []} columns={[
              { title: '材料类型', dataIndex: 'attachmentType', render: (v: string) => attachmentOptions.find(i => i.value === v)?.label || v },
              { title: '文件名', dataIndex: 'originalFilename', render: (v: string, r: any) => r.fileUrl ? <a href={r.fileUrl} target='_blank' rel='noreferrer'>{v}</a> : v },
              { title: '大小', dataIndex: 'sizeBytes', render: (v: number) => v ? `${(v / 1024 / 1024).toFixed(2)} MB` : '-' },
              { title: '上传人', dataIndex: 'uploadedByName' },
              { title: '上传时间', dataIndex: 'createdAt', render: fmt },
              { title: '说明', dataIndex: 'note', render: (v: string) => v || '-' }
            ] as any} />
          </> : <Empty />}
        </Card>
      </Col>
    </Row> : null}
  </>;
}

function defaultAttachmentType(step: ApplicationFlowStep): ApplicationAttachmentType {
  switch (step.stepCode) {
    case 'PREPARE_MATERIALS': return 'PASSPORT';
    case 'SCHOOL_OFFER': return 'OFFER_LETTER';
    case 'VISA_PROCESSING': return 'VISA_APPLICATION_FORM';
    case 'VISA_PROCEDURES': return 'BIOMETRIC_APPOINTMENT';
    case 'VISA_APPROVED_TICKET': return 'FLIGHT_TICKET';
    default: return 'OTHER';
  }
}
