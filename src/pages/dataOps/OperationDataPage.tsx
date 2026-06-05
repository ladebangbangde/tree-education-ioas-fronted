import { Button, Card, Col, Empty, Form, Image, Input, Modal, Popconfirm, Row, Select, Space, Statistic, Table, Tabs, Tag, Tree, Upload, message } from 'antd';
import { CalendarOutlined, CloudUploadOutlined, DeleteOutlined, FolderOpenOutlined, PlusOutlined, ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import { dataOpsApi, type DataOpsAsset, type DataOpsAssetGroup, type DataOpsContent, type DataOpsContentType, type DataOpsMetricRow, type DataOpsPackage, type DataOpsPlatformTopic, type DataOpsTopicRecognitionStatus, type DataOpsUserOption, type PlatformCode } from '@/api/dataOps';
import { API_ROOT_URL } from '@/api/client';

const platformOptions: { label: string; value: PlatformCode }[] = [
  { label: '抖音', value: 'DOUYIN' },
  { label: '小红书', value: 'XIAOHONGSHU' },
  { label: '视频号', value: 'WECHAT_CHANNEL' }
];

const contentTypeOptions: { label: string; value: DataOpsContentType }[] = [
  { label: '图文', value: 'IMAGE_TEXT' },
  { label: '视频', value: 'VIDEO' }
];

const douyinAssetGroups: { key: DataOpsAssetGroup; title: string; desc: string }[] = [
  { key: 'DOUYIN_OVERVIEW', title: '总览', desc: '播放量、点赞量、评论量、分享量、收藏量、完播率、划走率' },
  { key: 'DOUYIN_OVERVIEW_CHART', title: '总览图表数据', desc: '趋势曲线、涨粉量、粉丝播放占比、小时/每日图表' },
  { key: 'DOUYIN_FLOW_ANALYSIS', title: '流量分析', desc: '流量上涨、内容吸引力、评论率、分享率、完播率、5s完播率' }
];

const platformLabelMap: Record<string, string> = { DOUYIN: '抖音', XIAOHONGSHU: '小红书', WECHAT_CHANNEL: '视频号' };
const platformIdLabelMap: Record<string, string> = { DOUYIN: '抖音号', XIAOHONGSHU: '小红书号', WECHAT_CHANNEL: '视频号' };
const contentTypeLabelMap: Record<string, string> = { IMAGE_TEXT: '图文', VIDEO: '视频' };
const metricGroupLabelMap: Record<string, string> = { OVERVIEW: '总览指标', OVERVIEW_CHART: '总览图表', FLOW_ANALYSIS: '流量分析' };

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
  const value = String(status || '').toUpperCase();
  if (['SUCCESS', 'DATA_SUCCESS', 'COVER_SUCCESS'].includes(value) || ['success', 'recognized'].includes(String(status))) return 'green';
  if (['FAILED', 'DATA_FAILED', 'COVER_FAILED'].includes(value) || status === 'failed') return 'red';
  if (['PROCESSING', 'DATA_PROCESSING', 'COVER_PROCESSING'].includes(value) || status === 'processing') return 'blue';
  if (['PARTIAL', 'DATA_PARTIAL'].includes(value)) return 'orange';
  if (['PENDING', 'DATA_PENDING', 'COVER_PENDING'].includes(value) || status === 'pending') return 'gold';
  return 'default';
}

function packageDate(pkg?: DataOpsPackage) {
  return pick<string>(pkg, 'topic_date', 'topicDate') || dayjs().format('YYYY-MM-DD');
}

function packageTitle(pkg?: DataOpsPackage) {
  return pick<string>(pkg, 'display_name', 'displayName') || pick<string>(pkg, 'folder_name', 'folderName') || '数据主题包';
}

function topicCoverAssetId(topic?: DataOpsPlatformTopic) {
  return pick<number>(topic, 'cover_asset_id', 'coverAssetId') || topic?.asset?.id;
}

function topicPlatform(topic?: DataOpsPlatformTopic): PlatformCode | undefined {
  return pick<PlatformCode>(topic, 'platform_code', 'platformCode');
}

function topicContentType(topic?: DataOpsPlatformTopic): DataOpsContentType {
  return pick<DataOpsContentType>(topic, 'content_type', 'contentType') || 'IMAGE_TEXT';
}

