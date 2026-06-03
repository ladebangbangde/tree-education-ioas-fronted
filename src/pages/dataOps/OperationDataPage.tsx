import { Button, Card, Col, Empty, Form, Image, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Tree, Upload, message } from 'antd';
import { CalendarOutlined, CloudUploadOutlined, FolderOpenOutlined, PlusOutlined, ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import { dataOpsApi, type DataOpsAsset, type DataOpsContent, type DataOpsPackage, type DataOpsPlatformTopic, type DataOpsUserOption, type PlatformCode } from '@/api/dataOps';
import { API_ROOT_URL } from '@/api/client';

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
  if (status === 'processing') return 'blue';
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

function assetTopicId(asset?: DataOpsAsset) {
  return pick<number>(asset, 'platform_topic_id', 'platformTopicId');
}

function assetType(asset?: DataOpsAsset) {
  return pick<string>(asset, 'asset_type', 'assetType');
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

function assetError(asset?: DataOpsAsset) {
  return pick<string>(asset, 'error_message', 'errorMessage') || pick<string>(asset, 'fail_reason', 'failReason') || '';
}

function assetCreatedAt(asset?: DataOpsAsset) {
  return pick<string>(asset, 'created_at', 'createdAt') || pick<string>(asset, 'uploaded_at', 'uploadedAt') || '-';
}

function toPreviewUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const root = API_ROOT_URL.replace(/\/api\/?$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
}

function setFlag<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T, enabled: boolean) {
  setter(prev => {
    const next = new Set(prev);
    if (enabled) next.add(value);
    else next.delete(value);
    return next;
  });
}

function mergePackage(rows: DataOpsPackage[], detail: DataOpsPackage) {
  return rows.some(item => item.id === detail.id) ? rows.map(item => item.id === detail.id ? detail : item) : [detail, ...rows];
}

function parseJson(value: any): any {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function resultOf(payload: any) {
  const parsed = parseJson(payload);
  if (!parsed) return undefined;
  return parsed.result || parsed.data?.result || parsed.rawPayload?.result || parsed;
}

function firstText(source: any, keys: string[]) {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  const metrics = source.metrics;
  if (metrics && typeof metrics === 'object') {
    for (const key of keys) {
      const value = metrics[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
  }
  return undefined;
}

function buildRecognitionInfo(result: any, fallback?: string) {
  const contentTitle = firstText(result, ['contentTitle', 'topicName', 'title', 'name', 'ocrTitle']);
  const accountName = firstText(result, ['accountName', 'authorName', 'nickname']);
  const accountId = firstText(result, ['douyinId', 'accountId', 'wechatChannelId', 'videoAccountId']);
  if (contentTitle) {
    return {
      primary: contentTitle,
      secondary: accountName || accountId ? [accountName, accountId].filter(Boolean).join(' / ') : undefined
    };
  }
  if (accountName || accountId) {
    return {
      primary: [accountName, accountId].filter(Boolean).join(' / '),
      secondary: '账号页识别结果'
    };
  }
  return {
    primary: fallback || '-',
    secondary: undefined
  };
}

function topicRecognitionInfo(topic: any) {
  const payload = pick<string>(topic, 'ocr_payload_json', 'ocrPayloadJson');
  const fallback = pick<string>(topic, 'ocr_title', 'ocrTitle') || pick<string>(topic, 'sub_topic_name', 'subTopicName');
  return buildRecognitionInfo(resultOf(payload), fallback);
}

function assetRecognitionInfo(asset: any) {
  const payload = pick<string>(asset, 'ocr_payload_json', 'ocrPayloadJson') || pick<string>(asset, 'data_payload_json', 'dataPayloadJson') || pick<string>(asset, 'parsed_result_json', 'parsedResultJson');
  return buildRecognitionInfo(resultOf(payload));
}

function renderRecognitionResult(topic: any) {
  const info = topicRecognitionInfo(topic);
  return <div>
    <div style={{ fontWeight: 600 }}>{info.primary}</div>
    {info.secondary ? <div style={{ marginTop: 4, opacity: 0.65, fontSize: 12 }}>{info.secondary}</div> : null}
  </div>;
}

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [contentSubmitting, setContentSubmitting] = useState(false);
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
      const hydrated = await Promise.all((rows || []).map(async row => {
        try {
          return await dataOpsApi.packageDetail(row.id);
        } catch {
          return row;
        }
      }));
      setPackages(hydrated);
      if (selectedPackage?.id) {
        const next = hydrated.find(item => item.id === selectedPackage.id);
        setSelectedPackage(next || hydrated[0]);
      } else {
        setSelectedPackage(hydrated[0]);
      }
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
  const assets = selectedPackage?.assets || [];
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
  const selectedTopicAssets = useMemo(
    () => selectedTopicId ? assets.filter(asset => Number(assetTopicId(asset)) === selectedTopicId) : [],
    [assets, selectedTopicId]
  );
  const coverAsset = useMemo(() => {
    const coverId = topicCoverAssetId(selectedTopic);
    return selectedTopicAssets.find(asset => coverId && Number(asset.id) === Number(coverId)) || selectedTopicAssets.find(asset => assetType(asset) === 'COVER');
  }, [selectedTopic, selectedTopicAssets]);
  const screenshotAssets = useMemo(
    () => selectedTopicAssets.filter(asset => assetType(asset) === 'DATA_SCREENSHOT'),
    [selectedTopicAssets]
  );
  const failedAssets = useMemo(
    () => selectedTopicAssets.filter(asset => assetStatus(asset) === 'failed' || Boolean(assetError(asset))),
    [selectedTopicAssets]
  );

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
  const failedCount = failedAssets.length;
  const uploadedImageCount = selectedTopicAssets.length;

  const createPackage = async () => {
    if (packageSubmitting) return;
    setPackageSubmitting(true);
    try {
      const values = await packageForm.validateFields();
      const created = await dataOpsApi.createPackage({
        topicDate: values.topicDate || today,
        operatorUserIds: values.operatorUserIds.map(Number),
        mediaUserIds: values.mediaUserIds.map(Number)
      });
      message.success('主题包已创建');
      setPackageOpen(false);
      packageForm.resetFields();
      setSelectedPackage(created);
      setSelectedPlatform('DOUYIN');
      setSelectedTopicId(undefined);
      setPackages(rows => mergePackage(rows, created));
      refreshPackageDetail(created.id).catch(() => undefined);
    } finally {
      setPackageSubmitting(false);
    }
  };

  const createTopic = async () => {
    if (topicSubmitting) return;
    if (!selectedPackage?.id) return message.warning('请先选择主题包');
    setTopicSubmitting(true);
    try {
      const values = await topicForm.validateFields();
      const platformCode = values.platformCode as PlatformCode;
      const created = await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode, subTopicName: values.subTopicName });
      const nextPackage: DataOpsPackage = {
        ...selectedPackage,
        platformTopics: [created, ...(selectedPackage.platformTopics || []).filter(topic => topic.id !== created.id)]
      };
      message.success('平台子主题已创建');
      setTopicOpen(false);
      topicForm.resetFields();
      setSelectedPlatform(platformCode);
      setSelectedTopicId(created.id);
      setSelectedPackage(nextPackage);
      setPackages(rows => mergePackage(rows, nextPackage));
      const detail = await refreshPackageDetail(selectedPackage.id);
      const latestTopic = detail?.platformTopics?.find(topic => topic.id === created.id);
      if (latestTopic) setSelectedTopicId(latestTopic.id);
    } finally {
      setTopicSubmitting(false);
    }
  };

  const openTopicModal = (platformCode: PlatformCode) => {
    if (topicSubmitting) return;
    topicForm.setFieldValue('platformCode', platformCode);
    setSelectedPlatform(platformCode);
    setTopicOpen(true);
  };

  const openConfirmContent = (topic: DataOpsPlatformTopic) => {
    if (contentSubmitting) return;
    setActiveTopic(topic);
    setSelectedTopicId(topic.id);
    contentForm.setFieldsValue({
      contentTitle: topicDisplayName(topic),
      contentDate: today
    });
    setContentOpen(true);
  };

  const confirmContent = async () => {
    if (contentSubmitting) return;
    if (!activeTopic?.id) return;
    setContentSubmitting(true);
    try {
      const values = await contentForm.validateFields();
      await dataOpsApi.confirmContent(activeTopic.id, { contentTitle: values.contentTitle, contentSummary: values.contentSummary, contentDate: values.contentDate || today });
      message.success('主题内容已确认创建');
      setContentOpen(false);
      contentForm.resetFields();
      setSelectedTopicId(activeTopic.id);
      await refreshPackageDetail();
    } finally {
      setContentSubmitting(false);
    }
  };

  const recognizeCover = async (topic: DataOpsPlatformTopic) => {
    const assetId = topicCoverAssetId(topic);
    if (!assetId) return message.warning('请先上传封面');
    const platform = topicPlatform(topic);
    setFlag(setRecognizingTopicIds, topic.id, true);
    try {
      const result = await dataOpsApi.recognizeAsset(assetId, { platform, scene: 'CONTENT_DETAIL' });
      const info = buildRecognitionInfo(result?.result);
      message.success(info.primary && info.primary !== '-' ? `封面识别成功：${info.primary}` : '封面识别成功');
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
        setPackages(rows => mergePackage(rows, result.package!));
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

  const renderAssetCard = (asset: DataOpsAsset, label: string, wrap = true) => {
    const url = toPreviewUrl(assetUrl(asset));
    const status = assetStatus(asset);
    const info = assetRecognitionInfo(asset);
    const card = <Card size='small' title={label} extra={<Tag color={statusColor(status)}>{status}</Tag>}>
      {url ? <Image src={url} alt={assetFileName(asset)} width='100%' height={120} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='无预览' />}
      <div style={{ marginTop: 8, fontWeight: 600, wordBreak: 'break-all' }}>{assetFileName(asset)}</div>
      {info.primary && info.primary !== '-' ? <div style={{ marginTop: 6, color: '#1677ff', fontSize: 12, wordBreak: 'break-all' }}>识别结果：{info.primary}</div> : null}
      {info.secondary ? <div style={{ marginTop: 2, opacity: 0.65, fontSize: 12, wordBreak: 'break-all' }}>{info.secondary}</div> : null}
      <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>上传时间：{assetCreatedAt(asset)}</div>
      {assetError(asset) ? <div style={{ marginTop: 6, color: '#ff4d4f', fontSize: 12, wordBreak: 'break-all' }}>失败原因：{assetError(asset)}</div> : null}
    </Card>;
    return wrap ? <Col xs={24} sm={12} md={8} lg={6} key={`${label}-${asset.id}`}>{card}</Col> : card;
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
      setSelectedTopicId(undefined);
      return;
    }
    if (key.startsWith('package-')) {
      const id = Number(key.replace('package-', ''));
      const pkg = packages.find(item => item.id === id);
      if (pkg) setSelectedPackage(pkg);
      setSelectedTopicId(undefined);
    }
  };

  return (
    <>
      <PageHeader title='运营数据' extra={<Space><Button type='primary' icon={<PlusOutlined />} onClick={() => setPackageOpen(true)} disabled={packageSubmitting}>创建主题包</Button><Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button></Space>} />
      <Row gutter={[16,16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前平台子主题' value={selectedPlatformTopics.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前主题内容' value={selectedContents.length} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前上传图片' value={uploadedImageCount} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='当前失败图片' value={failedCount} /></Card></Col>
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
            extra={<Space><Tag color='blue'>{platformLabelMap[selectedPlatform] || selectedPlatform}</Tag><Button icon={<PlusOutlined />} disabled={topicSubmitting} onClick={() => openTopicModal(selectedPlatform)}>创建{platformLabelMap[selectedPlatform] || ''}子主题</Button></Space>}
          >
            {selectedPackage ? <>
              <Row gutter={[16,16]}>
                <Col xs={24} md={12}><Card hoverable title='抖音' extra={selectedPlatform === 'DOUYIN' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} disabled={topicSubmitting} onClick={() => openTopicModal('DOUYIN')}>创建抖音子主题</Button></Card></Col>
                <Col xs={24} md={12}><Card hoverable title='小红书' extra={selectedPlatform === 'XIAOHONGSHU' ? <Tag color='blue'>当前</Tag> : null}><Button icon={<PlusOutlined />} disabled={topicSubmitting} onClick={() => openTopicModal('XIAOHONGSHU')}>创建小红书子主题</Button></Card></Col>
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
                  { title: '识别结果', render: (_: any, r: any) => renderRecognitionResult(r) },
                  { title: '封面', width: 90, render: (_: any, r: any) => pick(r, 'cover_image_url', 'coverImageUrl') ? <Tag color='green'>已上传</Tag> : <Tag>未上传</Tag> },
                  { title: '识别状态', width: 120, render: (_: any, r: any) => { const v = pick<string>(r, 'ocr_status', 'ocrStatus') || 'pending'; return <Tag color={statusColor(v)}>{v}</Tag>; } },
                  { title: '操作', width: 500, render: (_: any, r: DataOpsPlatformTopic) => {
                    const coverBusy = coverUploadingIds.has(r.id) || recognizingTopicIds.has(r.id);
                    const generating = generatingTopicIds.has(r.id);
                    return <Space wrap onClick={event => event.stopPropagation()}>
                      <Upload showUploadList={false} beforeUpload={file => { uploadCover(r, file); return false; }}>
                        <Button loading={coverBusy} icon={<CloudUploadOutlined />}>上传/替换封面并识别</Button>
                      </Upload>
                      <Button icon={<ScanOutlined />} loading={recognizingTopicIds.has(r.id)} disabled={!topicCoverAssetId(r)} onClick={() => recognizeCover(r)}>识别封面</Button>
                      <Button loading={generating} disabled={!topicCoverAssetId(r)} onClick={() => generateCurrentTopicData(r)}>生成当前主题数据</Button>
                      <Button type='link' disabled={contentSubmitting} onClick={() => openConfirmContent(r)}>确认主题内容</Button>
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
              <Card type='inner' title='图片预览与识别状态' className='mt12'>
                {selectedTopic ? <>
                  <Row gutter={[16,16]}>
                    <Col xs={24} lg={8}>
                      <Card size='small' title='封面图' extra={coverAsset ? <Tag color={statusColor(assetStatus(coverAsset))}>{assetStatus(coverAsset)}</Tag> : <Tag>未上传</Tag>}>
                        {coverAsset ? renderAssetCard(coverAsset, '当前封面', false) : <Empty description='当前子主题还没有上传封面' />}
                      </Card>
                    </Col>
                    <Col xs={24} lg={16}>
                      <Card size='small' title={`数据截图（${screenshotAssets.length} 张）`} extra={<Tag color={failedAssets.length ? 'red' : 'green'}>失败 {failedAssets.length}</Tag>}>
                        {screenshotAssets.length ? <Row gutter={[12,12]}>{screenshotAssets.map(asset => renderAssetCard(asset, '数据截图'))}</Row> : <Empty description='当前子主题还没有上传数据截图' />}
                      </Card>
                    </Col>
                  </Row>
                  {failedAssets.length ? <Card size='small' title={`失败图片（${failedAssets.length} 张）`} className='mt12'>
                    <Row gutter={[12,12]}>{failedAssets.map(asset => renderAssetCard(asset, assetType(asset) === 'COVER' ? '失败封面' : '失败截图'))}</Row>
                  </Card> : null}
                </> : <Empty description='请选择一个子主题查看图片预览' />}
              </Card>
            </> : <Empty description='请先创建今日主题包' />}
          </Card>
        </Col>
      </Row>

      <Modal title='创建主题包' open={packageOpen} onOk={createPackage} onCancel={() => setPackageOpen(false)} confirmLoading={packageSubmitting} okButtonProps={{ disabled: packageSubmitting }} cancelButtonProps={{ disabled: packageSubmitting }} destroyOnClose>
        <Form form={packageForm} layout='vertical' initialValues={{ topicDate: today }}>
          <Form.Item name='topicDate' label='创建日期' rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name='operatorUserIds' label='选择运营人员' rules={[{ required: true, message: '请选择运营人员' }]}><Select mode='multiple' placeholder='请选择运营人员' options={toUserSelectOptions(operatorUsers)} /></Form.Item>
          <Form.Item name='mediaUserIds' label='选择媒体人员' rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode='multiple' placeholder='请选择媒体人员' options={toUserSelectOptions(mediaUsers)} /></Form.Item>
        </Form>
      </Modal>
      <Modal title='创建平台子主题' open={topicOpen} onOk={createTopic} onCancel={() => setTopicOpen(false)} confirmLoading={topicSubmitting} okButtonProps={{ disabled: topicSubmitting }} cancelButtonProps={{ disabled: topicSubmitting }} destroyOnClose>
        <Form form={topicForm} layout='vertical'>
          <Form.Item name='platformCode' label='平台' rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item>
          <Form.Item name='subTopicName' label='子主题名称'><Input placeholder='例如：澳洲留学预算数据' /></Form.Item>
        </Form>
      </Modal>
      <Modal title='确认创建主题内容' open={contentOpen} onOk={confirmContent} onCancel={() => setContentOpen(false)} confirmLoading={contentSubmitting} okButtonProps={{ disabled: contentSubmitting }} cancelButtonProps={{ disabled: contentSubmitting }} destroyOnClose>
        <Form form={contentForm} layout='vertical' initialValues={{ contentDate: today }}>
          <Form.Item name='contentTitle' label='主题内容标题' rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name='contentSummary' label='内容说明'><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name='contentDate' label='内容日期'><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
