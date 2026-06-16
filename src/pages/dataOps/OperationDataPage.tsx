import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tree,
  Upload,
  message
} from 'antd';
import {
  CalendarOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ScanOutlined
} from '@ant-design/icons';
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

const contentTypeOptions: { label: string; value: DataOpsContentType; desc: string }[] = [
  { label: '图文', value: 'IMAGE_TEXT', desc: '图文作品：会识别文案展开率、平均浏览图片数等图文指标' },
  { label: '视频', value: 'VIDEO', desc: '视频作品：会识别完播率、5s完播率、弹幕量等视频指标' }
];

const dataGroups: { key: DataOpsAssetGroup; title: string; desc: string }[] = [
  { key: 'DOUYIN_OVERVIEW', title: '数据页1 · 总览指标', desc: '播放量、点赞量、评论量、分享量、收藏量、完播率、划走率' },
  { key: 'DOUYIN_OVERVIEW_CHART', title: '数据页2 · 趋势/粉丝图表', desc: '趋势曲线、涨粉量、脱粉量、粉丝播放占比、小时/每日图表' },
  { key: 'DOUYIN_FLOW_ANALYSIS', title: '数据页3 · 流量分析', desc: '流量上涨、封面点击率、评论率、分享率、完播率、5s完播率' }
];

const platformLabelMap: Record<string, string> = { DOUYIN: '抖音', XIAOHONGSHU: '小红书', WECHAT_CHANNEL: '视频号' };
const platformIdLabelMap: Record<string, string> = { DOUYIN: '抖音号', XIAOHONGSHU: '小红书号', WECHAT_CHANNEL: '视频号' };
const contentTypeLabelMap: Record<string, string> = { IMAGE_TEXT: '图文', VIDEO: '视频' };