function topicDisplayName(topic?: DataOpsPlatformTopic) {
  return pick<string>(topic, 'ocr_content_title', 'ocrContentTitle') || pick<string>(topic, 'ocr_title', 'ocrTitle') || pick<string>(topic, 'sub_topic_name', 'subTopicName') || '';
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

function assetTopicId(asset?: DataOpsAsset) { return pick<number>(asset, 'platform_topic_id', 'platformTopicId'); }
function assetType(asset?: DataOpsAsset) { return pick<string>(asset, 'asset_type', 'assetType'); }
function assetGroup(asset?: DataOpsAsset): DataOpsAssetGroup { return pick<DataOpsAssetGroup>(asset, 'asset_group', 'assetGroup') || 'DOUYIN_OVERVIEW'; }
function assetFileName(asset?: DataOpsAsset) { return pick<string>(asset, 'original_filename', 'originalFilename') || pick<string>(asset, 'file_name', 'fileName') || `图片 ${asset?.id || ''}`; }
function assetUrl(asset?: DataOpsAsset) { return pick<string>(asset, 'public_url', 'publicUrl') || pick<string>(asset, 'url', 'url') || pick<string>(asset, 'thumbnail_url', 'thumbnailUrl') || ''; }
function assetStatus(asset?: DataOpsAsset) { return pick<string>(asset, 'recognition_status', 'recognitionStatus') || pick<string>(asset, 'upload_status', 'uploadStatus') || pick<string>(asset, 'status', 'status') || 'pending'; }
function assetCreatedAt(asset?: DataOpsAsset) { return pick<string>(asset, 'created_at', 'createdAt') || pick<string>(asset, 'uploaded_at', 'uploadedAt') || '-'; }

function toPreviewUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const root = API_ROOT_URL.replace(/\/api\/?$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
}

function mergePackage(rows: DataOpsPackage[], detail: DataOpsPackage) {
  return rows.some(item => item.id === detail.id) ? rows.map(item => item.id === detail.id ? detail : item) : [detail, ...rows];
}

function humanStatus(status?: DataOpsTopicRecognitionStatus) {
  if (!status) return { label: '未上传', color: 'default' };
  return { label: status.label || status.status || '未上传', color: status.color || statusColor(status.status) };
}

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [assetDeleting, setAssetDeleting] = useState(false);
  const [metricLoading, setMetricLoading] = useState(false);
  const [topicMetrics, setTopicMetrics] = useState<DataOpsMetricRow[]>([]);
  const [topicMetricStatus, setTopicMetricStatus] = useState<DataOpsTopicRecognitionStatus>();
  const [coverUploadingIds, setCoverUploadingIds] = useState<Set<number>>(new Set());
  const [recognizingTopicIds, setRecognizingTopicIds] = useState<Set<number>>(new Set());
  const [generatingTopicIds, setGeneratingTopicIds] = useState<Set<number>>(new Set());
  const [screenshotUploadingContentIds, setScreenshotUploadingContentIds] = useState<Set<number>>(new Set());
  const [packages, setPackages] = useState<DataOpsPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DataOpsPackage>();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCode>('DOUYIN');
  const [selectedContentType, setSelectedContentType] = useState<DataOpsContentType>('IMAGE_TEXT');
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

  const setFlag = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, value: number, enabled: boolean) => {
    setter(prev => {
      const next = new Set(prev);
      if (enabled) next.add(value);
      else next.delete(value);
      return next;
    });
  };

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
    if (!id) return undefined;
    const detail = await dataOpsApi.packageDetail(id);
    setSelectedPackage(detail);
    setPackages(rows => mergePackage(rows, detail));
    return detail;
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

  const loadUserOptions = async () => {
    const [operators, media] = await Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA')]);
    setOperatorUsers(operators || []);
    setMediaUsers(media || []);
  };

  useEffect(() => { loadPackages().catch(() => undefined); loadUserOptions().catch(() => undefined); }, []);
  useEffect(() => { refreshTopicMetrics(selectedTopicId).catch(() => undefined); }, [selectedTopicId]);

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const assets = selectedPackage?.assets || [];
  const selectedPlatformTopics = useMemo(() => platformTopics.filter(topic => topicPlatform(topic) === selectedPlatform && topicContentType(topic) === selectedContentType), [platformTopics, selectedPlatform, selectedContentType]);
  const selectedTopic = useMemo(() => selectedPlatformTopics.find(topic => topic.id === selectedTopicId), [selectedPlatformTopics, selectedTopicId]);
  const selectedContents = useMemo(() => selectedTopicId ? contents.filter(content => contentTopicId(content) === selectedTopicId) : contents.filter(content => contentPlatform(content) === selectedPlatform && contentContentType(content) === selectedContentType), [contents, selectedPlatform, selectedContentType, selectedTopicId]);
  const selectedContent = selectedContents[0];
  const selectedTopicAssets = useMemo(() => selectedTopicId ? assets.filter(asset => Number(assetTopicId(asset)) === selectedTopicId) : [], [assets, selectedTopicId]);
  const coverAsset = useMemo(() => {
    const coverId = topicCoverAssetId(selectedTopic);
    return selectedTopicAssets.find(asset => coverId && Number(asset.id) === Number(coverId)) || selectedTopicAssets.find(asset => assetType(asset) === 'COVER');
  }, [selectedTopic, selectedTopicAssets]);
  const screenshotAssets = useMemo(() => selectedTopicAssets.filter(asset => assetType(asset) === 'DATA_SCREENSHOT'), [selectedTopicAssets]);
  const failedAssets = useMemo(() => selectedTopicAssets.filter(asset => ['failed', 'FAILED'].includes(assetStatus(asset))), [selectedTopicAssets]);

  useEffect(() => {
    if (!selectedPlatformTopics.length) { setSelectedTopicId(undefined); return; }
    if (!selectedTopicId || !selectedPlatformTopics.some(topic => topic.id === selectedTopicId)) setSelectedTopicId(selectedPlatformTopics[0].id);
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
        children: [
          { title: `抖音 (${(pkg.platformTopics || []).filter(topic => topicPlatform(topic) === 'DOUYIN').length})`, key: `platform-${pkg.id}-DOUYIN` },
          { title: `小红书 (${(pkg.platformTopics || []).filter(topic => topicPlatform(topic) === 'XIAOHONGSHU').length})`, key: `platform-${pkg.id}-XIAOHONGSHU` },
          { title: `视频号 (${(pkg.platformTopics || []).filter(topic => topicPlatform(topic) === 'WECHAT_CHANNEL').length})`, key: `platform-${pkg.id}-WECHAT_CHANNEL` }
        ]
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
    } finally { setPackageSubmitting(false); }
  };

  const createTopic = async () => {
    if (!selectedPackage?.id) return message.warning('请先选择主题包');
    setTopicSubmitting(true);
    try {
      const values = await topicForm.validateFields();
      const platformCode = values.platformCode as PlatformCode;
      const contentType = (values.contentType || selectedContentType) as DataOpsContentType;
      const created = await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode, contentType, subTopicName: values.subTopicName });
      message.success('平台子主题已创建');
      setTopicOpen(false);
      topicForm.resetFields();
      setSelectedPlatform(platformCode);
      setSelectedContentType(contentType);
      setSelectedTopicId(created.id);
      await refreshPackageDetail(selectedPackage.id);
    } finally { setTopicSubmitting(false); }
  };

  const openTopicModal = (platformCode: PlatformCode) => {
    topicForm.setFieldsValue({ platformCode, contentType: selectedContentType });
    setSelectedPlatform(platformCode);
    setTopicOpen(true);
  };

  const openConfirmContent = (topic: DataOpsPlatformTopic) => {
    const contentType = topicContentType(topic);
    setActiveTopic(topic);
    setSelectedTopicId(topic.id);
    setSelectedContentType(contentType);
    contentForm.setFieldsValue({ contentTitle: topicDisplayName(topic), contentType, contentDate: today });
    setContentOpen(true);
  };

  const confirmContent = async () => {
    if (!activeTopic?.id) return;
    setContentSubmitting(true);
    try {
      const values = await contentForm.validateFields();
      await dataOpsApi.confirmContent(activeTopic.id, { contentTitle: values.contentTitle, contentSummary: values.contentSummary, contentType: values.contentType || topicContentType(activeTopic), contentDate: values.contentDate || today });
      message.success('主题内容已确认创建');
      setContentOpen(false);
      contentForm.resetFields();
      setSelectedTopicId(activeTopic.id);
      await refreshPackageDetail();
    } finally { setContentSubmitting(false); }
  };

  const recognizeCover = async (topic: DataOpsPlatformTopic) => {
    const assetId = topicCoverAssetId(topic);
    if (!assetId) return message.warning('请先上传封面');
    setFlag(setRecognizingTopicIds, topic.id, true);
    try {
      await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(topic), scene: 'CONTENT_DETAIL' });
      message.success('封面识别成功');
      await refreshPackageDetail();
      await refreshTopicMetrics(topic.id);
    } finally { setFlag(setRecognizingTopicIds, topic.id, false); }
  };

  const uploadCover = async (topic: DataOpsPlatformTopic, file: File) => {
    setSelectedTopicId(topic.id);
    setFlag(setCoverUploadingIds, topic.id, true);
    try {
      const uploaded = await dataOpsApi.uploadCover(topic.id, file);
      message.success('封面上传成功，开始识别');
      await recognizeCover(uploaded || topic);
    } finally { setFlag(setCoverUploadingIds, topic.id, false); }
  };

  const uploadScreenshots = async (content: DataOpsContent | undefined, files: File[], group: DataOpsAssetGroup) => {
    if (!content?.id) return message.warning('请先确认主题内容，再上传数据截图');
    setFlag(setScreenshotUploadingContentIds, content.id, true);
    try {
      await dataOpsApi.uploadScreenshots(content.id, files.filter(Boolean), group);
      message.success('数据截图上传成功，后台会异步识别');
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopicId);
    } finally { setFlag(setScreenshotUploadingContentIds, content.id, false); }
  };

  const deleteAssetIds = async (assetIds: number[]) => {
    if (!assetIds.length) return;
    setAssetDeleting(true);
    try {
      if (assetIds.length === 1) await dataOpsApi.deleteAsset(assetIds[0]);
      else await dataOpsApi.batchDeleteAssets(assetIds);
      message.success(`已删除 ${assetIds.length} 张图片`);
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopicId);
    } finally { setAssetDeleting(false); }
  };

  const generateCurrentTopicData = async (topic: DataOpsPlatformTopic) => {
    setSelectedTopicId(topic.id);
    setFlag(setGeneratingTopicIds, topic.id, true);
    try {
      const result = await dataOpsApi.generateCurrentTopicData(topic.id);
      if (result.package) {
        setSelectedPackage(result.package);
        setPackages(rows => mergePackage(rows, result.package!));
      } else await refreshPackageDetail();
      await refreshTopicMetrics(topic.id);
      if (result.failed) message.warning('当前主题数据生成完成，但有失败项');
      else message.success('当前主题数据生成完成');
    } finally { setFlag(setGeneratingTopicIds, topic.id, false); }
  };

  const generateReport = async () => {
    setReportGenerating(true);
    try { await dataOpsApi.generateDailyReport({ date: today }); message.success('当日报告已生成'); await loadPackages(); }
    finally { setReportGenerating(false); }
  };

  const handleTreeSelect = (keys: React.Key[]) => {
    const key = String(keys?.[0] || '');
    if (!key) return;
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

  const renderCoverRecognitionFields = () => {
    if (!selectedTopic) return null;
    const platform = topicPlatform(selectedTopic) || selectedPlatform;
    return <Row gutter={[12, 12]}>
      <Col xs={24} md={8}><Card size='small'><Statistic title='账号名称' value={pick<string>(selectedTopic, 'ocr_account_name', 'ocrAccountName') || 'null'} /></Card></Col>
      <Col xs={24} md={8}><Card size='small'><Statistic title={platformIdLabelMap[platform] || '平台账号ID'} value={pick<string>(selectedTopic, 'ocr_platform_user_id', 'ocrPlatformUserId') || 'null'} /></Card></Col>
      <Col xs={24} md={8}><Card size='small'><Statistic title='作品标题' value={pick<string>(selectedTopic, 'ocr_content_title', 'ocrContentTitle') || pick<string>(selectedTopic, 'ocr_title', 'ocrTitle') || 'null'} /></Card></Col>
    </Row>;
  };

  const renderAssetCard = (asset: DataOpsAsset, label: string) => {
    const url = toPreviewUrl(assetUrl(asset));
    const status = assetStatus(asset);
    return <Col xs={24} sm={12} md={8} lg={6} key={`${label}-${asset.id}`}>
      <Card size='small' title={label} extra={<Space><Tag color={statusColor(status)}>{status}</Tag><Popconfirm title='永久删除这张图片？' okText='删除' cancelText='取消' okButtonProps={{ danger: true, loading: assetDeleting }} onConfirm={() => deleteAssetIds([Number(asset.id)])}><Button size='small' danger type='text' icon={<DeleteOutlined />} /></Popconfirm></Space>}>
        {url ? <Image src={url} alt={assetFileName(asset)} width='100%' height={120} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='无预览' />}
        <div style={{ marginTop: 8, fontWeight: 600, wordBreak: 'break-all' }}>{assetFileName(asset)}</div>
        <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>上传时间：{assetCreatedAt(asset)}</div>
      </Card>
    </Col>;
  };

  const renderAssetGroupPanel = (group: typeof douyinAssetGroups[number]) => {
    const groupedAssets = screenshotAssets.filter(asset => assetGroup(asset) === group.key);
    return <Card key={group.key} size='small' title={group.title} extra={<Tag color={groupedAssets.some(item => assetStatus(item) === 'failed') ? 'red' : 'blue'}>{groupedAssets.length} 张</Tag>}>
      <div style={{ marginBottom: 12, opacity: 0.65 }}>{group.desc}</div>
      <Upload multiple showUploadList={false} customRequest={async options => {
        try { await uploadScreenshots(selectedContent, [options.file as File], group.key); options.onSuccess?.({}, options.file as any); }
        catch (error) { options.onError?.(error as Error); }
      }}>
        <Button icon={<CloudUploadOutlined />} loading={selectedContent?.id ? screenshotUploadingContentIds.has(selectedContent.id) : false}>上传{group.title}图片</Button>
      </Upload>
      <div className='mt12'>{groupedAssets.length ? <Row gutter={[12,12]}>{groupedAssets.map(asset => renderAssetCard(asset, group.title))}</Row> : <Empty description={`还没有上传${group.title}图片`} />}</div>
    </Card>;
  };

  const metricStatus = humanStatus(topicMetricStatus);

  return <>
    <PageHeader title='运营数据' extra={<Space><Button type='primary' icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button><Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button></Space>} />
    <Row gutter={[16,16]}>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前平台子主题' value={selectedPlatformTopics.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前主题内容' value={selectedContents.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前上传图片' value={selectedTopicAssets.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前失败图片' value={failedAssets.length} /></Card></Col>
    </Row>
    <Row gutter={[16,16]} className='mt12'>
      <Col xs={24} lg={5}><Card title='主题路径' bodyStyle={{ maxHeight: 520, overflow: 'auto', paddingRight: 8 }}><Tree showIcon defaultExpandAll selectedKeys={selectedPackage ? [`platform-${selectedPackage.id}-${selectedPlatform}`] : []} treeData={treeData} onSelect={handleTreeSelect} /></Card></Col>
      <Col xs={24} lg={19}>
        <Card loading={loading} title={selectedPackage ? `${packageTitle(selectedPackage)} / ${platformLabelMap[selectedPlatform] || selectedPlatform}` : '主题包工作区'} extra={<Space><Tag color='blue'>{platformLabelMap[selectedPlatform] || selectedPlatform}</Tag><Button icon={<PlusOutlined />} onClick={() => openTopicModal(selectedPlatform)}>创建{platformLabelMap[selectedPlatform] || ''}子主题</Button></Space>}>
          {selectedPackage ? <>
            <Row gutter={[16,16]}>
              <Col xs={24} md={8}><Card hoverable title='抖音' extra={selectedPlatform === 'DOUYIN' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} onClick={() => openTopicModal('DOUYIN')}>创建抖音子主题</Button></Card></Col>
              <Col xs={24} md={8}><Card hoverable title='小红书' extra={selectedPlatform === 'XIAOHONGSHU' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} onClick={() => openTopicModal('XIAOHONGSHU')}>创建小红书子主题</Button></Card></Col>
              <Col xs={24} md={8}><Card hoverable title='视频号' extra={selectedPlatform === 'WECHAT_CHANNEL' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} onClick={() => openTopicModal('WECHAT_CHANNEL')}>创建视频号子主题</Button></Card></Col>
            </Row>
            <Tabs className='mt12' activeKey={selectedContentType} onChange={key => { setSelectedContentType(key as DataOpsContentType); setSelectedTopicId(undefined); }} items={contentTypeOptions.map(item => ({ key: item.value, label: item.label }))} />
            <Table rowKey='id' pagination={{ pageSize: 5, showSizeChanger: false }} dataSource={selectedPlatformTopics as any[]} onRow={record => ({ onClick: () => setSelectedTopicId(record.id) })} rowClassName={record => record.id === selectedTopicId ? 'ant-table-row-selected' : ''} columns={[
              { title: '平台', width: 90, render: (_: any, r: any) => platformLabelMap[pick(r, 'platform_code', 'platformCode')] || pick(r, 'platform_code', 'platformCode') },
              { title: '类型', width: 90, render: (_: any, r: any) => <Tag color='purple'>{contentTypeLabelMap[topicContentType(r)]}</Tag> },
              { title: '子主题', render: (_: any, r: any) => pick(r, 'sub_topic_name', 'subTopicName') },
              { title: '账号名称', render: (_: any, r: any) => pick(r, 'ocr_account_name', 'ocrAccountName') || 'null' },
              { title: platformIdLabelMap[selectedPlatform] || '平台账号ID', render: (_: any, r: any) => pick(r, 'ocr_platform_user_id', 'ocrPlatformUserId') || 'null' },
              { title: '作品标题', render: (_: any, r: any) => pick(r, 'ocr_content_title', 'ocrContentTitle') || pick(r, 'ocr_title', 'ocrTitle') || 'null' },
              { title: '数据状态', width: 120, render: (_: any, r: any) => r.id === selectedTopicId ? <Tag color={metricStatus.color}>{metricStatus.label}</Tag> : <Tag>{pick(r, 'ocr_status', 'ocrStatus') || 'pending'}</Tag> },
              { title: '操作', width: 430, render: (_: any, r: DataOpsPlatformTopic) => <Space wrap onClick={event => event.stopPropagation()}>
                <Upload showUploadList={false} beforeUpload={file => { uploadCover(r, file); return false; }}><Button loading={coverUploadingIds.has(r.id)} icon={<CloudUploadOutlined />}>上传/替换封面并识别</Button></Upload>
                <Button icon={<ScanOutlined />} loading={recognizingTopicIds.has(r.id)} disabled={!topicCoverAssetId(r)} onClick={() => recognizeCover(r)}>识别封面</Button>
                <Button loading={generatingTopicIds.has(r.id)} onClick={() => generateCurrentTopicData(r)}>生成当前主题数据</Button>
                <Button type='link' onClick={() => openConfirmContent(r)}>确认主题内容</Button>
              </Space> }
            ]} />
            <Card type='inner' title={selectedTopic ? `当前主题：${topicDisplayName(selectedTopic) || pick(selectedTopic, 'sub_topic_name', 'subTopicName')}` : '当前主题'} className='mt12' extra={selectedTopic ? <Space><Tag color={metricStatus.color}>{metricStatus.label}</Tag><Button onClick={() => refreshTopicMetrics(selectedTopic.id)} loading={metricLoading}>刷新识别表</Button></Space> : null}>
              {selectedTopic ? renderCoverRecognitionFields() : <Empty description='请选择一个子主题' />}
            </Card>
            <Card type='inner' title='识别结果数据表' className='mt12' extra={topicMetricStatus ? <Space><Tag color={metricStatus.color}>{metricStatus.label}</Tag><span>成功 {topicMetricStatus.success || 0}/{topicMetricStatus.total || 0}</span><span>缺失 {topicMetricStatus.missing || 0}</span></Space> : null}>
              {selectedTopic ? <Table<DataOpsMetricRow> loading={metricLoading} rowKey='id' size='small' pagination={false} dataSource={topicMetrics} columns={[
                { title: '图片类型', width: 120, render: (_, r) => metricGroupLabelMap[r.metricGroup] || r.metricGroup },
                { title: '数据标签', dataIndex: 'metricLabel', width: 160 },
                { title: '识别值', width: 180, render: (_, r) => r.metricValue ?? 'null' },
                { title: '单位', width: 80, render: (_, r) => r.metricUnit || '-' },
                { title: '状态', width: 100, render: (_, r) => <Tag color={statusColor(r.recognitionStatus)}>{r.recognitionStatus || 'PENDING'}</Tag> },
                { title: '来源图片', width: 100, render: (_, r) => r.assetId ? `#${r.assetId}` : '-' },
                { title: '识别时间', width: 180, render: (_, r) => r.recognizedAt || '-' },
                { title: '失败原因', render: (_, r) => r.failReason || '-' }
              ]} /> : <Empty description='请选择一个子主题查看识别数据表' />}
            </Card>
            <Card type='inner' title='图片预览与识别状态' className='mt12'>
              {selectedTopic ? <Row gutter={[16,16]}>
                <Col xs={24} lg={8}><Card size='small' title='封面图' extra={coverAsset ? <Tag color={statusColor(assetStatus(coverAsset))}>{assetStatus(coverAsset)}</Tag> : <Tag>未上传</Tag>}>{coverAsset ? <Row>{renderAssetCard(coverAsset, '当前封面')}</Row> : <Empty description='当前子主题还没有上传封面' />}</Card></Col>
                <Col xs={24} lg={16}><Card size='small' title='数据图片区'>{selectedPlatform === 'DOUYIN' ? <Space direction='vertical' size={16} style={{ width: '100%' }}>{douyinAssetGroups.map(renderAssetGroupPanel)}</Space> : <Empty description='该平台图片分组稍后实现' />}</Card></Col>
              </Row> : <Empty description='请选择一个子主题查看图片预览' />}
            </Card>
          </> : <Empty description='请先创建今日主题包' />}
        </Card>
      </Col>
    </Row>

    <Modal title='创建主题包' open={packageOpen} onOk={createPackage} onCancel={() => setPackageOpen(false)} confirmLoading={packageSubmitting} destroyOnClose>
      <Form form={packageForm} layout='vertical' initialValues={{ topicDate: today }}>
        <Form.Item name='topicDate' label='创建日期' rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name='operatorUserIds' label='选择运营人员' rules={[{ required: true, message: '请选择运营人员' }]}><Select mode='multiple' options={toUserSelectOptions(operatorUsers)} /></Form.Item>
        <Form.Item name='mediaUserIds' label='选择媒体人员' rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode='multiple' options={toUserSelectOptions(mediaUsers)} /></Form.Item>
      </Form>
    </Modal>
    <Modal title='创建平台子主题' open={topicOpen} onOk={createTopic} onCancel={() => setTopicOpen(false)} confirmLoading={topicSubmitting} destroyOnClose>
      <Form form={topicForm} layout='vertical' initialValues={{ contentType: selectedContentType }}>
        <Form.Item name='platformCode' label='平台' rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item>
        <Form.Item name='contentType' label='内容类型' rules={[{ required: true }]}><Select options={contentTypeOptions} /></Form.Item>
        <Form.Item name='subTopicName' label='子主题名称'><Input placeholder='例如：澳洲留学预算数据' /></Form.Item>
      </Form>
    </Modal>
    <Modal title='确认创建主题内容' open={contentOpen} onOk={confirmContent} onCancel={() => setContentOpen(false)} confirmLoading={contentSubmitting} destroyOnClose>
      <Form form={contentForm} layout='vertical' initialValues={{ contentDate: today, contentType: selectedContentType }}>
        <Form.Item name='contentTitle' label='主题内容标题' rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name='contentType' label='内容类型' rules={[{ required: true }]}><Select options={contentTypeOptions} /></Form.Item>
        <Form.Item name='contentSummary' label='内容说明'><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name='contentDate' label='内容日期'><Input /></Form.Item>
      </Form>
    </Modal>
  </>;
}
