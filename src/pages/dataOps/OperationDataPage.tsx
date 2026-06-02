import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Tree, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { CalendarOutlined, CloudUploadOutlined, FolderOpenOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import { dataOpsApi, type DataOpsContent, type DataOpsPackage, type DataOpsPlatformTopic, type DataOpsUserOption, type PlatformCode } from '@/api/dataOps';

const platformOptions = [
  { label: '抖音', value: 'DOUYIN' },
  { label: '小红书', value: 'XIAOHONGSHU' }
];

function pick<T = any>(row: any, a: string, b: string): T {
  return row?.[a] ?? row?.[b];
}

function toUserSelectOptions(rows: DataOpsUserOption[]) {
  return rows.map(row => ({
    value: row.id,
    label: `${pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}`
  }));
}

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [packages, setPackages] = useState<DataOpsPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DataOpsPackage>();
  const [operatorUsers, setOperatorUsers] = useState<DataOpsUserOption[]>([]);
  const [mediaUsers, setMediaUsers] = useState<DataOpsUserOption[]>([]);
  const [packageOpen, setPackageOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<DataOpsPlatformTopic>();
  const [packageForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  const [contentForm] = Form.useForm();

  const loadPackages = async () => {
    setLoading(true);
    try {
      const rows = await dataOpsApi.packages({ date: today });
      setPackages(rows || []);
      if (selectedPackage?.id) {
        const next = rows?.find(item => item.id === selectedPackage.id);
        setSelectedPackage(next || rows?.[0]);
      } else {
        setSelectedPackage(rows?.[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshPackageDetail = async (packageId?: number) => {
    const id = packageId || selectedPackage?.id;
    if (!id) return;
    const detail = await dataOpsApi.packageDetail(id);
    setSelectedPackage(detail);
    setPackages(rows => rows.map(item => item.id === id ? detail : item));
  };

  const loadUserOptions = async () => {
    const [operators, media] = await Promise.all([
      dataOpsApi.userOptions('OPERATOR'),
      dataOpsApi.userOptions('MEDIA')
    ]);
    setOperatorUsers(operators || []);
    setMediaUsers(media || []);
  };

  useEffect(() => { loadPackages().catch(() => undefined); loadUserOptions().catch(() => undefined); }, []);

  const treeData = useMemo(() => packages.length ? packages.map(pkg => ({
    title: `${pick<string>(pkg, 'topic_date', 'topicDate') || today}`,
    key: `date-${pkg.id}`,
    icon: <CalendarOutlined />,
    children: [{
      title: pick<string>(pkg, 'display_name', 'displayName') || '数据主题包',
      key: `package-${pkg.id}`,
      icon: <FolderOpenOutlined />,
      children: [
        { title: '封面识别主题', key: `cover-${pkg.id}` },
        { title: '小红书', key: `xhs-${pkg.id}` },
        { title: '抖音', key: `douyin-${pkg.id}` }
      ]
    }]
  })) : [{ title: today, key: today, icon: <CalendarOutlined />, children: [] }], [packages, today]);

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const screenshotCount = contents.reduce((sum, item: any) => sum + Number(pick(item, 'screenshot_count', 'screenshotCount') || 0), 0);
  const failedCount = contents.filter((item: any) => item.status === 'failed' || pick(item, 'recognition_status', 'recognitionStatus') === 'failed').length;

  const createPackage = async () => {
    const values = await packageForm.validateFields();
    const created = await dataOpsApi.createPackage({
      topicDate: values.topicDate || today,
      operatorUserIds: values.operatorUserIds.map(Number),
      mediaUserIds: values.mediaUserIds.map(Number)
    });
    message.success('主题包已创建');
    setPackageOpen(false);
    packageForm.resetFields();
    await loadPackages();
    setSelectedPackage(created);
  };

  const createTopic = async () => {
    if (!selectedPackage?.id) return message.warning('请先选择主题包');
    const values = await topicForm.validateFields();
    await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode: values.platformCode, subTopicName: values.subTopicName });
    message.success('平台子主题已创建');
    setTopicOpen(false);
    topicForm.resetFields();
    await refreshPackageDetail(selectedPackage.id);
  };

  const confirmContent = async () => {
    if (!activeTopic?.id) return;
    const values = await contentForm.validateFields();
    await dataOpsApi.confirmContent(activeTopic.id, { contentTitle: values.contentTitle, contentSummary: values.contentSummary, contentDate: values.contentDate || today });
    message.success('主题内容已确认创建');
    setContentOpen(false);
    contentForm.resetFields();
    await refreshPackageDetail();
  };

  const uploadCover = async (topic: DataOpsPlatformTopic, file: File) => {
    setUploading(true);
    try {
      await dataOpsApi.uploadCover(topic.id, file);
      message.success('封面上传成功，等待 OCR 识别');
      await refreshPackageDetail();
    } finally {
      setUploading(false);
    }
  };

  const uploadScreenshots = async (content: DataOpsContent, files: UploadFile[]) => {
    const rawFiles = files.map(item => item.originFileObj).filter(Boolean) as File[];
    if (!rawFiles.length) return message.warning('请选择数据截图');
    setUploading(true);
    try {
      await dataOpsApi.uploadScreenshots(content.id, rawFiles);
      message.success('数据截图上传成功，等待识别');
      await refreshPackageDetail();
    } finally {
      setUploading(false);
    }
  };

  const generateReport = async () => {
    await dataOpsApi.generateDailyReport({ date: today });
    message.success('当日报告已生成');
    await loadPackages();
  };

  return (
    <>
      <PageHeader title='运营数据' extra={<Space><Button type='primary' icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button><Button onClick={generateReport}>生成当日报告</Button></Space>} />
      <Row gutter={[16,16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='今日主题包' value={packages.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='主题内容' value={contents.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='上传图片' value={screenshotCount} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='失败任务' value={failedCount} /></Card></Col>
      </Row>
      <Row gutter={[16,16]} className='mt12'>
        <Col xs={24} lg={7}><Card title='左侧文件路径'><Tree showIcon defaultExpandAll treeData={treeData} onSelect={keys => { const key = String(keys?.[0] || ''); const id = Number(key.replace('package-', '')); const pkg = packages.find(item => item.id === id); if (pkg) setSelectedPackage(pkg); }} /></Card></Col>
        <Col xs={24} lg={17}>
          <Card loading={loading} title={selectedPackage ? (pick<string>(selectedPackage, 'display_name', 'displayName') || '主题包工作区') : '主题包工作区'} extra={<Tag color='blue'>数据员生产线</Tag>}>
            {selectedPackage ? <>
              <Row gutter={[16,16]}>
                <Col xs={24} md={12}><Card hoverable title='抖音'><Button icon={<PlusOutlined />} onClick={() => { topicForm.setFieldValue('platformCode', 'DOUYIN'); setTopicOpen(true); }}>创建抖音子主题</Button></Card></Col>
                <Col xs={24} md={12}><Card hoverable title='小红书'><Button icon={<PlusOutlined />} onClick={() => { topicForm.setFieldValue('platformCode', 'XIAOHONGSHU'); setTopicOpen(true); }}>创建小红书子主题</Button></Card></Col>
              </Row>
              <Table className='mt12' rowKey='id' pagination={false} dataSource={platformTopics as any[]} columns={[
                { title: '平台', render: (_: any, r: any) => pick(r, 'platform_name', 'platformName') || pick(r, 'platform_code', 'platformCode') },
                { title: '子主题', render: (_: any, r: any) => pick(r, 'sub_topic_name', 'subTopicName') },
                { title: '封面', render: (_: any, r: any) => pick(r, 'cover_image_url', 'coverImageUrl') ? <Tag color='green'>已上传</Tag> : <Tag>未上传</Tag> },
                { title: '识别状态', render: (_: any, r: any) => <Tag>{pick(r, 'ocr_status', 'ocrStatus') || 'pending'}</Tag> },
                { title: '操作', render: (_: any, r: DataOpsPlatformTopic) => <Space><Upload showUploadList={false} beforeUpload={file => { uploadCover(r, file); return false; }}><Button loading={uploading} icon={<CloudUploadOutlined />}>上传封面</Button></Upload><Button type='link' onClick={() => { setActiveTopic(r); setContentOpen(true); }}>确认主题内容</Button></Space> }
              ]} />
              <Card type='inner' title='主题内容' className='mt12'>
                {contents.length ? <Table rowKey='id' pagination={false} dataSource={contents as any[]} columns={[
                  { title: '标题', render: (_: any, r: any) => pick(r, 'content_title', 'contentTitle') },
                  { title: '平台', render: (_: any, r: any) => pick(r, 'platform_code', 'platformCode') },
                  { title: '截图数量', render: (_: any, r: any) => pick(r, 'screenshot_count', 'screenshotCount') || 0 },
                  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag>{v || 'draft'}</Tag> },
                  { title: '上传截图', render: (_: any, r: DataOpsContent) => <Upload multiple beforeUpload={() => false} onChange={info => uploadScreenshots(r, info.fileList)}><Button loading={uploading} icon={<CloudUploadOutlined />}>上传一组数据图片</Button></Upload> }
                ]} /> : <Empty description='创建主题包后上传封面和数据截图' />}
              </Card>
            </> : <Empty description='请先创建今日主题包' />}
          </Card>
        </Col>
      </Row>

      <Modal title='创建主题包' open={packageOpen} onOk={createPackage} onCancel={() => setPackageOpen(false)} destroyOnClose>
        <Form form={packageForm} layout='vertical' initialValues={{ topicDate: today }}>
          <Form.Item name='topicDate' label='创建日期' rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name='operatorUserIds' label='选择运营人员' rules={[{ required: true, message: '请选择运营人员' }]}><Select mode='multiple' placeholder='请选择运营人员' options={toUserSelectOptions(operatorUsers)} /></Form.Item>
          <Form.Item name='mediaUserIds' label='选择媒体人员' rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode='multiple' placeholder='请选择媒体人员' options={toUserSelectOptions(mediaUsers)} /></Form.Item>
        </Form>
      </Modal>
      <Modal title='创建平台子主题' open={topicOpen} onOk={createTopic} onCancel={() => setTopicOpen(false)} destroyOnClose>
        <Form form={topicForm} layout='vertical'>
          <Form.Item name='platformCode' label='平台' rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item>
          <Form.Item name='subTopicName' label='子主题名称'><Input placeholder='例如：澳洲留学预算数据' /></Form.Item>
        </Form>
      </Modal>
      <Modal title='确认创建主题内容' open={contentOpen} onOk={confirmContent} onCancel={() => setContentOpen(false)} destroyOnClose>
        <Form form={contentForm} layout='vertical' initialValues={{ contentDate: today }}>
          <Form.Item name='contentTitle' label='主题内容标题' rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name='contentSummary' label='内容说明'><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name='contentDate' label='内容日期'><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