function pick<T = any>(row: any, a: string, b: string): T | undefined { return row?.[a] ?? row?.[b]; }
function cleanDisplayText(value?: any) { const text = String(value ?? '').trim(); return text && text.toLowerCase() !== 'null' ? text : ''; }
function packageDate(pkg?: DataOpsPackage) { return pick<string>(pkg, 'topic_date', 'topicDate') || dayjs().format('YYYY-MM-DD'); }
function packageTitle(pkg?: DataOpsPackage) { return pick<string>(pkg, 'display_name', 'displayName') || pick<string>(pkg, 'folder_name', 'folderName') || '数据主题包'; }
function topicPlatform(topic?: DataOpsPlatformTopic): PlatformCode | undefined { return pick<PlatformCode>(topic, 'platform_code', 'platformCode'); }
function topicName(topic?: DataOpsPlatformTopic) { return pick<string>(topic, 'sub_topic_name', 'subTopicName') || pick<string>(topic, 'ocr_title', 'ocrTitle') || ''; }
function topicCoverAssetId(topic?: DataOpsPlatformTopic) { return pick<number>(topic, 'cover_asset_id', 'coverAssetId') || topic?.asset?.id; }
function topicAccountName(topic?: DataOpsPlatformTopic) { return pick<string>(topic, 'ocr_account_name', 'ocrAccountName') || ''; }
function topicPlatformUserId(topic?: DataOpsPlatformTopic) { return pick<string>(topic, 'ocr_platform_user_id', 'ocrPlatformUserId') || ''; }
function topicAccountConfirmed(topic?: DataOpsPlatformTopic) { return Number(pick<any>(topic, 'account_confirmed_flag', 'accountConfirmedFlag') || 0) === 1 || Boolean(pick<any>(topic, 'accountConfirmed', 'accountConfirmed')); }
function topicContentType(topic?: DataOpsPlatformTopic): DataOpsContentType | undefined { return pick<DataOpsContentType>(topic, 'content_type', 'contentType'); }
function contentId(content?: DataOpsContent) { return content?.id; }
function contentTopicId(content?: DataOpsContent) { return pick<number>(content, 'platform_topic_id', 'platformTopicId'); }
function contentVideoId(content?: DataOpsContent) { return pick<number>(content, 'video_id', 'videoId'); }
function contentContentType(content?: DataOpsContent): DataOpsContentType { return pick<DataOpsContentType>(content, 'content_type', 'contentType') || 'IMAGE_TEXT'; }
function contentTitle(content?: DataOpsContent) { return cleanDisplayText(pick<string>(content, 'content_title', 'contentTitle')); }
function assetTopicId(asset?: DataOpsAsset) { return pick<number>(asset, 'platform_topic_id', 'platformTopicId'); }
function assetContentId(asset?: DataOpsAsset) { return pick<number>(asset, 'content_id', 'contentId'); }
function assetType(asset?: DataOpsAsset) { return pick<string>(asset, 'asset_type', 'assetType'); }
function assetGroup(asset?: DataOpsAsset): DataOpsAssetGroup { return pick<DataOpsAssetGroup>(asset, 'asset_group', 'assetGroup') || 'DOUYIN_OVERVIEW'; }
function assetUrl(asset?: DataOpsAsset) { return pick<string>(asset, 'public_url', 'publicUrl') || pick<string>(asset, 'url', 'url') || pick<string>(asset, 'thumbnail_url', 'thumbnailUrl') || ''; }
function assetStatus(asset?: DataOpsAsset) { return pick<string>(asset, 'recognition_status', 'recognitionStatus') || pick<string>(asset, 'upload_status', 'uploadStatus') || pick<string>(asset, 'status', 'status') || 'pending'; }
function toPreviewUrl(url?: string) { if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; const root = API_ROOT_URL.replace(/\/api\/?$/, ''); return `${root}${url.startsWith('/') ? '' : '/'}${url}`; }
function statusColor(status?: string) { const value = String(status || '').toUpperCase(); if (['SUCCESS', 'DATA_SUCCESS', 'COVER_SUCCESS'].includes(value) || status === 'recognized') return 'green'; if (['FAILED', 'DATA_FAILED', 'COVER_FAILED'].includes(value) || status === 'failed') return 'red'; if (['PROCESSING', 'DATA_PROCESSING'].includes(value) || status === 'processing') return 'blue'; if (['DATA_PARTIAL', 'PARTIAL'].includes(value)) return 'orange'; if (['PENDING', 'DATA_PENDING'].includes(value) || status === 'pending') return 'gold'; return 'default'; }
function metricStatusView(status?: DataOpsTopicRecognitionStatus) { return { label: status?.label || '未上传', color: status?.color || statusColor(status?.status) }; }
function mergePackage(rows: DataOpsPackage[], detail: DataOpsPackage) { return rows.some(item => item.id === detail.id) ? rows.map(item => (item.id === detail.id ? detail : item)) : [detail, ...rows]; }
function normalizeDetectedContentType(value?: string | null): DataOpsContentType | undefined { return value === 'IMAGE_TEXT' || value === 'VIDEO' ? value : undefined; }
function userOptions(rows: DataOpsUserOption[]) { return rows.map(row => ({ value: row.id, label: `${pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}` })); }
function normalizeConfirmedContent(content: DataOpsContent, topicId: number, contentType: DataOpsContentType, title: string): DataOpsContent { return { ...content, platform_topic_id: contentTopicId(content) || topicId, platformTopicId: contentTopicId(content) || topicId, content_type: contentType, contentType, content_title: title, contentTitle: title }; }
function sceneFromAssetGroup(group: DataOpsAssetGroup) { if (group === 'DOUYIN_OVERVIEW') return 'DOUYIN_OVERVIEW'; if (group === 'DOUYIN_OVERVIEW_CHART') return 'DOUYIN_OVERVIEW_CHART'; return 'DOUYIN_FLOW_ANALYSIS'; }
function metricStatusFromRows(rows: DataOpsMetricRow[]): DataOpsTopicRecognitionStatus | undefined { if (!rows.length) return undefined; const total = rows.length; const success = rows.filter(row => String(row.recognitionStatus).toUpperCase() === 'SUCCESS').length; const failed = rows.filter(row => String(row.recognitionStatus).toUpperCase() === 'FAILED').length; const missing = rows.filter(row => row.metricValue == null && row.metricNumeric == null).length; if (success === total && missing === 0) return { status: 'DATA_SUCCESS', label: '已完成', color: 'green', total, success, failed, missing }; if (success > 0) return { status: 'DATA_PARTIAL', label: '部分完成', color: 'orange', total, success, failed, missing }; if (failed > 0) return { status: 'DATA_FAILED', label: '识别失败', color: 'red', total, success, failed, missing }; return { status: 'DATA_PENDING', label: '待识别', color: 'gold', total, success, failed, missing }; }

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
  const [selectedContentId, setSelectedContentId] = useState<number>();
  const [editingContentId, setEditingContentId] = useState<number>();
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

  const loadPackages = async () => { setLoading(true); try { const rows = await dataOpsApi.packages({ date: today }); const hydrated = await Promise.all((rows || []).map(async row => { try { return await dataOpsApi.packageDetail(row.id); } catch { return row; } })); setPackages(hydrated); setSelectedPackage(current => (current?.id ? hydrated.find(item => item.id === current.id) || hydrated[0] : hydrated[0])); } finally { setLoading(false); } };
  const refreshPackageDetail = async (packageId?: number) => { const id = packageId || selectedPackage?.id; if (!id) return; const detail = await dataOpsApi.packageDetail(id); setSelectedPackage(detail); setPackages(rows => mergePackage(rows, detail)); };
  const refreshTopicMetrics = async (topicId?: number) => { if (!topicId) { setTopicMetrics([]); setTopicMetricStatus(undefined); return; } setMetricLoading(true); try { const result = await dataOpsApi.topicMetrics(topicId); setTopicMetrics(result.rows || []); setTopicMetricStatus(result.status); } finally { setMetricLoading(false); } };

  useEffect(() => { loadPackages().catch(() => undefined); Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA')]).then(([o, m]) => { setOperatorUsers(o || []); setMediaUsers(m || []); }).catch(() => undefined); }, []);

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const assets = selectedPackage?.assets || [];
  const selectedPlatformTopics = useMemo(() => platformTopics.filter(topic => topicPlatform(topic) === selectedPlatform), [platformTopics, selectedPlatform]);
  const selectedTopic = useMemo(() => selectedPlatformTopics.find(topic => topic.id === selectedTopicId), [selectedPlatformTopics, selectedTopicId]);
  const accountConfirmed = topicAccountConfirmed(selectedTopic);
  const accountContents = useMemo(() => selectedTopicId ? [...contents.filter(content => contentTopicId(content) === selectedTopicId)].sort((a, b) => Number(b.id) - Number(a.id)) : [], [contents, selectedTopicId]);
  const imageTextContents = useMemo(() => accountContents.filter(content => contentContentType(content) === 'IMAGE_TEXT'), [accountContents]);
  const videoContents = useMemo(() => accountContents.filter(content => contentContentType(content) === 'VIDEO'), [accountContents]);
  const selectedContent = useMemo(() => accountContents.find(content => content.id === selectedContentId) || accountContents.find(content => contentContentType(content) === selectedContentType) || accountContents[0], [accountContents, selectedContentId, selectedContentType]);
  const selectedTopicAssets = useMemo(() => selectedTopicId ? assets.filter(asset => Number(assetTopicId(asset)) === selectedTopicId) : [], [assets, selectedTopicId]);
  const accountProfileAsset = selectedTopicAssets.find(asset => assetType(asset) === 'COVER');
  const dataAssets = selectedTopicAssets.filter(asset => assetType(asset) === 'DATA_SCREENSHOT');
  const selectedMetricRows = useMemo(() => { if (!selectedContent?.id) return []; const videoId = contentVideoId(selectedContent); return topicMetrics.filter(row => Number(row.contentId || 0) === selectedContent.id || (videoId ? Number(row.videoId || 0) === Number(videoId) : false)); }, [topicMetrics, selectedContent]);
  const selectedMetricStatus = metricStatusFromRows(selectedMetricRows) || topicMetricStatus;
  const selectedStatus = metricStatusView(selectedMetricStatus);

  useEffect(() => { refreshTopicMetrics(selectedTopicId).catch(() => undefined); }, [selectedTopicId]);
  useEffect(() => { if (!selectedPlatformTopics.length) { setSelectedTopicId(undefined); setSelectedContentId(undefined); return; } if (!selectedTopicId || !selectedPlatformTopics.some(topic => topic.id === selectedTopicId)) setSelectedTopicId(selectedPlatformTopics[0].id); }, [selectedPlatformTopics, selectedTopicId]);
  useEffect(() => { if (!accountContents.length) { setSelectedContentId(undefined); return; } if (!selectedContentId || !accountContents.some(content => content.id === selectedContentId)) setSelectedContentId(accountContents[0].id); }, [accountContents, selectedContentId]);
  useEffect(() => { accountForm.setFieldsValue({ accountName: topicAccountName(selectedTopic), platformUserId: topicPlatformUserId(selectedTopic) }); }, [selectedTopicId, selectedTopic, accountForm]);
  useEffect(() => { if (selectedContent) setSelectedContentType(contentContentType(selectedContent)); else if (selectedTopic) setSelectedContentType(topicContentType(selectedTopic) || 'IMAGE_TEXT'); }, [selectedContent, selectedTopic]);

  const treeData = useMemo(() => { if (!packages.length) return [{ title: today, key: `date-${today}`, icon: <CalendarOutlined />, children: [] }]; const groups = new Map<string, DataOpsPackage[]>(); packages.forEach(pkg => groups.set(packageDate(pkg), [...(groups.get(packageDate(pkg)) || []), pkg])); return Array.from(groups.entries()).map(([date, datePackages]) => ({ title: `${date}（${datePackages.length} 个主题包）`, key: `date-${date}`, icon: <CalendarOutlined />, children: datePackages.map(pkg => ({ title: packageTitle(pkg), key: `package-${pkg.id}`, icon: <FolderOpenOutlined />, children: platformOptions.map(platform => ({ title: `${platform.label} (${(pkg.platformTopics || []).filter(topic => topicPlatform(topic) === platform.value).length})`, key: `platform-${pkg.id}-${platform.value}` })) })) })); }, [packages, today]);

  const createPackage = async () => { setPackageSubmitting(true); try { const v = await packageForm.validateFields(); const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number) }); setPackages(rows => mergePackage(rows, created)); setSelectedPackage(created); setPackageOpen(false); packageForm.resetFields(); message.success('主题包已创建'); } finally { setPackageSubmitting(false); } };
  const createPlatformTopic = async () => { if (!selectedPackage?.id) return; setTopicSubmitting(true); try { const v = await topicForm.validateFields(); await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode: v.platformCode, subTopicName: v.subTopicName, contentType: selectedContentType }); message.success('平台子主题已创建'); setTopicOpen(false); topicForm.resetFields(); await refreshPackageDetail(); } finally { setTopicSubmitting(false); } };
  const openTopicModal = (platform: PlatformCode) => { topicForm.setFieldsValue({ platformCode: platform }); setSelectedPlatform(platform); setTopicOpen(true); };

  const openConfirmContent = (topic: DataOpsPlatformTopic, content?: DataOpsContent) => { if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号，再上传图文/视频页面'); const rememberedType = content ? contentContentType(content) : selectedContentType || topicContentType(topic) || 'IMAGE_TEXT'; setSelectedContentType(rememberedType); setEditingContentId(contentId(content)); setActiveTopic(topic); setSelectedTopicId(topic.id); contentForm.setFieldsValue({ contentTitle: contentTitle(content) || '', contentType: rememberedType, contentDate: today, contentSummary: pick<string>(content, 'content_summary', 'contentSummary') || '' }); setContentOpen(true); };

  const confirmContent = async () => { if (!activeTopic?.id) return; setContentSubmitting(true); try { const v = await contentForm.validateFields(); const nextType: DataOpsContentType = v.contentType || selectedContentType; const payload = { contentId: editingContentId, contentTitle: v.contentTitle, contentSummary: v.contentSummary, contentDate: v.contentDate || today, contentType: nextType } as any; const created = await dataOpsApi.confirmContent(activeTopic.id, payload); const finalTitle = contentTitle(created) || cleanDisplayText(v.contentTitle); const normalized = normalizeConfirmedContent(created, activeTopic.id, nextType, finalTitle); const basePackage = selectedPackage?.id ? await dataOpsApi.packageDetail(selectedPackage.id) : selectedPackage; const patchedPackage = basePackage ? { ...basePackage, contents: [normalized, ...(basePackage.contents || []).filter(row => row.id !== normalized.id)] } : undefined; if (patchedPackage) { setSelectedPackage(patchedPackage); setPackages(rows => mergePackage(rows, patchedPackage)); } setSelectedContentType(nextType); setSelectedContentId(normalized.id); setEditingContentId(undefined); message.success(editingContentId ? '内容已更新' : '新内容已新增，数据页上传已解锁'); setContentOpen(false); await refreshPackageDetail(); await refreshTopicMetrics(activeTopic.id); } finally { setContentSubmitting(false); } };

  const uploadAccountProfile = async (topic: DataOpsPlatformTopic, file: File) => { setUploadingAccount(true); setSelectedTopicId(topic.id); try { const updated = await dataOpsApi.uploadCover(topic.id, file); const assetId = topicCoverAssetId(updated) || topicCoverAssetId(topic); if (assetId) await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(topic), scene: 'ACCOUNT_OVERVIEW' }); message.success('账号主页识别完成，请确认账号名称和账号ID'); await refreshPackageDetail(); await refreshTopicMetrics(topic.id); } finally { setUploadingAccount(false); } };
  const confirmAccount = async () => { if (!selectedTopic?.id) return; const v = await accountForm.validateFields(); setAccountConfirming(true); try { await dataOpsApi.confirmAccount(selectedTopic.id, { accountName: v.accountName, platformUserId: v.platformUserId }); message.success('账号已确认，请继续上传图文/视频页面自动识别'); await refreshPackageDetail(); await refreshTopicMetrics(selectedTopic.id); } finally { setAccountConfirming(false); } };
  const uploadContentPageAndUnlock = async (topic: DataOpsPlatformTopic, file: File) => { if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号'); const platform = topicPlatform(topic) || selectedPlatform; setUploadingContentPage(true); setSelectedTopicId(topic.id); try { const recognition: any = await dataRecognitionApi.recognize(file, { platform, scene: 'CONTENT_DETAIL', contentType: 'AUTO' as any }); const detected = normalizeDetectedContentType(recognition.contentType || recognition.result?.contentType) || selectedContentType; const title = recognition.result?.contentTitle || recognition.result?.candidateTitles?.[0] || `${contentTypeLabelMap[detected]}内容-${dayjs().format('HHmmss')}`; setSelectedContentType(detected); setEditingContentId(undefined); setActiveTopic(topic); contentForm.setFieldsValue({ contentTitle: title, contentType: detected, contentDate: today, contentSummary: `AI识别建议：${contentTypeLabelMap[detected]}；requestId=${recognition.requestId || ''}` }); setContentOpen(true); message.success(`AI 已识别为${contentTypeLabelMap[detected]}，确认后会新增到当前账号内容列表`); } finally { setUploadingContentPage(false); } };
  const uploadDataPage = async (group: DataOpsAssetGroup, file: File) => { if (!accountConfirmed) return message.warning('请先确认账号'); if (!selectedContent?.id || !selectedTopicId) return message.warning('请先新增并选择一个内容，再上传数据页'); setUploadingData(true); try { const uploaded = await dataOpsApi.uploadScreenshots(selectedContent.id, [file], group); const uploadedAssets = (uploaded.assets || []).map(asset => ({ ...asset, asset_group: group, assetGroup: group })); await Promise.all(uploadedAssets.map(asset => dataOpsApi.recognizeAsset(asset.id, { platform: selectedPlatform, scene: sceneFromAssetGroup(group) }))); await refreshPackageDetail(); await refreshTopicMetrics(selectedTopicId); message.success('数据页已上传并识别到当前选中内容'); } finally { setUploadingData(false); } };
  const generateCurrentTopicData = async (topic: DataOpsPlatformTopic) => { if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号'); setUploadingAccount(true); try { const result = await dataOpsApi.generateCurrentTopicData(topic.id); if (result.package) { setSelectedPackage(result.package); setPackages(rows => mergePackage(rows, result.package!)); } else await refreshPackageDetail(); await refreshTopicMetrics(topic.id); message.success('当前主题识别任务已处理'); } finally { setUploadingAccount(false); } };
  const deleteAsset = async (asset?: DataOpsAsset) => { if (!asset?.id) return; setDeletingAssetId(asset.id); try { await dataOpsApi.deleteAsset(asset.id); message.success('图片已删除'); await refreshPackageDetail(); await refreshTopicMetrics(selectedTopicId); } finally { setDeletingAssetId(undefined); } };
  const generateReport = async () => { setReportGenerating(true); try { await dataOpsApi.generateDailyReport({ date: today }); message.success('当日报告已生成'); await loadPackages(); } finally { setReportGenerating(false); } };
  const recognizeAccountProfile = async (row: DataOpsPlatformTopic) => { const assetId = topicCoverAssetId(row); if (!assetId) return; await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(row), scene: 'ACCOUNT_OVERVIEW' }); await refreshPackageDetail(); await refreshTopicMetrics(row.id); };
  const handleTreeSelect = (keys: Key[]) => { const key = String(keys?.[0] || ''); if (key.startsWith('platform-')) { const [, packageId, platform] = key.split('-'); const pkg = packages.find(item => item.id === Number(packageId)); if (pkg) setSelectedPackage(pkg); setSelectedPlatform(platform as PlatformCode); setSelectedTopicId(undefined); setSelectedContentId(undefined); } if (key.startsWith('package-')) { const pkg = packages.find(item => item.id === Number(key.replace('package-', ''))); if (pkg) setSelectedPackage(pkg); setSelectedTopicId(undefined); setSelectedContentId(undefined); } };

  const preview = (asset?: DataOpsAsset) => asset ? <Image src={toPreviewUrl(assetUrl(asset))} width="100%" height={130} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传" />;
  const assetExtra = (asset?: DataOpsAsset) => asset ? <Space><Tag color={statusColor(assetStatus(asset))}>{assetStatus(asset)}</Tag><Popconfirm title="删除这张图片？" okText="删除" cancelText="取消" onConfirm={() => deleteAsset(asset)}><Button danger size="small" type="text" icon={<DeleteOutlined />} loading={deletingAssetId === asset.id} /></Popconfirm></Space> : <Tag>未上传</Tag>;
  const renderContentCard = (content: DataOpsContent) => { const active = selectedContent?.id === content.id; return <Card key={content.id} size="small" hoverable onClick={() => { setSelectedContentId(content.id); setSelectedContentType(contentContentType(content)); }} style={{ borderColor: active ? '#1677ff' : undefined, background: active ? 'rgba(22,119,255,0.08)' : undefined }} title={<Space><Tag color={contentContentType(content) === 'VIDEO' ? 'purple' : 'blue'}>{contentTypeLabelMap[contentContentType(content)]}</Tag><span>{contentTitle(content) || `未命名内容 #${content.id}`}</span></Space>} extra={<Space><Tag color={active ? 'processing' : 'default'}>{active ? '当前目标' : `#${content.id}`}</Tag><Button size="small" type="link" onClick={event => { event.stopPropagation(); selectedTopic && openConfirmContent(selectedTopic, content); }}>编辑</Button></Space>}><div style={{ color: '#8c8c8c' }}>{pick<string>(content, 'content_summary', 'contentSummary') || '暂无备注'}</div></Card>; };
  const contentTypeSelector = <Card size="small" style={{ borderColor: accountConfirmed ? '#1677ff' : undefined }}><Space direction="vertical" style={{ width: '100%' }} size={12}><Alert type={selectedContent ? 'success' : 'warning'} showIcon message={selectedContent ? `当前选中：${contentTypeLabelMap[selectedContentType]} / ${contentTitle(selectedContent)}` : '先新增或选择一个内容，再上传数据页'} /><Radio.Group value={selectedContentType} onChange={event => setSelectedContentType(event.target.value)} optionType="button" buttonStyle="solid" size="large" disabled={!accountConfirmed}>{contentTypeOptions.map(item => <Radio.Button key={item.value} value={item.value}>{item.label}</Radio.Button>)}</Radio.Group><div style={{ color: '#8c8c8c' }}>{contentTypeOptions.find(item => item.value === selectedContentType)?.desc}</div></Space></Card>;

  return <>
    <PageHeader title="运营数据" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button><Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button></Space>} />
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前子主题" value={selectedPlatformTopics.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="账号确认" value={accountConfirmed ? '已确认' : '未确认'} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="账号下内容" value={accountContents.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前缺失指标" value={selectedMetricStatus?.missing || 0} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]} className="mt12">
      <Col xs={24} lg={5}><Card title="主题路径"><Tree showIcon defaultExpandAll selectedKeys={selectedPackage ? [`platform-${selectedPackage.id}-${selectedPlatform}`] : []} treeData={treeData} onSelect={handleTreeSelect} /></Card></Col>
      <Col xs={24} lg={19}>
        <Card loading={loading} title={selectedPackage ? `${packageTitle(selectedPackage)} / ${platformLabelMap[selectedPlatform]}` : '主题包工作区'} extra={<Space><Tag color="blue">{platformLabelMap[selectedPlatform]}</Tag><Button icon={<PlusOutlined />} onClick={() => openTopicModal(selectedPlatform)}>创建平台子主题</Button></Space>}>
          {!selectedPackage ? <Empty description="请先创建或选择主题包" /> : <>
            <Table rowKey="id" pagination={{ pageSize: 5 }} dataSource={selectedPlatformTopics as any[]} onRow={record => ({ onClick: () => { setSelectedTopicId(record.id); setSelectedContentId(undefined); } })} columns={[
              { title: '平台', width: 90, render: (_, row: any) => platformLabelMap[pick(row, 'platform_code', 'platformCode') || selectedPlatform] },
              { title: '子主题/账号入口', render: (_, row: any) => pick(row, 'sub_topic_name', 'subTopicName') },
              { title: '账号', render: (_, row: any) => pick(row, 'ocr_account_name', 'ocrAccountName') || '待识别' },
              { title: platformIdLabelMap[selectedPlatform], render: (_, row: any) => pick(row, 'ocr_platform_user_id', 'ocrPlatformUserId') || '待识别' },
              { title: '内容类型', render: (_, row: DataOpsPlatformTopic) => <Tag color={topicContentType(row) === 'VIDEO' ? 'purple' : 'blue'}>{contentTypeLabelMap[topicContentType(row) || 'IMAGE_TEXT']}</Tag> },
              { title: '账号确认', render: (_, row: DataOpsPlatformTopic) => <Tag color={topicAccountConfirmed(row) ? 'green' : 'gold'}>{topicAccountConfirmed(row) ? '已确认' : '待确认'}</Tag> },
              { title: '操作', width: 430, render: (_, row: DataOpsPlatformTopic) => <Space wrap onClick={event => event.stopPropagation()}><Upload showUploadList={false} beforeUpload={file => { uploadAccountProfile(row, file); return false; }}><Button loading={uploadingAccount && selectedTopicId === row.id} icon={<CloudUploadOutlined />}>上传账号主页</Button></Upload><Button icon={<ScanOutlined />} disabled={!topicCoverAssetId(row)} onClick={() => recognizeAccountProfile(row)}>识别账号</Button><Button onClick={() => { setSelectedTopicId(row.id); setSelectedContentId(undefined); accountForm.setFieldsValue({ accountName: topicAccountName(row), platformUserId: topicPlatformUserId(row) }); }}>确认账号</Button></Space> }
            ]} />
            <Card type="inner" className="mt12" title={selectedTopic ? `账号主页确认：${topicName(selectedTopic)}` : '账号主页确认'} extra={selectedTopic ? <Tag color={accountConfirmed ? 'green' : 'gold'}>{accountConfirmed ? '账号已确认' : '必须先确认账号'}</Tag> : null}>
              {selectedTopic ? <Row gutter={[16, 16]}><Col xs={24} lg={8}><Card size="small" title="账号主页截图" extra={assetExtra(accountProfileAsset)}>{preview(accountProfileAsset)}<Upload showUploadList={false} beforeUpload={file => { uploadAccountProfile(selectedTopic, file); return false; }}><Button block className="mt12" icon={<CloudUploadOutlined />} loading={uploadingAccount}>上传/替换账号主页</Button></Upload></Card></Col><Col xs={24} lg={16}><Form form={accountForm} layout="vertical"><Row gutter={12}><Col xs={24} md={12}><Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请确认账号名称' }]}><Input placeholder="OCR识别后可人工修正" /></Form.Item></Col><Col xs={24} md={12}><Form.Item name="platformUserId" label={platformIdLabelMap[selectedPlatform]} rules={[{ required: true, message: '请确认平台账号ID' }]}><Input placeholder="例如抖音号/视频号/小红书号" /></Form.Item></Col></Row><Button type="primary" loading={accountConfirming} onClick={confirmAccount}>确认账号后上传图文/视频页面</Button></Form><div style={{ marginTop: 12, color: accountConfirmed ? '#52c41a' : '#fa8c16' }}>{accountConfirmed ? `已确认：${topicAccountName(selectedTopic)} / ${topicPlatformUserId(selectedTopic)}。该账号下可新增多条图文/视频内容。` : '未确认前，图文/视频页面上传、数据页上传全部禁止。'}</div></Col></Row> : <Empty description="请选择一个平台子主题" />}
            </Card>
            <Card type="inner" className="mt12" title="账号下的内容" extra={<Tag color={accountConfirmed ? 'green' : 'default'}>{accountConfirmed ? `账号：${topicAccountName(selectedTopic)}` : '先确认账号'}</Tag>}>
              <Row gutter={[16, 16]}><Col xs={24} lg={8}>{contentTypeSelector}</Col><Col xs={24} lg={16}><Space wrap><Upload showUploadList={false} beforeUpload={file => { selectedTopic && uploadContentPageAndUnlock(selectedTopic, file); return false; }}><Button type="primary" disabled={!accountConfirmed} loading={uploadingContentPage} icon={<CloudUploadOutlined />}>上传图文/视频页面识别并新增</Button></Upload><Button disabled={!accountConfirmed} onClick={() => selectedTopic && openConfirmContent(selectedTopic)}>手动新增内容</Button><Button disabled={!selectedTopic || !selectedContent} onClick={() => selectedTopic && selectedContent && openConfirmContent(selectedTopic, selectedContent)}>编辑当前内容</Button></Space><div style={{ marginTop: 12, opacity: 0.72 }}>点击某条内容后，下面数据页1/2/3会绑定到当前选中内容。</div><Row gutter={[12, 12]} style={{ marginTop: 12 }}><Col xs={24} md={12}><Card size="small" title={`图文内容（${imageTextContents.length}）`}>{imageTextContents.length ? <Space direction="vertical" style={{ width: '100%' }}>{imageTextContents.map(renderContentCard)}</Space> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无图文" />}</Card></Col><Col xs={24} md={12}><Card size="small" title={`视频内容（${videoContents.length}）`}>{videoContents.length ? <Space direction="vertical" style={{ width: '100%' }}>{videoContents.map(renderContentCard)}</Space> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无视频" />}</Card></Col></Row></Col></Row>
            </Card>
            <Card type="inner" className="mt12" title="账号 → 当前内容 → 数据表" extra={selectedMetricStatus ? <Space><Tag color={selectedStatus.color}>{selectedStatus.label}</Tag><span>成功 {selectedMetricStatus.success || 0}/{selectedMetricStatus.total || 0}</span></Space> : null}><AccountVideoMetricTable rows={selectedMetricRows} loading={metricLoading} contentType={selectedContentType} contentTitle={contentTitle(selectedContent)} /></Card>
            <Card type="inner" className="mt12" title={`${contentTypeLabelMap[selectedContentType]}数据页上传`}>
              {selectedTopic ? <Row gutter={[16, 16]}><Col xs={24} lg={8}><Card size="small" title="当前上传目标" extra={<Tag color={selectedContent ? 'green' : 'gold'}>{selectedContent ? '已选中内容' : '待选择内容'}</Tag>}><Statistic title="当前标题" value={contentTitle(selectedContent) || '请先新增/选择内容'} /><Upload showUploadList={false} beforeUpload={file => { uploadContentPageAndUnlock(selectedTopic, file); return false; }}><Button block className="mt12" disabled={!accountConfirmed} loading={uploadingContentPage} icon={<CloudUploadOutlined />}>新增内容：上传图文/视频页面识别</Button></Upload><Button block className="mt12" disabled={!accountConfirmed} onClick={() => openConfirmContent(selectedTopic)}>手动新增内容</Button></Card></Col><Col xs={24} lg={16}><Space direction="vertical" size={16} style={{ width: '100%' }}>{dataGroups.map(group => { const groupAssets = dataAssets.filter(asset => assetGroup(asset) === group.key && selectedContent?.id && assetContentId(asset) === selectedContent.id); const latest = [...groupAssets].sort((a, b) => Number(b.id) - Number(a.id))[0]; return <Card key={group.key} size="small" title={group.title} extra={assetExtra(latest)}><div style={{ marginBottom: 8, color: '#8c8c8c' }}>{group.desc}</div>{preview(latest)}<Upload showUploadList={false} beforeUpload={file => { uploadDataPage(group.key, file); return false; }}><Button className="mt12" icon={<CloudUploadOutlined />} disabled={!selectedContent?.id} loading={uploadingData}>上传到当前内容：{group.title}</Button></Upload></Card>; })}</Space></Col></Row> : <Empty description="请选择一个平台子主题" />}
            </Card>
          </>}
        </Card>
      </Col>
    </Row>
    <Modal title="创建主题包" open={packageOpen} onCancel={() => setPackageOpen(false)} onOk={createPackage} confirmLoading={packageSubmitting} destroyOnClose><Form form={packageForm} layout="vertical" initialValues={{ topicDate: today }}><Form.Item name="topicDate" label="主题日期" rules={[{ required: true, message: '请选择日期' }]}><Input placeholder="YYYY-MM-DD" /></Form.Item><Form.Item name="operatorUserIds" label="运营人员" rules={[{ required: true, message: '请选择运营人员' }]}><Select mode="multiple" options={userOptions(operatorUsers)} /></Form.Item><Form.Item name="mediaUserIds" label="媒体人员" rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode="multiple" options={userOptions(mediaUsers)} /></Form.Item></Form></Modal>
    <Modal title="创建平台子主题" open={topicOpen} onCancel={() => setTopicOpen(false)} onOk={createPlatformTopic} confirmLoading={topicSubmitting} destroyOnClose><Form form={topicForm} layout="vertical"><Form.Item name="platformCode" label="平台" rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item><Form.Item name="subTopicName" label="子主题名称"><Input placeholder="例如：抖音账号主页" /></Form.Item></Form></Modal>
    <Modal title={editingContentId ? '编辑内容' : '新增图文/视频内容'} open={contentOpen} onCancel={() => { setContentOpen(false); setEditingContentId(undefined); }} onOk={confirmContent} confirmLoading={contentSubmitting} destroyOnClose width={720}><Form form={contentForm} layout="vertical"><Alert type="info" showIcon message="每次新增都会成为该账号下独立的一条图文/视频内容；选中内容后再上传数据页1/2/3。" style={{ marginBottom: 16 }} /><Form.Item name="contentType" label="内容类型" rules={[{ required: true, message: '请选择图文或视频' }]}><Radio.Group optionType="button" buttonStyle="solid" size="large">{contentTypeOptions.map(item => <Radio.Button key={item.value} value={item.value}>{item.label}</Radio.Button>)}</Radio.Group></Form.Item><Form.Item name="contentTitle" label="内容标题" rules={[{ required: true, message: '请确认标题' }]}><Input.TextArea rows={3} placeholder="OCR识别后可人工修正" /></Form.Item><Form.Item name="contentDate" label="内容日期"><Input placeholder="YYYY-MM-DD" /></Form.Item><Form.Item name="contentSummary" label="识别说明/备注"><Input.TextArea rows={3} /></Form.Item></Form></Modal>
  </>;
}
