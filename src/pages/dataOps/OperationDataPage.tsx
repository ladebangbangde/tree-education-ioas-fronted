import { Button, Card, Col, Empty, Form, Image, Input, Modal, Row, Select, Space, Statistic, Table, Tabs, Tag, Tree, Upload, message } from 'antd';
import { CalendarOutlined, CloudUploadOutlined, FolderOpenOutlined, PlusOutlined, ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import { API_ROOT_URL } from '@/api/client';
import {
  dataOpsApi,
  type DataOpsAsset,
  type DataOpsAssetGroup,
  type DataOpsContent,
  type DataOpsContentType,
  type DataOpsMetricRow,
  type DataOpsPackage,
  type DataOpsPlatformTopic,
  type DataOpsTopicRecognitionStatus,
  type DataOpsUserOption,
  type PlatformCode
} from '@/api/dataOps';
import { AccountVideoMetricTable } from './components/AccountVideoMetricTable';

const platformOptions: { label: string; value: PlatformCode }[] = [
  { label: '抖音', value: 'DOUYIN' },
  { label: '小红书', value: 'XIAOHONGSHU' },
  { label: '视频号', value: 'WECHAT_CHANNEL' }
];

const contentTypeOptions: { label: string; value: DataOpsContentType }[] = [
  { label: '图文', value: 'IMAGE_TEXT' },
  { label: '视频', value: 'VIDEO' }
];

const dataGroups: { key: DataOpsAssetGroup; title: string; desc: string }[] = [
  { key: 'DOUYIN_OVERVIEW', title: '数据页1 · 总览指标', desc: '播放量、点赞量、评论量、分享量、收藏量、完播率、划走率' },
  { key: 'DOUYIN_OVERVIEW_CHART', title: '数据页2 · 趋势/粉丝图表', desc: '趋势曲线、涨粉量、脱粉量、粉丝播放占比、小时/每日图表' },
  { key: 'DOUYIN_FLOW_ANALYSIS', title: '数据页3 · 流量分析', desc: '流量上涨、封面点击率、评论率、分享率、完播率、5s完播率' }
];

const platformLabelMap: Record<string, string> = { DOUYIN: '抖音', XIAOHONGSHU: '小红书', WECHAT_CHANNEL: '视频号' };
const platformIdLabelMap: Record<string, string> = { DOUYIN: '抖音号', XIAOHONGSHU: '小红书号', WECHAT_CHANNEL: '视频号' };
const contentTypeLabelMap: Record<string, string> = { IMAGE_TEXT: '图文', VIDEO: '视频' };

function pick<T = any>(row: any, a: string, b: string): T {
  return row?.[a] ?? row?.[b];
}

function packageDate(pkg?: DataOpsPackage) {
  return pick<string>(pkg, 'topic_date', 'topicDate') || dayjs().format('YYYY-MM-DD');
}

function packageTitle(pkg?: DataOpsPackage) {
  return pick<string>(pkg, 'display_name', 'displayName') || pick<string>(pkg, 'folder_name', 'folderName') || '数据主题包';
}

function topicPlatform(topic?: DataOpsPlatformTopic): PlatformCode | undefined {
  return pick<PlatformCode>(topic, 'platform_code', 'platformCode');
}

function topicContentType(topic?: DataOpsPlatformTopic): DataOpsContentType {
  return pick<DataOpsContentType>(topic, 'content_type', 'contentType') || 'IMAGE_TEXT';
}

function topicName(topic?: DataOpsPlatformTopic) {
  return pick<string>(topic, 'sub_topic_name', 'subTopicName') || pick<string>(topic, 'ocr_title', 'ocrTitle') || '';
}

function topicCoverAssetId(topic?: DataOpsPlatformTopic) {
  return pick<number>(topic, 'cover_asset_id', 'coverAssetId') || topic?.asset?.id;
}

function contentTopicId(content?: DataOpsContent) {
  return pick<number>(content, 'platform_topic_id', 'platformTopicId');
}

function contentPlatform(content?: DataOpsContent): PlatformCode | undefined {
  return pick<PlatformCode>(content, 'platform_code', 'platformCode');
}

function contentContentType(content?: DataOpsContent): DataOpsContentType {
  return pick<DataOpsContentType>(content, 'content_type', 'contentType') || 'IMAGE_TEXT';
}

function contentTitle(content?: DataOpsContent) {
  return pick<string>(content, 'content_title', 'contentTitle') || '';
}

function assetTopicId(asset?: DataOpsAsset) {
  return pick<number>(asset, 'platform_topic_id', 'platformTopicId');
}

function assetType(asset?: DataOpsAsset) {
  return pick<string>(asset, 'asset_type', 'assetType');
}

function assetGroup(asset?: DataOpsAsset): DataOpsAssetGroup {
  return pick<DataOpsAssetGroup>(asset, 'asset_group', 'assetGroup') || 'DOUYIN_OVERVIEW';
}

function assetFileName(asset?: DataOpsAsset) {
  return pick<string>(asset, 'original_filename', 'originalFilename') || pick<string>(asset, 'file_name', 'fileName') || `图片 ${asset?.id || ''}`;
}

function assetUrl(asset?: DataOpsAsset) {
  return pick<string>(asset, 'public_url', 'publicUrl') || pick<string>(asset, 'url', 'url') || pick<string>(asset, 'thumbnail_url', 'thumbnailUrl') || '';
}

function assetStatus(asset?: DataOpsAsset) {
  return pick<string>(asset, 'recognition_status', 'recognitionStatus') || pick<string>(asset, 'upload_status', 'uploadStatus') || pick<string>(asset, 'status', 'status') || 'pending';
}

function toPreviewUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const root = API_ROOT_URL.replace(/\/api\/?$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
}

function statusColor(status?: string) {
  const value = String(status || '').toUpperCase();
  if (['SUCCESS', 'DATA_SUCCESS', 'COVER_SUCCESS'].includes(value) || status === 'recognized') return 'green';
  if (['FAILED', 'DATA_FAILED', 'COVER_FAILED'].includes(value) || status === 'failed') return 'red';
  if (['PROCESSING', 'DATA_PROCESSING'].includes(value) || status === 'processing') return 'blue';
  if (['DATA_PARTIAL', 'PARTIAL'].includes(value)) return 'orange';
  if (['PENDING', 'DATA_PENDING'].includes(value) || status === 'pending') return 'gold';
  return 'default';
}

function metricStatusView(status?: DataOpsTopicRecognitionStatus) {
  return { label: status?.label || '未上传', color: status?.color || statusColor(status?.status) };
}

function mergePackage(rows: DataOpsPackage[], detail: DataOpsPackage) {
  return rows.some(item => item.id === detail.id) ? rows.map(item => item.id === detail.id ? detail : item) : [detail, ...rows];
}

function userOptions(rows: DataOpsUserOption[]) {
  return rows.map(row => ({
    value: row.id,
    label: `${pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}`
  }));
}

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [metricLoading, setMetricLoading] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [uploadingTitle, setUploadingTitle] = useState(false);
  const [uploadingData, setUploadingData] = useState(false);
  const [packages, setPackages] = useState<DataOpsPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DataOpsPackage>();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCode>('DOUYIN');
  const [selectedContentType, setSelectedContentType] = useState<DataOpsContentType>('IMAGE_TEXT');
  const [selectedTopicId, setSelectedTopicId] = useState<number>();
  const [topicMetrics, setTopicMetrics] = useState<DataOpsMetricRow[]>([]);
  const [topicMetricStatus, setTopicMetricStatus] = useState<DataOpsTopicRecognitionStatus>();
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
      const hydrated = await Promise.all((rows || []).map(async row => {
        try { return await dataOpsApi.packageDetail(row.id); } catch { return row; }
      }));
      setPackages(hydrated);
      setSelectedPackage(current => current?.id ? hydrated.find(item => item.id === current.id) || hydrated[0] : hydrated[0]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPackageDetail = async (packageId?: number) => {
    const id = packageId || selectedPackage?.id;
    if (!id) return;
    const detail = await dataOpsApi.packageDetail(id);
    setSelectedPackage(detail);
    setPackages(rows => mergePackage(rows, detail));
  };

  const refreshTopicMetrics = async (topicId?: number) => {
    if (!topicId) {
      setTopicMetrics([]);
      setTopicMetricStatus(undefined);
      return;
    }
    setMetricLoading(true);
    try {
      const result = await dataOpsApi.topicMetrics(topicId);
      setTopicMetrics(result.rows || []);
      setTopicMetricStatus(result.status);
    } finally {
      setMetricLoading(false);
    }
  };

  useEffect(() => {
    loadPackages().catch(() => undefined);
    Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA')])
      .then(([operators, media]) => { setOperatorUsers(operators || []); setMediaUsers(media || []); })
      .catch(() => undefined);
  }, []);

  useEffect(() => { refreshTopicMetrics(selectedTopicId).catch(() => undefined); }, [selectedTopicId]);

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const assets = selectedPackage?.assets || [];
  const selectedPlatformTopics = useMemo(() => platformTopics.filter(topic => topicPlatform(topic) === selectedPlatform && topicContentType(topic) === selectedContentType), [platformTopics, selectedPlatform, selectedContentType]);
  const selectedTopic = useMemo(() => selectedPlatformTopics.find(topic => topic.id === selectedTopicId), [selectedPlatformTopics, selectedTopicId]);
  const selectedContents = useMemo(() => selectedTopicId ? contents.filter(content => contentTopicId(content) === selectedTopicId) : contents.filter(content => contentPlatform(content) === selectedPlatform && contentContentType(content) === selectedContentType), [contents, selectedPlatform, selectedContentType, selectedTopicId]);
  const selectedContent = selectedContents[0];
  const selectedTopicAssets = useMemo(() => selectedTopicId ? assets.filter(asset => Number(assetTopicId(asset)) === selectedTopicId) : [], [assets, selectedTopicId]);
  const titleAsset = selectedTopicAssets.find(asset => assetType(asset) === 'COVER');
  const dataAssets = selectedTopicAssets.filter(asset => assetType(asset) === 'DATA_SCREENSHOT');
  const selectedStatus = metricStatusView(topicMetricStatus);

  useEffect(() => {
    if (!selectedPlatformTopics.length) {
      setSelectedTopicId(undefined);
      return;
    }
    if (!selectedTopicId || !selectedPlatformTopics.some(topic => topic.id === selectedTopicId)) {
      setSelectedTopicId(selectedPlatformTopics[0].id);
    }
  }, [selectedPlatformTopics, selectedTopicId]);

  const treeData = useMemo(() => {
    if (!packages.length) return [{ title: today, key: `date-${today}`, icon: <CalendarOutlined />, children: [] }];
    const groups = new Map<string, DataOpsPackage[]>();
    packages.forEach(pkg => groups.set(packageDate(pkg), [...(groups.get(packageDate(pkg)) || []), pkg]));
    return Array.from(groups.entries()).map(([date, datePackages]) => ({
      title: `${date}（${datePackages.length} 个主题包）`,
      key: `date-${date}`,
      icon: <CalendarOutlined />,
      children: datePackages.map(pkg => ({
        title: packageTitle(pkg),
        key: `package-${pkg.id}`,
        icon: <FolderOpenOutlined />,
        children: platformOptions.map(platform => ({
          title: `${platform.label} (${(pkg.platformTopics || []).filter(topic => topicPlatform(topic) === platform.value).length})`,
          key: `platform-${pkg.id}-${platform.value}`
        }))
      }))
    }));
  }, [packages, today]);

  const createPackage = async () => {
    setPackageSubmitting(true);
    try {
      const values = await packageForm.validateFields();
      const created = await dataOpsApi.createPackage({ topicDate: values.topicDate || today, operatorUserIds: values.operatorUserIds.map(Number), mediaUserIds: values.mediaUserIds.map(Number) });
      message.success('主题包已创建');
      setPackageOpen(false);
      packageForm.resetFields();
      setSelectedPackage(created);
      setPackages(rows => mergePackage(rows, created));
      await refreshPackageDetail(created.id);
    } finally {
      setPackageSubmitting(false);
    }
  };

  const createTopic = async () => {
    if (!selectedPackage?.id) return message.warning('请先选择主题包');
    setTopicSubmitting(true);
    try {
      const values = await topicForm.validateFields();
      const created = await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode: values.platformCode, contentType: values.contentType || selectedContentType, subTopicName: values.subTopicName });
      message.success('平台子主题已创建');
      setTopicOpen(false);
      topicForm.resetFields();
      setSelectedPlatform(values.platformCode);
      setSelectedContentType(values.contentType || selectedContentType);
      setSelectedTopicId(created.id);
      await refreshPackageDetail(selectedPackage.id);
    } finally {
      setTopicSubmitting(false);
    }
  };

  const openTopicModal = (platform: PlatformCode) => {
    topicForm.setFieldsValue({ platformCode: platform, contentType: selectedContentType });
    setSelectedPlatform(platform);
    setTopicOpen(true);
  };

  const openConfirmContent = (topic: DataOpsPlatformTopic) => {
    setActiveTopic(topic);
    setSelectedTopicId(topic.id);
    contentForm.setFieldsValue({ contentTitle: contentTitle(selectedContent) || topicName(topic), contentType: topicContentType(topic), contentDate: today });
    setContentOpen(true);
  };

  const confirmContent = async () => {
    if (!activeTopic?.id) return;
    setContentSubmitting(true);
    try {
      const values = await contentForm.validateFields();
      await dataOpsApi.confirmContent(activeTopic.id, { contentTitle: values.contentTitle, contentSummary: values.contentSummary, contentDate: values.contentDate || today, contentType: values.contentType || topicContentType(activeTopic) });
      message.success('视频标题已确认');
      setContentOpen(false);
      contentForm.resetFields();
      await refreshPackageDetail();
      await refreshTopicMetrics(activeTopic.id);
    } finally {
      setContentSubmitting(false);
    }
  };

  const uploadTitlePage = async (topic: DataOpsPlatformTopic, file: File) => {
    setUploadingTitle(true);
    setSelectedTopicId(topic.id);
    try {
      const updated = await dataOpsApi.uploadCover(topic.id, file);
      const assetId = topicCoverAssetId(updated) || topicCoverAssetId(topic);
      if (assetId) await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(topic), scene: 'CONTENT_DETAIL' });
      message.success('视频标题页/封面识别完成');
      await refreshPackageDetail();
      await refreshTopicMetrics(topic.id);
    } finally {
      setUploadingTitle(false);
    }
  };

  const uploadDataPage = async (group: DataOpsAssetGroup, file: File) => {
    if (!selectedContent?.id) return message.warning('请先上传或确认视频标题页');
    setUploadingData(true);
    try {
      await dataOpsApi.uploadScreenshots(selectedContent.id, [file], group);
      message.success('视频数据图上传成功，后台会异步识别');
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopicId);
    } finally {
      setUploadingData(false);
    }
  };

  const generateCurrentTopicData = async (topic: DataOpsPlatformTopic) => {
    setUploadingTitle(true);
    try {
      const result = await dataOpsApi.generateCurrentTopicData(topic.id);
      if (result.package) {
        setSelectedPackage(result.package);
        setPackages(rows => mergePackage(rows, result.package!));
      } else {
        await refreshPackageDetail();
      }
      await refreshTopicMetrics(topic.id);
      message.success('当前主题识别任务已处理');
    } finally {
      setUploadingTitle(false);
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
    if (key.startsWith('platform-')) {
      const [, packageId, platform] = key.split('-');
      const pkg = packages.find(item => item.id === Number(packageId));
      if (pkg) setSelectedPackage(pkg);
      setSelectedPlatform(platform as PlatformCode);
      setSelectedContentType('IMAGE_TEXT');
      setSelectedTopicId(undefined);
    }
    if (key.startsWith('package-')) {
      const pkg = packages.find(item => item.id === Number(key.replace('package-', '')));
      if (pkg) setSelectedPackage(pkg);
      setSelectedTopicId(undefined);
    }
  };

  const preview = (asset?: DataOpsAsset) => asset ? <Image src={toPreviewUrl(assetUrl(asset))} width="100%" height={130} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传" />;

  return <>
    <PageHeader title="运营数据" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button><Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button></Space>} />
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前子主题" value={selectedPlatformTopics.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前视频" value={selectedContents.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前图片" value={selectedTopicAssets.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="缺失指标" value={topicMetricStatus?.missing || 0} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]} className="mt12">
      <Col xs={24} lg={5}><Card title="主题路径"><Tree showIcon defaultExpandAll selectedKeys={selectedPackage ? [`platform-${selectedPackage.id}-${selectedPlatform}`] : []} treeData={treeData} onSelect={handleTreeSelect} /></Card></Col>
      <Col xs={24} lg={19}>
        <Card loading={loading} title={selectedPackage ? `${packageTitle(selectedPackage)} / ${platformLabelMap[selectedPlatform]}` : '主题包工作区'} extra={<Space><Tag color="blue">{platformLabelMap[selectedPlatform]}</Tag><Button icon={<PlusOutlined />} onClick={() => openTopicModal(selectedPlatform)}>创建子主题</Button></Space>}>
          {selectedPackage ? <>
            <Tabs activeKey={selectedContentType} onChange={key => { setSelectedContentType(key as DataOpsContentType); setSelectedTopicId(undefined); }} items={contentTypeOptions.map(item => ({ key: item.value, label: item.label }))} />
            <Table rowKey="id" pagination={{ pageSize: 5 }} dataSource={selectedPlatformTopics as any[]} onRow={record => ({ onClick: () => setSelectedTopicId(record.id) })} columns={[
              { title: '平台', width: 90, render: (_, row: any) => platformLabelMap[pick(row, 'platform_code', 'platformCode')] },
              { title: '类型', width: 90, render: (_, row: any) => <Tag>{contentTypeLabelMap[topicContentType(row)]}</Tag> },
              { title: '子主题', render: (_, row: any) => pick(row, 'sub_topic_name', 'subTopicName') },
              { title: '账号', render: (_, row: any) => pick(row, 'ocr_account_name', 'ocrAccountName') || 'null' },
              { title: platformIdLabelMap[selectedPlatform], render: (_, row: any) => pick(row, 'ocr_platform_user_id', 'ocrPlatformUserId') || 'null' },
              { title: '状态', render: (_, row: any) => row.id === selectedTopicId ? <Tag color={selectedStatus.color}>{selectedStatus.label}</Tag> : <Tag>{pick(row, 'ocr_status', 'ocrStatus') || 'pending'}</Tag> },
              { title: '操作', width: 430, render: (_, row: DataOpsPlatformTopic) => <Space wrap onClick={event => event.stopPropagation()}>
                <Upload showUploadList={false} beforeUpload={file => { uploadTitlePage(row, file); return false; }}><Button loading={uploadingTitle && selectedTopicId === row.id} icon={<CloudUploadOutlined />}>上传视频标题页</Button></Upload>
                <Button icon={<ScanOutlined />} disabled={!topicCoverAssetId(row)} onClick={() => dataOpsApi.recognizeAsset(topicCoverAssetId(row), { platform: topicPlatform(row), scene: 'CONTENT_DETAIL' }).then(() => refreshTopicMetrics(row.id))}>识别标题页</Button>
                <Button onClick={() => openConfirmContent(row)}>手动确认视频标题</Button>
                <Button onClick={() => generateCurrentTopicData(row)}>生成数据</Button>
              </Space> }
            ]} />
            <Card type="inner" className="mt12" title={selectedTopic ? `当前子主题：${topicName(selectedTopic)}` : '当前子主题'} extra={selectedTopic ? <Button loading={metricLoading} onClick={() => refreshTopicMetrics(selectedTopic.id)}>刷新</Button> : null}>
              {selectedTopic ? <Row gutter={[12, 12]}>
                <Col xs={24} md={8}><Statistic title="账号名称" value={pick<string>(selectedTopic, 'ocr_account_name', 'ocrAccountName') || 'null'} /></Col>
                <Col xs={24} md={8}><Statistic title={platformIdLabelMap[selectedPlatform]} value={pick<string>(selectedTopic, 'ocr_platform_user_id', 'ocrPlatformUserId') || 'null'} /></Col>
                <Col xs={24} md={8}><Statistic title="当前视频标题" value={contentTitle(selectedContent) || pick<string>(selectedTopic, 'ocr_content_title', 'ocrContentTitle') || 'null'} /></Col>
              </Row> : <Empty description="请选择一个子主题" />}
            </Card>
            <Card type="inner" className="mt12" title="账号 → 视频 → 视频数据" extra={topicMetricStatus ? <Space><Tag color={selectedStatus.color}>{selectedStatus.label}</Tag><span>成功 {topicMetricStatus.success || 0}/{topicMetricStatus.total || 0}</span></Space> : null}>
              <AccountVideoMetricTable rows={topicMetrics} loading={metricLoading} />
            </Card>
            <Card type="inner" className="mt12" title="视频标题页与数据图上传">
              {selectedTopic ? <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}><Card size="small" title="视频标题页 / 封面图" extra={titleAsset ? <Tag color={statusColor(assetStatus(titleAsset))}>{assetStatus(titleAsset)}</Tag> : <Tag>未上传</Tag>}>{preview(titleAsset)}<Button block className="mt12" onClick={() => openConfirmContent(selectedTopic)}>手动确认视频标题</Button></Card></Col>
                <Col xs={24} lg={16}><Space direction="vertical" size={16} style={{ width: '100%' }}>{dataGroups.map(group => {
                  const groupAssets = dataAssets.filter(asset => assetGroup(asset) === group.key);
                  return <Card key={group.key} size="small" title={group.title} extra={<Tag>{groupAssets.length} 张</Tag>}><div style={{ marginBottom: 12, opacity: 0.65 }}>{group.desc}</div><Upload showUploadList={false} beforeUpload={file => { uploadDataPage(group.key, file); return false; }}><Button loading={uploadingData} icon={<CloudUploadOutlined />}>上传{group.title}</Button></Upload><Row gutter={[12, 12]} className="mt12">{groupAssets.map(asset => <Col xs={24} md={8} key={asset.id}><Card size="small" title={assetFileName(asset)} extra={<Tag color={statusColor(assetStatus(asset))}>{assetStatus(asset)}</Tag>}>{preview(asset)}</Card></Col>)}</Row></Card>;
                })}</Space></Col>
              </Row> : <Empty description="请选择一个子主题" />}
            </Card>
          </> : <Empty description="请先创建今日主题包" />}
        </Card>
      </Col>
    </Row>

    <Modal title="创建主题包" open={packageOpen} onOk={createPackage} onCancel={() => setPackageOpen(false)} confirmLoading={packageSubmitting} destroyOnClose>
      <Form form={packageForm} layout="vertical" initialValues={{ topicDate: today }}><Form.Item name="topicDate" label="创建日期" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="operatorUserIds" label="选择运营人员" rules={[{ required: true }]}><Select mode="multiple" options={userOptions(operatorUsers)} /></Form.Item><Form.Item name="mediaUserIds" label="选择媒体人员" rules={[{ required: true }]}><Select mode="multiple" options={userOptions(mediaUsers)} /></Form.Item></Form>
    </Modal>
    <Modal title="创建平台子主题" open={topicOpen} onOk={createTopic} onCancel={() => setTopicOpen(false)} confirmLoading={topicSubmitting} destroyOnClose>
      <Form form={topicForm} layout="vertical" initialValues={{ contentType: selectedContentType }}><Form.Item name="platformCode" label="平台" rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item><Form.Item name="contentType" label="内容类型" rules={[{ required: true }]}><Select options={contentTypeOptions} /></Form.Item><Form.Item name="subTopicName" label="子主题名称"><Input /></Form.Item></Form>
    </Modal>
    <Modal title="确认视频标题" open={contentOpen} onOk={confirmContent} onCancel={() => setContentOpen(false)} confirmLoading={contentSubmitting} destroyOnClose>
      <Form form={contentForm} layout="vertical" initialValues={{ contentDate: today, contentType: selectedContentType }}><Form.Item name="contentTitle" label="视频标题" rules={[{ required: true }]}><Input placeholder="优先用数据页1 candidateTitles 第一条，也可以手动修正" /></Form.Item><Form.Item name="contentType" label="内容类型" rules={[{ required: true }]}><Select options={contentTypeOptions} /></Form.Item><Form.Item name="contentSummary" label="内容说明"><Input.TextArea rows={3} /></Form.Item><Form.Item name="contentDate" label="内容日期"><Input /></Form.Item></Form>
    </Modal>
  </>;
}
