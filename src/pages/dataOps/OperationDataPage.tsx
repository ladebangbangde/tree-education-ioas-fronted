import { Button, Card, Col, Empty, Form, Image, Input, Modal, Popconfirm, Row, Select, Space, Statistic, Table, Tabs, Tag, Tree, Upload, message } from 'antd';
import { CalendarOutlined, CloudUploadOutlined, DeleteOutlined, FolderOpenOutlined, PlusOutlined, ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState, type Key } from 'react';
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
import { dataRecognitionApi } from '@/api/dataRecognition';
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

function pick<T = any>(row: any, a: string, b: string): T { return row?.[a] ?? row?.[b]; }
function packageDate(pkg?: DataOpsPackage) { return pick<string>(pkg, 'topic_date', 'topicDate') || dayjs().format('YYYY-MM-DD'); }
function packageTitle(pkg?: DataOpsPackage) { return pick<string>(pkg, 'display_name', 'displayName') || pick<string>(pkg, 'folder_name', 'folderName') || '数据主题包'; }
function topicPlatform(topic?: DataOpsPlatformTopic): PlatformCode | undefined { return pick<PlatformCode>(topic, 'platform_code', 'platformCode'); }
function topicName(topic?: DataOpsPlatformTopic) { return pick<string>(topic, 'sub_topic_name', 'subTopicName') || pick<string>(topic, 'ocr_title', 'ocrTitle') || ''; }
function topicCoverAssetId(topic?: DataOpsPlatformTopic) { return pick<number>(topic, 'cover_asset_id', 'coverAssetId') || topic?.asset?.id; }
function topicAccountName(topic?: DataOpsPlatformTopic) { return pick<string>(topic, 'ocr_account_name', 'ocrAccountName') || ''; }
function topicPlatformUserId(topic?: DataOpsPlatformTopic) { return pick<string>(topic, 'ocr_platform_user_id', 'ocrPlatformUserId') || ''; }
function topicAccountConfirmed(topic?: DataOpsPlatformTopic) { return Number(pick<any>(topic, 'account_confirmed_flag', 'accountConfirmedFlag') || 0) === 1 || Boolean(pick<any>(topic, 'accountConfirmed', 'accountConfirmed')); }
function contentTopicId(content?: DataOpsContent) { return pick<number>(content, 'platform_topic_id', 'platformTopicId'); }
function contentContentType(content?: DataOpsContent): DataOpsContentType { return pick<DataOpsContentType>(content, 'content_type', 'contentType') || 'IMAGE_TEXT'; }
function contentTitle(content?: DataOpsContent) { return pick<string>(content, 'content_title', 'contentTitle') || ''; }
function assetTopicId(asset?: DataOpsAsset) { return pick<number>(asset, 'platform_topic_id', 'platformTopicId'); }
function assetType(asset?: DataOpsAsset) { return pick<string>(asset, 'asset_type', 'assetType'); }
function assetGroup(asset?: DataOpsAsset): DataOpsAssetGroup { return pick<DataOpsAssetGroup>(asset, 'asset_group', 'assetGroup') || 'DOUYIN_OVERVIEW'; }
function assetFileName(asset?: DataOpsAsset) { return pick<string>(asset, 'original_filename', 'originalFilename') || pick<string>(asset, 'file_name', 'fileName') || `图片 ${asset?.id || ''}`; }
function assetUrl(asset?: DataOpsAsset) { return pick<string>(asset, 'public_url', 'publicUrl') || pick<string>(asset, 'url', 'url') || pick<string>(asset, 'thumbnail_url', 'thumbnailUrl') || ''; }
function assetStatus(asset?: DataOpsAsset) { return pick<string>(asset, 'recognition_status', 'recognitionStatus') || pick<string>(asset, 'upload_status', 'uploadStatus') || pick<string>(asset, 'status', 'status') || 'pending'; }
function toPreviewUrl(url?: string) { if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; const root = API_ROOT_URL.replace(/\/api\/?$/, ''); return `${root}${url.startsWith('/') ? '' : '/'}${url}`; }
function statusColor(status?: string) { const value = String(status || '').toUpperCase(); if (['SUCCESS', 'DATA_SUCCESS', 'COVER_SUCCESS'].includes(value) || status === 'recognized') return 'green'; if (['FAILED', 'DATA_FAILED', 'COVER_FAILED'].includes(value) || status === 'failed') return 'red'; if (['PROCESSING', 'DATA_PROCESSING'].includes(value) || status === 'processing') return 'blue'; if (['DATA_PARTIAL', 'PARTIAL'].includes(value)) return 'orange'; if (['PENDING', 'DATA_PENDING'].includes(value) || status === 'pending') return 'gold'; return 'default'; }
function metricStatusView(status?: DataOpsTopicRecognitionStatus) { return { label: status?.label || '未上传', color: status?.color || statusColor(status?.status) }; }
function mergePackage(rows: DataOpsPackage[], detail: DataOpsPackage) { return rows.some(item => item.id === detail.id) ? rows.map(item => item.id === detail.id ? detail : item) : [detail, ...rows]; }
function userOptions(rows: DataOpsUserOption[]) { return rows.map(row => ({ value: row.id, label: `${pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}` })); }
function normalizeDetectedContentType(value?: string | null): DataOpsContentType | undefined { return value === 'IMAGE_TEXT' || value === 'VIDEO' ? value : undefined; }

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [metricLoading, setMetricLoading] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [accountConfirming, setAccountConfirming] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [uploadingAccount, setUploadingAccount] = useState(false);
  const [uploadingContentPage, setUploadingContentPage] = useState(false);
  const [uploadingData, setUploadingData] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<number>();
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
  const [accountForm] = Form.useForm();

  const loadPackages = async () => { setLoading(true); try { const rows = await dataOpsApi.packages({ date: today }); const hydrated = await Promise.all((rows || []).map(async row => { try { return await dataOpsApi.packageDetail(row.id); } catch { return row; } })); setPackages(hydrated); setSelectedPackage(current => current?.id ? hydrated.find(item => item.id === current.id) || hydrated[0] : hydrated[0]); } finally { setLoading(false); } };
  const refreshPackageDetail = async (packageId?: number) => { const id = packageId || selectedPackage?.id; if (!id) return; const detail = await dataOpsApi.packageDetail(id); setSelectedPackage(detail); setPackages(rows => mergePackage(rows, detail)); };
  const refreshTopicMetrics = async (topicId?: number) => { if (!topicId) { setTopicMetrics([]); setTopicMetricStatus(undefined); return; } setMetricLoading(true); try { const result = await dataOpsApi.topicMetrics(topicId); setTopicMetrics(result.rows || []); setTopicMetricStatus(result.status); } finally { setMetricLoading(false); } };

  useEffect(() => { loadPackages().catch(() => undefined); Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA')]).then(([o, m]) => { setOperatorUsers(o || []); setMediaUsers(m || []); }).catch(() => undefined); }, []);
  useEffect(() => { refreshTopicMetrics(selectedTopicId).catch(() => undefined); }, [selectedTopicId]);

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const assets = selectedPackage?.assets || [];
  const selectedPlatformTopics = useMemo(() => platformTopics.filter(topic => topicPlatform(topic) === selectedPlatform), [platformTopics, selectedPlatform]);
  const selectedTopic = useMemo(() => selectedPlatformTopics.find(topic => topic.id === selectedTopicId), [selectedPlatformTopics, selectedTopicId]);
  const accountConfirmed = topicAccountConfirmed(selectedTopic);
  const selectedContents = useMemo(() => selectedTopicId ? contents.filter(content => contentTopicId(content) === selectedTopicId && contentContentType(content) === selectedContentType) : [], [contents, selectedContentType, selectedTopicId]);
  const selectedContent = selectedContents[0];
  const selectedTopicAssets = useMemo(() => selectedTopicId ? assets.filter(asset => Number(assetTopicId(asset)) === selectedTopicId) : [], [assets, selectedTopicId]);
  const accountProfileAsset = selectedTopicAssets.find(asset => assetType(asset) === 'COVER');
  const dataAssets = selectedTopicAssets.filter(asset => assetType(asset) === 'DATA_SCREENSHOT');
  const selectedStatus = metricStatusView(topicMetricStatus);

  useEffect(() => { if (!selectedPlatformTopics.length) { setSelectedTopicId(undefined); return; } if (!selectedTopicId || !selectedPlatformTopics.some(topic => topic.id === selectedTopicId)) setSelectedTopicId(selectedPlatformTopics[0].id); }, [selectedPlatformTopics, selectedTopicId]);
  useEffect(() => { accountForm.setFieldsValue({ accountName: topicAccountName(selectedTopic), platformUserId: topicPlatformUserId(selectedTopic) }); }, [selectedTopicId, selectedTopic, accountForm]);

  const treeData = useMemo(() => { if (!packages.length) return [{ title: today, key: `date-${today}`, icon: <CalendarOutlined />, children: [] }]; const groups = new Map<string, DataOpsPackage[]>(); packages.forEach(pkg => groups.set(packageDate(pkg), [...(groups.get(packageDate(pkg)) || []), pkg])); return Array.from(groups.entries()).map(([date, datePackages]) => ({ title: `${date}（${datePackages.length} 个主题包）`, key: `date-${date}`, icon: <CalendarOutlined />, children: datePackages.map(pkg => ({ title: packageTitle(pkg), key: `package-${pkg.id}`, icon: <FolderOpenOutlined />, children: platformOptions.map(platform => ({ title: `${platform.label} (${(pkg.platformTopics || []).filter(topic => topicPlatform(topic) === platform.value).length})`, key: `platform-${pkg.id}-${platform.value}` })) })) })); }, [packages, today]);

  const createPackage = async () => { setPackageSubmitting(true); try { const v = await packageForm.validateFields(); const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number) }); message.success('主题包已创建'); setPackageOpen(false); packageForm.resetFields(); setSelectedPackage(created); setPackages(rows => mergePackage(rows, created)); await refreshPackageDetail(created.id); } finally { setPackageSubmitting(false); } };
  const createTopic = async () => { if (!selectedPackage?.id) return message.warning('请先选择主题包'); setTopicSubmitting(true); try { const v = await topicForm.validateFields(); const created = await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode: v.platformCode, contentType: 'IMAGE_TEXT', subTopicName: v.subTopicName }); message.success('平台子主题已创建，请上传账号主页并确认账号'); setTopicOpen(false); topicForm.resetFields(); setSelectedPlatform(v.platformCode); setSelectedTopicId(created.id); await refreshPackageDetail(selectedPackage.id); } finally { setTopicSubmitting(false); } };
  const openTopicModal = (platform: PlatformCode) => { topicForm.setFieldsValue({ platformCode: platform }); setSelectedPlatform(platform); setTopicOpen(true); };
  const openConfirmContent = (topic: DataOpsPlatformTopic) => { if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号，再上传图文/视频页面'); setActiveTopic(topic); setSelectedTopicId(topic.id); contentForm.setFieldsValue({ contentTitle: contentTitle(selectedContent) || '', contentType: selectedContentType, contentDate: today }); setContentOpen(true); };
  const confirmContent = async () => { if (!activeTopic?.id) return; setContentSubmitting(true); try { const v = await contentForm.validateFields(); await dataOpsApi.confirmContent(activeTopic.id, { contentTitle: v.contentTitle, contentSummary: v.contentSummary, contentDate: v.contentDate || today, contentType: v.contentType || selectedContentType }); message.success('人工确认完成，数据页上传已解锁'); setContentOpen(false); contentForm.resetFields(); setSelectedContentType(v.contentType || selectedContentType); await refreshPackageDetail(); await refreshTopicMetrics(activeTopic.id); } finally { setContentSubmitting(false); } };
  const uploadAccountProfile = async (topic: DataOpsPlatformTopic, file: File) => { setUploadingAccount(true); setSelectedTopicId(topic.id); try { const updated = await dataOpsApi.uploadCover(topic.id, file); const assetId = topicCoverAssetId(updated) || topicCoverAssetId(topic); if (assetId) await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(topic), scene: 'ACCOUNT_OVERVIEW' }); message.success('账号主页识别完成，请确认账号名称和账号ID'); await refreshPackageDetail(); await refreshTopicMetrics(topic.id); } finally { setUploadingAccount(false); } };
  const confirmAccount = async () => { if (!selectedTopic?.id) return; const v = await accountForm.validateFields(); setAccountConfirming(true); try { await dataOpsApi.confirmAccount(selectedTopic.id, { accountName: v.accountName, platformUserId: v.platformUserId }); message.success('账号已确认，请继续上传图文/视频页面自动识别'); await refreshPackageDetail(); await refreshTopicMetrics(selectedTopic.id); } finally { setAccountConfirming(false); } };
  const uploadContentPageAndUnlock = async (topic: DataOpsPlatformTopic, file: File) => { if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号'); const platform = topicPlatform(topic) || selectedPlatform; setUploadingContentPage(true); setSelectedTopicId(topic.id); try { const recognition: any = await dataRecognitionApi.recognize(file, { platform, scene: 'CONTENT_DETAIL', contentType: 'AUTO' }); const detected = normalizeDetectedContentType(recognition.contentType || recognition.result?.contentType); if (!detected) return message.warning('AI 未能判断这是图文还是视频，请人工选择类型并确认标题'); const title = recognition.result?.contentTitle || recognition.result?.candidateTitles?.[0] || `${contentTypeLabelMap[detected]}内容-${dayjs().format('HHmmss')}`; setSelectedContentType(detected); setActiveTopic(topic); contentForm.setFieldsValue({ contentTitle: title, contentType: detected, contentDate: today, contentSummary: `AI识别建议：${contentTypeLabelMap[detected]}；页面类型：${recognition.pageType || recognition.result?.pageType || 'CONTENT_PAGE'}；下一步：人工确认后解锁数据页；requestId=${recognition.requestId || ''}` }); setContentOpen(true); message.success(`AI 已识别为${contentTypeLabelMap[detected]}，请人工确认标题后再解锁数据页`); } finally { setUploadingContentPage(false); } };
  const uploadDataPage = async (group: DataOpsAssetGroup, file: File) => { if (!accountConfirmed) return message.warning('请先确认账号'); if (!selectedContent?.id) return message.warning('请先人工确认图文/视频类型和标题，确认后才可上传数据页'); setUploadingData(true); try { await dataOpsApi.uploadScreenshots(selectedContent.id, [file], group); message.success('数据图上传成功，后台会异步识别，后续仍需人工校验指标'); await refreshPackageDetail(); await refreshTopicMetrics(selectedTopicId); } finally { setUploadingData(false); } };
  const generateCurrentTopicData = async (topic: DataOpsPlatformTopic) => { if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号'); setUploadingAccount(true); try { const result = await dataOpsApi.generateCurrentTopicData(topic.id); if (result.package) { setSelectedPackage(result.package); setPackages(rows => mergePackage(rows, result.package!)); } else await refreshPackageDetail(); await refreshTopicMetrics(topic.id); message.success('当前主题识别任务已处理'); } finally { setUploadingAccount(false); } };
  const deleteAsset = async (asset?: DataOpsAsset) => { if (!asset?.id) return; setDeletingAssetId(asset.id); try { await dataOpsApi.deleteAsset(asset.id); message.success('图片已删除'); await refreshPackageDetail(); await refreshTopicMetrics(selectedTopicId); } finally { setDeletingAssetId(undefined); } };
  const generateReport = async () => { setReportGenerating(true); try { await dataOpsApi.generateDailyReport({ date: today }); message.success('当日报告已生成'); await loadPackages(); } finally { setReportGenerating(false); } };
  const recognizeAccountProfile = async (row: DataOpsPlatformTopic) => { const assetId = topicCoverAssetId(row); if (!assetId) return; await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(row), scene: 'ACCOUNT_OVERVIEW' }); await refreshPackageDetail(); await refreshTopicMetrics(row.id); };
  const handleTreeSelect = (keys: Key[]) => { const key = String(keys?.[0] || ''); if (key.startsWith('platform-')) { const [, packageId, platform] = key.split('-'); const pkg = packages.find(item => item.id === Number(packageId)); if (pkg) setSelectedPackage(pkg); setSelectedPlatform(platform as PlatformCode); setSelectedTopicId(undefined); } if (key.startsWith('package-')) { const pkg = packages.find(item => item.id === Number(key.replace('package-', ''))); if (pkg) setSelectedPackage(pkg); setSelectedTopicId(undefined); } };
  const preview = (asset?: DataOpsAsset) => asset ? <Image src={toPreviewUrl(assetUrl(asset))} width="100%" height={130} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传" />;
  const assetExtra = (asset?: DataOpsAsset) => asset ? <Space><Tag color={statusColor(assetStatus(asset))}>{assetStatus(asset)}</Tag><Popconfirm title="删除这张图片？" okText="删除" cancelText="取消" onConfirm={() => deleteAsset(asset)}><Button danger size="small" type="text" icon={<DeleteOutlined />} loading={deletingAssetId === asset.id} /></Popconfirm></Space> : <Tag>未上传</Tag>;

  return <>
    <PageHeader title="运营数据" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button><Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button></Space>} />
    <Row gutter={[16, 16]}><Col xs={24} sm={12} lg={6}><Card><Statistic title="当前子主题" value={selectedPlatformTopics.length} /></Card></Col><Col xs={24} sm={12} lg={6}><Card><Statistic title="账号确认" value={accountConfirmed ? '已确认' : '未确认'} /></Card></Col><Col xs={24} sm={12} lg={6}><Card><Statistic title="当前图文/视频" value={selectedContents.length} /></Card></Col><Col xs={24} sm={12} lg={6}><Card><Statistic title="缺失指标" value={topicMetricStatus?.missing || 0} /></Card></Col></Row>
    <Row gutter={[16, 16]} className="mt12"><Col xs={24} lg={5}><Card title="主题路径"><Tree showIcon defaultExpandAll selectedKeys={selectedPackage ? [`platform-${selectedPackage.id}-${selectedPlatform}`] : []} treeData={treeData} onSelect={handleTreeSelect} /></Card></Col><Col xs={24} lg={19}><Card loading={loading} title={selectedPackage ? `${packageTitle(selectedPackage)} / ${platformLabelMap[selectedPlatform]}` : '主题包工作区'} extra={<Space><Tag color="blue">{platformLabelMap[selectedPlatform]}</Tag><Button icon={<PlusOutlined />} onClick={() => openTopicModal(selectedPlatform)}>创建平台子主题</Button></Space>}>{selectedPackage ? <>
      <Table rowKey="id" pagination={{ pageSize: 5 }} dataSource={selectedPlatformTopics as any[]} onRow={record => ({ onClick: () => setSelectedTopicId(record.id) })} columns={[{ title: '平台', width: 90, render: (_, row: any) => platformLabelMap[pick(row, 'platform_code', 'platformCode')] }, { title: '子主题/账号入口', render: (_, row: any) => pick(row, 'sub_topic_name', 'subTopicName') }, { title: '账号', render: (_, row: any) => pick(row, 'ocr_account_name', 'ocrAccountName') || '待识别' }, { title: platformIdLabelMap[selectedPlatform], render: (_, row: any) => pick(row, 'ocr_platform_user_id', 'ocrPlatformUserId') || '待识别' }, { title: '账号确认', render: (_, row: DataOpsPlatformTopic) => <Tag color={topicAccountConfirmed(row) ? 'green' : 'gold'}>{topicAccountConfirmed(row) ? '已确认' : '待确认'}</Tag> }, { title: '操作', width: 430, render: (_, row: DataOpsPlatformTopic) => <Space wrap onClick={event => event.stopPropagation()}><Upload showUploadList={false} beforeUpload={file => { uploadAccountProfile(row, file); return false; }}><Button loading={uploadingAccount && selectedTopicId === row.id} icon={<CloudUploadOutlined />}>上传账号主页</Button></Upload><Button icon={<ScanOutlined />} disabled={!topicCoverAssetId(row)} onClick={() => recognizeAccountProfile(row)}>识别账号</Button><Button onClick={() => { setSelectedTopicId(row.id); accountForm.setFieldsValue({ accountName: topicAccountName(row), platformUserId: topicPlatformUserId(row) }); }}>确认账号</Button></Space> }]} />
      <Card type="inner" className="mt12" title={selectedTopic ? `账号主页确认：${topicName(selectedTopic)}` : '账号主页确认'} extra={selectedTopic ? <Tag color={accountConfirmed ? 'green' : 'gold'}>{accountConfirmed ? '账号已确认' : '必须先确认账号'}</Tag> : null}>{selectedTopic ? <Row gutter={[16, 16]}><Col xs={24} lg={8}><Card size="small" title="账号主页截图" extra={assetExtra(accountProfileAsset)}>{preview(accountProfileAsset)}<Upload showUploadList={false} beforeUpload={file => { uploadAccountProfile(selectedTopic, file); return false; }}><Button block className="mt12" icon={<CloudUploadOutlined />} loading={uploadingAccount}>上传/替换账号主页</Button></Upload></Card></Col><Col xs={24} lg={16}><Form form={accountForm} layout="vertical"><Row gutter={12}><Col xs={24} md={12}><Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请确认账号名称' }]}><Input placeholder="OCR识别后可人工修正" /></Form.Item></Col><Col xs={24} md={12}><Form.Item name="platformUserId" label={platformIdLabelMap[selectedPlatform]} rules={[{ required: true, message: '请确认平台账号ID' }]}><Input placeholder="例如抖音号/视频号/小红书号" /></Form.Item></Col></Row><Button type="primary" loading={accountConfirming} onClick={confirmAccount}>确认账号后上传图文/视频页面</Button></Form><div style={{ marginTop: 12, color: accountConfirmed ? '#52c41a' : '#fa8c16' }}>{accountConfirmed ? `已确认：${topicAccountName(selectedTopic)} / ${topicPlatformUserId(selectedTopic)}。下一步请上传图文或视频页面，AI识别后还需要人工确认。` : '未确认前，图文/视频页面上传、数据页上传全部禁止。'}</div></Col></Row> : <Empty description="请选择一个平台子主题" />}</Card>
      <Card type="inner" className="mt12" title="账号下的内容类型" extra={<Tag color={accountConfirmed ? 'green' : 'default'}>{accountConfirmed ? `账号：${topicAccountName(selectedTopic)}` : '先确认账号'}</Tag>}><Tabs activeKey={selectedContentType} onChange={key => setSelectedContentType(key as DataOpsContentType)} items={contentTypeOptions.map(item => ({ key: item.value, label: item.label, disabled: !accountConfirmed }))} /><Space wrap><Upload showUploadList={false} beforeUpload={file => { selectedTopic && uploadContentPageAndUnlock(selectedTopic, file); return false; }}><Button type="primary" disabled={!accountConfirmed} loading={uploadingContentPage} icon={<CloudUploadOutlined />}>上传图文/视频页面识别</Button></Upload><Button disabled={!accountConfirmed} onClick={() => selectedTopic && openConfirmContent(selectedTopic)}>手动确认标题</Button></Space><div style={{ marginTop: 12, opacity: 0.72 }}>{selectedContent ? `已人工确认：${contentTypeLabelMap[selectedContentType]} / ${contentTitle(selectedContent)}` : '请上传图文或视频页面截图。AI只给建议，必须人工确认类型和标题后，才允许上传数据页。'}</div></Card>
      <Card type="inner" className="mt12" title="账号 → 图文/视频 → 数据表" extra={topicMetricStatus ? <Space><Tag color={selectedStatus.color}>{selectedStatus.label}</Tag><span>成功 {topicMetricStatus.success || 0}/{topicMetricStatus.total || 0}</span></Space> : null}><AccountVideoMetricTable rows={topicMetrics} loading={metricLoading} /></Card>
      <Card type="inner" className="mt12" title={`${contentTypeLabelMap[selectedContentType]}数据页上传`}>{selectedTopic ? <Row gutter={[16, 16]}><Col xs={24} lg={8}><Card size="small" title={`${contentTypeLabelMap[selectedContentType]}内容`} extra={<Tag color={selectedContent ? 'green' : 'gold'}>{selectedContent ? '已人工确认' : '待确认内容'}</Tag>}><Statistic title="当前标题" value={contentTitle(selectedContent) || '待人工确认'} /><Upload showUploadList={false} beforeUpload={file => { uploadContentPageAndUnlock(selectedTopic, file); return false; }}><Button block className="mt12" disabled={!accountConfirmed} loading={uploadingContentPage} icon={<CloudUploadOutlined />}>上传图文/视频页面识别标题</Button></Upload><Button block className="mt12" disabled={!accountConfirmed} onClick={() => openConfirmContent(selectedTopic)}>手动修正/确认标题</Button></Card></Col><Col xs={24} lg={16}><Space direction="vertical" size={16} style={{ width: '100%' }}>{dataGroups.map(group => { const groupAssets = dataAssets.filter(asset => assetGroup(asset) === group.key); return <Card key={group.key} size="small" title={group.title} extra={<Tag>{groupAssets.length} 张</Tag>}><div style={{ marginBottom: 12, opacity: 0.65 }}>{group.desc}</div><Upload showUploadList={false} beforeUpload={file => { uploadDataPage(group.key, file); return false; }}><Button disabled={!accountConfirmed || !selectedContent} loading={uploadingData} icon={<CloudUploadOutlined />}>上传{group.title}</Button></Upload><Row gutter={[12, 12]} className="mt12">{groupAssets.map(asset => <Col xs={24} md={8} key={asset.id}><Card size="small" title={assetFileName(asset)} extra={assetExtra(asset)}>{preview(asset)}</Card></Col>)}</Row></Card>; })}</Space></Col></Row> : <Empty description="请选择一个子主题" />}</Card>
    </> : <Empty description="请先创建今日主题包" />}</Card></Col></Row>
    <Modal title="创建主题包" open={packageOpen} onOk={createPackage} onCancel={() => setPackageOpen(false)} confirmLoading={packageSubmitting} destroyOnClose><Form form={packageForm} layout="vertical" initialValues={{ topicDate: today }}><Form.Item name="topicDate" label="创建日期" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="operatorUserIds" label="选择运营人员" rules={[{ required: true }]}><Select mode="multiple" options={userOptions(operatorUsers)} /></Form.Item><Form.Item name="mediaUserIds" label="选择媒体人员" rules={[{ required: true }]}><Select mode="multiple" options={userOptions(mediaUsers)} /></Form.Item></Form></Modal>
    <Modal title="创建平台子主题" open={topicOpen} onOk={createTopic} onCancel={() => setTopicOpen(false)} confirmLoading={topicSubmitting} destroyOnClose><Form form={topicForm} layout="vertical"><Form.Item name="platformCode" label="平台" rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item><Form.Item name="subTopicName" label="子主题/账号入口名称"><Input placeholder="例如：澳洲账号A" /></Form.Item><div style={{ color: '#fa8c16' }}>创建后必须上传账号主页截图并确认账号，才能继续上传图文/视频页面。</div></Form></Modal>
    <Modal title={`人工确认${contentTypeLabelMap[selectedContentType]}类型和标题`} open={contentOpen} onOk={confirmContent} onCancel={() => setContentOpen(false)} confirmLoading={contentSubmitting} destroyOnClose><Form form={contentForm} layout="vertical" initialValues={{ contentDate: today, contentType: selectedContentType }}><Form.Item name="contentTitle" label={`${contentTypeLabelMap[selectedContentType]}标题`} rules={[{ required: true }]}><Input placeholder="AI识别后请人工确认，可手动修正" /></Form.Item><Form.Item name="contentType" label="内容类型" rules={[{ required: true }]}><Select options={contentTypeOptions} /></Form.Item><Form.Item name="contentSummary" label="AI识别说明 / 人工备注"><Input.TextArea rows={3} /></Form.Item><Form.Item name="contentDate" label="内容日期"><Input /></Form.Item><div style={{ color: '#fa8c16' }}>确认后才会真正创建内容记录，并解锁数据页上传。</div></Form></Modal>
  </>;
}
