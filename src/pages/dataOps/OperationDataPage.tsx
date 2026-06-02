import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Tree, Upload, message } from 'antd';
import { CalendarOutlined, CloudUploadOutlined, FolderOpenOutlined, PlusOutlined, ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import { dataOpsApi, type DataOpsContent, type DataOpsPackage, type DataOpsPlatformTopic, type DataOpsUserOption, type PlatformCode } from '@/api/dataOps';

const platformOptions: { label: string; value: PlatformCode }[] = [
  { label: '抖音', value: 'DOUYIN' },
  { label: '小红书', value: 'XIAOHONGSHU' }
];

const platformLabelMap: Record<string, string> = {
  DOUYIN: '抖音',
  XIAOHONGSHU: '小红书',
  WECHAT_CHANNEL: '视频号'
};

function pick<T = any>(row: any, a: string, b: string): T {
  return row?.[a] ?? row?.[b];
}

function toUserSelectOptions(rows: DataOpsUserOption[]) {
  return rows.map(row => ({
    value: row.id,
    label: `${pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}`
  }));
}

function statusColor(status?: string) {
  if (status === 'success' || status === 'recognized') return 'green';
  if (status === 'failed') return 'red';
  if (status === 'pending') return 'gold';
  return 'default';
}

function topicCoverAssetId(topic?: DataOpsPlatformTopic) {
  return pick<number>(topic, 'cover_asset_id', 'coverAssetId') || topic?.asset?.id;
}

function topicPlatform(topic?: DataOpsPlatformTopic): PlatformCode | undefined {
  return pick<PlatformCode>(topic, 'platform_code', 'platformCode');
}

function topicDisplayName(topic?: DataOpsPlatformTopic) {
  return pick<string>(topic, 'ocr_title', 'ocrTitle') || pick<string>(topic, 'sub_topic_name', 'subTopicName') || '';
}

function contentTopicId(content?: DataOpsContent) {
  return pick<number>(content, 'platform_topic_id', 'platformTopicId');
}

function contentPlatform(content?: DataOpsContent): PlatformCode | undefined {
  return pick<PlatformCode>(content, 'platform_code', 'platformCode');
}

function setFlag<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T, enabled: boolean) {
  setter(prev => {
    const next = new Set(prev);
    if (enabled) next.add(value);
    else next.delete(value);
    return next;
  });
}

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [coverUploadingIds, setCoverUploadingIds] = useState<Set<number>>(new Set());
  const [recognizingTopicIds, setRecognizingTopicIds] = useState<Set<number>>(new Set());
  const [generatingTopicIds, setGeneratingTopicIds] = useState<Set<number>>(new Set());
  const [screenshotUploadingContentIds, setScreenshotUploadingContentIds] = useState<Set<number>>(new Set());
  const [packages, setPackages] = useState<DataOpsPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DataOpsPackage>();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCode>('DOUYIN');
  const [selectedTopicId, setSelectedTopicId] = useState<number>();
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

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const selectedPlatformTopics = useMemo(
    () => platformTopics.filter(topic => topicPlatform(topic) === selectedPlatform),
    [platformTopics, selectedPlatform]
  );
  const selectedTopic = useMemo(
    () => selectedPlatformTopics.find(topic => topic.id === selectedTopicId),
    [selectedPlatformTopics, selectedTopicId]
  );
  const selectedContents = useMemo(() => {
    if (selectedTopicId) return contents.filter(content => contentTopicId(content) === selectedTopicId);
    return contents.filter(content => contentPlatform(content) === selectedPlatform);
  }, [contents, selectedPlatform, selectedTopicId]);

  useEffect(() => {
    if (!selectedPlatformTopics.length) {
      setSelectedTopicId(undefined);
      return;
    }
    if (!selectedTopicId || !selectedPlatformTopics.some(topic => topic.id === selectedTopicId)) {
      setSelectedTopicId(selectedPlatformTopics[0].id);
    }
  }, [selectedPlatformTopics, selectedTopicId]);

  const treeData = useMemo(() => packages.length ? packages.map(pkg => {
    const topics = pkg.platformTopics || [];
    const douyinCount = topics.filter(topic => topicPlatform(topic) === 'DOUYIN').length;
    const xhsCount = topics.filter(topic => topicPlatform(topic) === 'XIAOHONGSHU').length;
    return {
      title: `${pick<string>(pkg, 'topic_date', 'topicDate') || today}`,
      key: `date-${pkg.id}`,
      icon: <CalendarOutlined />,
      children: [{
        title: pick<string>(pkg, 'display_name', 'displayName') || '数据主题包',
        key: `package-${pkg.id}`,
        icon: <FolderOpenOutlined />,
        children: [
          { title: `抖音 (${douyinCount})`, key: `platform-${pkg.id}-DOUYIN` },
          { title: `小红书 (${xhsCount})`, key: `platform-${pkg.id}-XIAOHONGSHU` }
        ]
      }]
    };
  }) : [{ title: today, key: today, icon: <CalendarOutlined />, children: [] }], [packages, today]);

  const selectedTreeKeys = selectedPackage ? [`platform-${selectedPackage.id}-${selectedPlatform}`] : [];
  const screenshotCount = selectedContents.reduce((sum, item: any) => sum + Number(pick(item, 'screenshot_count', 'screenshotCount') || 0), 0);
  const failedCount = selectedContents.filter((item: any) => item.status === 'failed' || pick(item, 'recognition_status', 'recognitionStatus') === 'failed').length;

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
    setSelectedPlatform('DOUYIN');
  };

  const createTopic = async () => {
    if (!selectedPackage?.id) return message.warning('请先选择主题包');
    const values = await topicForm.validateFields();
    const platformCode = values.platformCode as PlatformCode;
    await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode, subTopicName: values.subTopicName });
    message.success('平台子主题已创建');
    setTopicOpen(false);
    topicForm.resetFields();
    setSelectedPlatform(platformCode);
    await refreshPackageDetail(selectedPackage.id);
  };

  const openTopicModal = (platformCode: PlatformCode) => {
    topicForm.setFieldValue('platformCode', platformCode);
    setSelectedPlatform(platformCode);
    setTopicOpen(true);
  };

  const openConfirmContent = (topic: DataOpsPlatformTopic) => {
    setActiveTopic(topic);
    setSelectedTopicId(topic.id);
    contentForm.setFieldsValue({
      contentTitle: topicDisplayName(topic),
      contentDate: today
    });
    setContentOpen(true);
  };

  const confirmContent = async () => {
    if (!activeTopic?.id) return;
    const values = await contentForm.validateFields();
    await dataOpsApi.confirmContent(activeTopic.id, { contentTitle: values.contentTitle, contentSummary: values.contentSummary, contentDate: values.contentDate || today });
    message.success('主题内容已确认创建');
    setContentOpen(false);
    contentForm.resetFields();
    setSelectedTopicId(activeTopic.id);
    await refreshPackageDetail();
  };

  const recognizeCover = async (topic: DataOpsPlatformTopic) => {
    const assetId = topicCoverAssetId(topic);
    if (!assetId) return message.warning('请先上传封面');
    const platform = topicPlatform(topic);
    setFlag(setRecognizingTopicIds, topic.id, true);
    try {
      const result = await dataOpsApi.recognizeAsset(assetId, { platform, scene: 'CONTENT_DETAIL' });
      const title = result?.result?.contentTitle || result?.result?.topicName || result?.result?.title || result?.result?.name;
      message.success(title ? `封面识别成功：${title}` : '封面识别成功');
      setSelectedTopicId(topic.id);
      await refreshPackageDetail();
    } finally {
      setFlag(setRecognizingTopicIds, topic.id, false);
    }
  };

  const uploadCover = async (topic: DataOpsPlatformTopic, file: File) => {
    setSelectedTopicId(topic.id);
    setFlag(setCoverUploadingIds, topic.id, true);
    try {
      const uploaded = await dataOpsApi.uploadCover(topic.id, file);
      message.success('封面上传成功，开始识别封面标题');
      await recognizeCover(uploaded || topic);
    } finally {
      setFlag(setCoverUploadingIds, topic.id, false);
    }
  };

  const uploadScreenshots = async (content: DataOpsContent, files: File[]) => {
    const rawFiles = files.filter(Boolean);
    if (!rawFiles.length) return message.warning('请选择数据截图');
    setFlag(setScreenshotUploadingContentIds, content.id, true);
    try {
      await dataOpsApi.uploadScreenshots(content.id, rawFiles);
      message.success('数据截图上传成功，等待识别');
      await refreshPackageDetail();
    } finally {
      setFlag(setScreenshotUploadingContentIds, content.id, false);
    }
  };

  const generateCurrentTopicData = async (topic: DataOpsPlatformTopic) => {
    if (!topic?.id) return;
    setSelectedTopicId(topic.id);
    setFlag(setGeneratingTopicIds, topic.id, true);
    try {
      const result = await dataOpsApi.generateCurrentTopicData(topic.id);
      if (result.package) {
        setSelectedPackage(result.package);
        setPackages(rows => rows.map(item => item.id === result.packageId ? result.package! : item));
      } else {
        await refreshPackageDetail();
      }
      const summary = `封面${result.coverRecognized || 0}，截图${result.screenshotsRecognized || 0}，跳过${result.skipped || 0}，失败${result.failed || 0}`;
      if (result.failed) message.warning(`当前主题数据生成完成，但有失败项：${summary}`);
      else message.success(`当前主题数据生成完成：${summary}`);
    } finally {
      setFlag(setGeneratingTopicIds, topic.id, false);
    }
  };

  const generateReport = async () => {
    setReportGenerating(true);
    try {
      await dataOpsApi.generateDailyReport({ date: today });
      message.success('当日报告已生成');
      await loadPackages();
    } finally {
      setReportGenerating(false);
    }
  };

  const handleTreeSelect = (keys: React.Key[]) => {
    const key = String(keys?.[0] || '');
    if (!key) return;
    if (key.startsWith('platform-')) {
      const [, packageId, platform] = key.split('-');
      const pkg = packages.find(item => item.id === Number(packageId));
      if (pkg) setSelectedPackage(pkg);
      setSelectedPlatform(platform as PlatformCode);
      return;
    }
    if (key.startsWith('package-')) {
      const id = Number(key.replace('package-', ''));
      const pkg = packages.find(item => item.id === id);
      if (pkg) setSelectedPackage(pkg);
    }
  };

  return (
    <>
      <PageHeader title='运营数据' extra={<Space><Button type='primary' icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button><Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button></Space>} />
      <Row gutter={[16,16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前平台子主题' value={selectedPlatformTopics.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前主题内容' value={selectedContents.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前上传图片' value={screenshotCount} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前失败任务' value={failedCount} /></Card></Col>
      </Row>
      <Row gutter={[16,16]} className='mt12'>
        <Col xs={24} lg={7}>
          <Card title='主题路径'>
            <Tree showIcon defaultExpandAll selectedKeys={selectedTreeKeys} treeData={treeData} onSelect={handleTreeSelect} />
          </Card>
        </Col>
        <Col xs={24} lg={17}>
          <Card
            loading={loading}
            title={selectedPackage ? `${pick<string>(selectedPackage, 'display_name', 'displayName') || '主题包工作区'} / ${platformLabelMap[selectedPlatform] || selectedPlatform}` : '主题包工作区'}
            extra={<Space><Tag color='blue'>{platformLabelMap[selectedPlatform] || selectedPlatform}</Tag><Button icon={<PlusOutlined />} onClick={() => openTopicModal(selectedPlatform)}>创建{platformLabelMap[selectedPlatform] || ''}子主题</Button></Space>}
          >
            {selectedPackage ? <>
              <Row gutter={[16,16]}>
                <Col xs={24} md={12}><Card hoverable title='抖音' extra={selectedPlatform === 'DOUYIN' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} onClick={() => openTopicModal('DOUYIN')}>创建抖音子主题</Button></Card></Col>
                <Col xs={24} md={12}><Card hoverable title='小红书' extra={selectedPlatform === 'XIAOHONGSHU' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} onClick={() => openTopicModal('XIAOHONGSHU')}>创建小红书子主题</Button></Card></Col>
              </Row>
              <Table
                className='mt12'
                rowKey='id'
                pagination={{ pageSize: 5, showSizeChanger: false }}
                dataSource={selectedPlatformTopics as any[]}
                onRow={record => ({
                  onClick: () => setSelectedTopicId(record.id)
                })}
                rowClassName={record => record.id === selectedTopicId ? 'ant-table-row-selected' : ''}
                columns={[
                  { title: '平台', width: 90, render: (_: any, r: any) => pick(r, 'platform_name', 'platformName') || platformLabelMap[pick(r, 'platform_code', 'platformCode')] || pick(r, 'platform_code', 'platformCode') },
                  { title: '子主题', render: (_: any, r: any) => pick(r, 'sub_topic_name', 'subTopicName') },
                  { title: '识别标题', render: (_: any, r: any) => pick(r, 'ocr_title', 'ocrTitle') || '-' },
                  { title: '封面', width: 90, render: (_: any, r: any) => pick(r, 'cover_image_url', 'coverImageUrl') ? <Tag color='green'>已上传</Tag> : <Tag>未上传</Tag> },
                  { title: '识别状态', width: 120, render: (_: any, r: any) => { const v = pick<string>(r, 'ocr_status', 'ocrStatus') || 'pending'; return <Tag color={statusColor(v)}>{v}</Tag>; } },
                  { title: '操作', width: 500, render: (_: any, r: DataOpsPlatformTopic) => {
                    const coverBusy = coverUploadingIds.has(r.id) || recognizingTopicIds.has(r.id);
                    const generating = generatingTopicIds.has(r.id);
                    return <Space wrap onClick={event => event.stopPropagation()}>
                      <Upload showUploadList={false} beforeUpload={file => { uploadCover(r, file); return false; }}>
                        <Button loading={coverBusy} icon={<CloudUploadOutlined />}>上传封面并识别</Button>
                      </Upload>
                      <Button icon={<ScanOutlined />} loading={recognizingTopicIds.has(r.id)} disabled={!topicCoverAssetId(r)} onClick={() => recognizeCover(r)}>识别封面</Button>
                      <Button loading={generating} disabled={!topicCoverAssetId(r)} onClick={() => generateCurrentTopicData(r)}>生成当前主题数据</Button>
                      <Button type='link' onClick={() => openConfirmContent(r)}>确认主题内容</Button>
                    </Space>;
                  } }
                ]}
              />
              <Card
                type='inner'
                title={selectedTopic ? `主题内容：${topicDisplayName(selectedTopic) || pick(selectedTopic, 'sub_topic_name', 'subTopicName')}` : '主题内容'}
                className='mt12'
                extra={selectedTopic ? <Button loading={generatingTopicIds.has(selectedTopic.id)} disabled={!topicCoverAssetId(selectedTopic)} onClick={() => generateCurrentTopicData(selectedTopic)}>生成当前主题数据</Button> : null}
              >
                {selectedContents.length ? <Table rowKey='id' pagination={{ pageSize: 5, showSizeChanger: false }} dataSource={selectedContents as any[]} columns={[
                  { title: '标题', render: (_: any, r: any) => pick(r, 'content_title', 'contentTitle') },
                  { title: '平台', width: 90, render: (_: any, r: any) => platformLabelMap[pick(r, 'platform_code', 'platformCode')] || pick(r, 'platform_code', 'platformCode') },
                  { title: '截图数量', width: 100, render: (_: any, r: any) => pick(r, 'screenshot_count', 'screenshotCount') || 0 },
                  { title: '状态', width: 110, render: (_: any, r: any) => <Tag color={statusColor(pick(r, 'recognition_status', 'recognitionStatus') || r.status)}>{pick(r, 'recognition_status', 'recognitionStatus') || r.status || 'draft'}</Tag> },
                  { title: '上传截图', width: 180, render: (_: any, r: DataOpsContent) => <Upload
                    multiple
                    showUploadList={false}
                    customRequest={async options => {
                      try {
                        await uploadScreenshots(r, [options.file as File]);
                        options.onSuccess?.({}, options.file as any);
                      } catch (error) {
                        options.onError?.(error as Error);
                      }
                    }}
                  ><Button loading={screenshotUploadingContentIds.has(r.id)} icon={<CloudUploadOutlined />}>上传数据图片</Button></Upload> }
                ]} /> : <Empty description={selectedTopic ? '当前子主题还没有确认主题内容' : '请选择一个子主题'} />}
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
