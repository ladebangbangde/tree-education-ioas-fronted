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
  { label: '图文', value: 'IMAGE_TEXT', desc: '该账号只上传图文作品；数据页按图文指标识别。' },
  { label: '视频', value: 'VIDEO', desc: '该账号只上传视频作品；数据页按视频指标识别。' }
];

const dataGroups: { key: DataOpsAssetGroup; title: string; desc: string }[] = [
  { key: 'DOUYIN_OVERVIEW', title: '数据页1 · 总览指标', desc: '播放量、点赞量、评论量、分享量、收藏量、完播率、划走率' },
  { key: 'DOUYIN_OVERVIEW_CHART', title: '数据页2 · 趋势/粉丝图表', desc: '趋势曲线、涨粉量、脱粉量、粉丝播放占比、小时/每日图表' },
  { key: 'DOUYIN_FLOW_ANALYSIS', title: '数据页3 · 流量分析', desc: '流量上涨、封面点击率、评论率、分享率、完播率、5s完播率' }
];

const platformLabelMap: Record<string, string> = { DOUYIN: '抖音', XIAOHONGSHU: '小红书', WECHAT_CHANNEL: '视频号' };
const platformIdLabelMap: Record<string, string> = { DOUYIN: '抖音号', XIAOHONGSHU: '小红书号', WECHAT_CHANNEL: '视频号' };
const contentTypeLabelMap: Record<DataOpsContentType, string> = { IMAGE_TEXT: '图文', VIDEO: '视频' };
const contentTypeColorMap: Record<DataOpsContentType, string> = { IMAGE_TEXT: 'blue', VIDEO: 'purple' };

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
function metricStatusFromRows(rows: DataOpsMetricRow[]): DataOpsTopicRecognitionStatus | undefined {
  if (!rows.length) return undefined;
  const total = rows.length;
  const success = rows.filter(row => String(row.recognitionStatus).toUpperCase() === 'SUCCESS').length;
  const failed = rows.filter(row => String(row.recognitionStatus).toUpperCase() === 'FAILED').length;
  const missing = rows.filter(row => row.metricValue == null && row.metricNumeric == null).length;
  if (success === total && missing === 0) return { status: 'DATA_SUCCESS', label: '已完成', color: 'green', total, success, failed, missing };
  if (success > 0) return { status: 'DATA_PARTIAL', label: '部分完成', color: 'orange', total, success, failed, missing };
  if (failed > 0) return { status: 'DATA_FAILED', label: '识别失败', color: 'red', total, success, failed, missing };
  return { status: 'DATA_PENDING', label: '待识别', color: 'gold', total, success, failed, missing };
}

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [loading, setLoading] = useState(false);
  const [metricLoading, setMetricLoading] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [topicSubmitting, setTopicSubmitting] = useState(false);
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [accountConfirming, setAccountConfirming] = useState(false);
  const [contentTypeChanging, setContentTypeChanging] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [uploadingAccount, setUploadingAccount] = useState(false);
  const [uploadingContentPage, setUploadingContentPage] = useState(false);
  const [uploadingData, setUploadingData] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<number>();
  const [deletingContentId, setDeletingContentId] = useState<number>();
  const [deletingTopicId, setDeletingTopicId] = useState<number>();
  const [deletingPackageId, setDeletingPackageId] = useState<number>();
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
  const [typeChangeOpen, setTypeChangeOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<DataOpsPlatformTopic>();
  const [packageForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  const [contentForm] = Form.useForm();
  const [accountForm] = Form.useForm();
  const [typeChangeForm] = Form.useForm();

  const loadPackages = async () => {
    setLoading(true);
    try {
      const rows = await dataOpsApi.packages({ date: today });
      const hydrated = await Promise.all((rows || []).map(async row => {
        try { return await dataOpsApi.packageDetail(row.id); } catch { return row; }
      }));
      setPackages(hydrated);
      setSelectedPackage(current => (current?.id ? hydrated.find(item => item.id === current.id) || hydrated[0] : hydrated[0]));
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
      .then(([o, m]) => { setOperatorUsers(o || []); setMediaUsers(m || []); })
      .catch(() => undefined);
  }, []);

  const platformTopics = selectedPackage?.platformTopics || [];
  const contents = selectedPackage?.contents || [];
  const assets = selectedPackage?.assets || [];
  const selectedPlatformTopics = useMemo(() => platformTopics.filter(topic => topicPlatform(topic) === selectedPlatform), [platformTopics, selectedPlatform]);
  const selectedTopic = useMemo(() => selectedPlatformTopics.find(topic => topic.id === selectedTopicId), [selectedPlatformTopics, selectedTopicId]);
  const accountConfirmed = topicAccountConfirmed(selectedTopic);
  const accountLockedType = accountConfirmed ? (topicContentType(selectedTopic) || selectedContentType) : undefined;
  const effectiveContentType: DataOpsContentType = accountLockedType || selectedContentType;
  const accountContents = useMemo(() => selectedTopicId ? [...contents.filter(content => contentTopicId(content) === selectedTopicId)].sort((a, b) => Number(b.id) - Number(a.id)) : [], [contents, selectedTopicId]);
  const activeContents = useMemo(() => accountContents.filter(content => contentContentType(content) === effectiveContentType), [accountContents, effectiveContentType]);
  const selectedContent = useMemo(() => activeContents.find(content => content.id === selectedContentId) || activeContents[0], [activeContents, selectedContentId]);
  const selectedTopicAssets = useMemo(() => selectedTopicId ? assets.filter(asset => Number(assetTopicId(asset)) === selectedTopicId) : [], [assets, selectedTopicId]);
  const accountProfileAsset = selectedTopicAssets.find(asset => assetType(asset) === 'COVER');
  const dataAssets = selectedTopicAssets.filter(asset => assetType(asset) === 'DATA_SCREENSHOT');
  const selectedMetricRows = useMemo(() => {
    if (!selectedContent?.id) return [];
    const videoId = contentVideoId(selectedContent);
    return topicMetrics.filter(row => Number(row.contentId || 0) === selectedContent.id || (videoId ? Number(row.videoId || 0) === Number(videoId) : false));
  }, [topicMetrics, selectedContent]);
  const selectedMetricStatus = metricStatusFromRows(selectedMetricRows) || topicMetricStatus;
  const selectedStatus = metricStatusView(selectedMetricStatus);

  useEffect(() => { refreshTopicMetrics(selectedTopicId).catch(() => undefined); }, [selectedTopicId]);
  useEffect(() => {
    if (!selectedPlatformTopics.length) {
      setSelectedTopicId(undefined);
      setSelectedContentId(undefined);
      return;
    }
    if (!selectedTopicId || !selectedPlatformTopics.some(topic => topic.id === selectedTopicId)) setSelectedTopicId(selectedPlatformTopics[0].id);
  }, [selectedPlatformTopics, selectedTopicId]);
  useEffect(() => { if (accountLockedType) setSelectedContentType(accountLockedType); }, [accountLockedType]);
  useEffect(() => {
    if (!activeContents.length) {
      setSelectedContentId(undefined);
      return;
    }
    if (!selectedContentId || !activeContents.some(content => content.id === selectedContentId)) setSelectedContentId(activeContents[0].id);
  }, [activeContents, selectedContentId]);
  useEffect(() => {
    accountForm.setFieldsValue({ accountName: topicAccountName(selectedTopic), platformUserId: topicPlatformUserId(selectedTopic), contentType: topicContentType(selectedTopic) || selectedContentType });
  }, [selectedTopicId, selectedTopic, selectedContentType, accountForm]);

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
      const v = await packageForm.validateFields();
      const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number) });
      setPackages(rows => mergePackage(rows, created));
      setSelectedPackage(created);
      setPackageOpen(false);
      packageForm.resetFields();
      message.success('主题包已创建');
    } finally {
      setPackageSubmitting(false);
    }
  };

  const createPlatformTopic = async () => {
    if (!selectedPackage?.id) return;
    setTopicSubmitting(true);
    try {
      const v = await topicForm.validateFields();
      await dataOpsApi.createPlatformTopic(selectedPackage.id, { platformCode: v.platformCode, subTopicName: v.subTopicName });
      message.success('平台子主题已创建，请上传账号主页并确认账号类型');
      setTopicOpen(false);
      topicForm.resetFields();
      await refreshPackageDetail();
    } finally {
      setTopicSubmitting(false);
    }
  };

  const openTopicModal = (platform: PlatformCode) => {
    topicForm.setFieldsValue({ platformCode: platform });
    setSelectedPlatform(platform);
    setTopicOpen(true);
  };

  const openConfirmContent = (topic: DataOpsPlatformTopic, content?: DataOpsContent) => {
    if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号和账号内容类型');
    const lockedType = topicContentType(topic) || effectiveContentType;
    if (content && contentContentType(content) !== lockedType) return message.warning(`该账号当前锁定为${contentTypeLabelMap[lockedType]}，请先手动更改账号内容类型`);
    setSelectedContentType(lockedType);
    setEditingContentId(contentId(content));
    setActiveTopic(topic);
    setSelectedTopicId(topic.id);
    contentForm.setFieldsValue({ contentTitle: contentTitle(content) || '', contentType: lockedType, contentDate: today, contentSummary: pick<string>(content, 'content_summary', 'contentSummary') || '' });
    setContentOpen(true);
  };

  const confirmContent = async () => {
    if (!activeTopic?.id) return;
    const lockedType = topicContentType(activeTopic) || effectiveContentType;
    setContentSubmitting(true);
    try {
      const v = await contentForm.validateFields();
      const payload = { contentId: editingContentId, contentTitle: v.contentTitle, contentSummary: v.contentSummary, contentDate: v.contentDate || today, contentType: lockedType } as any;
      const created = await dataOpsApi.confirmContent(activeTopic.id, payload);
      const finalTitle = contentTitle(created) || cleanDisplayText(v.contentTitle);
      const normalized = normalizeConfirmedContent(created, activeTopic.id, lockedType, finalTitle);
      const basePackage = selectedPackage?.id ? await dataOpsApi.packageDetail(selectedPackage.id) : selectedPackage;
      const patchedPackage = basePackage ? { ...basePackage, contents: [normalized, ...(basePackage.contents || []).filter(row => row.id !== normalized.id)] } : undefined;
      if (patchedPackage) { setSelectedPackage(patchedPackage); setPackages(rows => mergePackage(rows, patchedPackage)); }
      setSelectedContentType(lockedType);
      setSelectedContentId(normalized.id);
      setEditingContentId(undefined);
      message.success(editingContentId ? '内容已更新' : `${contentTypeLabelMap[lockedType]}内容已新增，数据页上传已解锁`);
      setContentOpen(false);
      await refreshPackageDetail();
      await refreshTopicMetrics(activeTopic.id);
    } finally {
      setContentSubmitting(false);
    }
  };

  const uploadAccountProfile = async (topic: DataOpsPlatformTopic, file: File) => {
    setUploadingAccount(true);
    setSelectedTopicId(topic.id);
    try {
      const updated = await dataOpsApi.uploadCover(topic.id, file);
      const assetId = topicCoverAssetId(updated) || topicCoverAssetId(topic);
      if (assetId) await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(topic), scene: 'ACCOUNT_OVERVIEW' });
      message.success('账号主页识别完成，请确认账号名称、账号ID和账号类型');
      await refreshPackageDetail();
      await refreshTopicMetrics(topic.id);
    } finally {
      setUploadingAccount(false);
    }
  };

  const confirmAccount = async () => {
    if (!selectedTopic?.id) return;
    const v = await accountForm.validateFields();
    const contentType: DataOpsContentType = v.contentType || 'IMAGE_TEXT';
    setAccountConfirming(true);
    try {
      await dataOpsApi.confirmAccount(selectedTopic.id, { accountName: v.accountName, platformUserId: v.platformUserId, contentType });
      setSelectedContentType(contentType);
      message.success(`账号已确认，后续只能上传${contentTypeLabelMap[contentType]}内容`);
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopic.id);
    } finally {
      setAccountConfirming(false);
    }
  };

  const changeAccountContentType = async () => {
    if (!selectedTopic?.id) return;
    const v = await typeChangeForm.validateFields();
    const contentType: DataOpsContentType = v.contentType;
    setContentTypeChanging(true);
    try {
      await dataOpsApi.updateTopicContentType(selectedTopic.id, { contentType });
      setSelectedContentType(contentType);
      setSelectedContentId(undefined);
      setTypeChangeOpen(false);
      message.success(`账号内容类型已切换为${contentTypeLabelMap[contentType]}，后续上传将按该类型处理`);
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopic.id);
    } finally {
      setContentTypeChanging(false);
    }
  };

  const openTypeChangeModal = () => {
    typeChangeForm.setFieldsValue({ contentType: effectiveContentType });
    setTypeChangeOpen(true);
  };

  const uploadContentPageAndUnlock = async (topic: DataOpsPlatformTopic, file: File) => {
    if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号和账号内容类型');
    const lockedType = topicContentType(topic) || effectiveContentType;
    const platform = topicPlatform(topic) || selectedPlatform;
    setUploadingContentPage(true);
    setSelectedTopicId(topic.id);
    try {
      const recognition: any = await dataRecognitionApi.recognize(file, { platform, scene: 'CONTENT_DETAIL', contentType: lockedType as any });
      const detected = normalizeDetectedContentType(recognition.contentType || recognition.result?.contentType);
      const title = recognition.result?.contentTitle || recognition.result?.candidateTitles?.[0] || `${contentTypeLabelMap[lockedType]}内容-${dayjs().format('HHmmss')}`;
      setSelectedContentType(lockedType);
      setEditingContentId(undefined);
      setActiveTopic(topic);
      contentForm.setFieldsValue({ contentTitle: title, contentType: lockedType, contentDate: today, contentSummary: `账号已锁定为：${contentTypeLabelMap[lockedType]}；AI识别建议：${detected ? contentTypeLabelMap[detected] : '未识别'}；requestId=${recognition.requestId || ''}` });
      setContentOpen(true);
      message.success(`该账号已锁定为${contentTypeLabelMap[lockedType]}，确认后会新增到当前账号内容列表`);
    } finally {
      setUploadingContentPage(false);
    }
  };

  const uploadDataPage = async (group: DataOpsAssetGroup, file: File) => {
    if (!accountConfirmed) return message.warning('请先确认账号');
    if (!selectedContent?.id || !selectedTopicId) return message.warning('请先新增并选择一个内容，再上传数据页');
    setUploadingData(true);
    try {
      const uploaded = await dataOpsApi.uploadScreenshots(selectedContent.id, [file], group);
      const uploadedAssets = (uploaded.assets || []).map(asset => ({ ...asset, asset_group: group, assetGroup: group }));
      await Promise.all(uploadedAssets.map(asset => dataOpsApi.recognizeAsset(asset.id, { platform: selectedPlatform, scene: sceneFromAssetGroup(group) })));
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopicId);
      message.success('数据页已上传并识别到当前选中内容');
    } finally {
      setUploadingData(false);
    }
  };

  const generateCurrentTopicData = async (topic: DataOpsPlatformTopic) => {
    if (!topicAccountConfirmed(topic)) return message.warning('请先确认账号');
    setUploadingAccount(true);
    try {
      const result = await dataOpsApi.generateCurrentTopicData(topic.id);
      if (result.package) {
        setSelectedPackage(result.package);
        setPackages(rows => mergePackage(rows, result.package!));
      } else await refreshPackageDetail();
      await refreshTopicMetrics(topic.id);
      message.success('当前主题识别任务已处理');
    } finally {
      setUploadingAccount(false);
    }
  };

  const deleteAsset = async (asset?: DataOpsAsset) => {
    if (!asset?.id) return;
    setDeletingAssetId(asset.id);
    try {
      await dataOpsApi.deleteAsset(asset.id);
      message.success('图片和 MinIO 真实文件已删除');
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopicId);
    } finally {
      setDeletingAssetId(undefined);
    }
  };

  const deleteContent = async (content?: DataOpsContent) => {
    if (!content?.id) return;
    setDeletingContentId(content.id);
    try {
      await dataOpsApi.deleteContent(content.id);
      if (selectedContentId === content.id) setSelectedContentId(undefined);
      message.success('内容、数据页、指标和 MinIO 真实文件已删除');
      await refreshPackageDetail();
      await refreshTopicMetrics(selectedTopicId);
    } finally {
      setDeletingContentId(undefined);
    }
  };

  const deletePlatformTopic = async (topic?: DataOpsPlatformTopic) => {
    if (!topic?.id) return;
    setDeletingTopicId(topic.id);
    try {
      await dataOpsApi.deletePlatformTopic(topic.id);
      if (selectedTopicId === topic.id) {
        setSelectedTopicId(undefined);
        setSelectedContentId(undefined);
        setTopicMetrics([]);
        setTopicMetricStatus(undefined);
      }
      message.success('账号/子主题、内容、数据页、指标和 MinIO 真实文件已删除');
      await refreshPackageDetail();
    } finally {
      setDeletingTopicId(undefined);
    }
  };

  const deletePackage = async () => {
    if (!selectedPackage?.id) return;
    setDeletingPackageId(selectedPackage.id);
    try {
      await dataOpsApi.deletePackage(selectedPackage.id);
      setSelectedPackage(undefined);
      setSelectedTopicId(undefined);
      setSelectedContentId(undefined);
      setTopicMetrics([]);
      setTopicMetricStatus(undefined);
      message.success('主题包及其所有 MinIO 真实文件已删除');
      await loadPackages();
    } finally {
      setDeletingPackageId(undefined);
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

  const recognizeAccountProfile = async (row: DataOpsPlatformTopic) => {
    const assetId = topicCoverAssetId(row);
    if (!assetId) return;
    await dataOpsApi.recognizeAsset(assetId, { platform: topicPlatform(row), scene: 'ACCOUNT_OVERVIEW' });
    await refreshPackageDetail();
    await refreshTopicMetrics(row.id);
  };

  const handleTreeSelect = (keys: Key[]) => {
    const key = String(keys?.[0] || '');
    if (key.startsWith('platform-')) {
      const [, packageId, platform] = key.split('-');
      const pkg = packages.find(item => item.id === Number(packageId));
      if (pkg) setSelectedPackage(pkg);
      setSelectedPlatform(platform as PlatformCode);
      setSelectedTopicId(undefined);
      setSelectedContentId(undefined);
    }
    if (key.startsWith('package-')) {
      const pkg = packages.find(item => item.id === Number(key.replace('package-', '')));
      if (pkg) setSelectedPackage(pkg);
      setSelectedTopicId(undefined);
      setSelectedContentId(undefined);
    }
  };

  const preview = (asset?: DataOpsAsset) => asset ? <Image src={toPreviewUrl(assetUrl(asset))} width="100%" height={130} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传" />;
  const hardDeleteTitle = '此操作会同时删除数据库记录和 MinIO 中的真实文件，删除后不可恢复。';
  const assetExtra = (asset?: DataOpsAsset) => asset ? <Space><Tag color={statusColor(assetStatus(asset))}>{assetStatus(asset)}</Tag><Popconfirm title="删除这张图片？" description={hardDeleteTitle} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => deleteAsset(asset)}><Button danger size="small" type="text" icon={<DeleteOutlined />} loading={deletingAssetId === asset.id} /></Popconfirm></Space> : <Tag>未上传</Tag>;

  const renderContentCard = (content: DataOpsContent) => {
    const active = selectedContent?.id === content.id;
    const type = contentContentType(content);
    return <Card
      key={content.id}
      size="small"
      hoverable
      onClick={() => { setSelectedContentId(content.id); setSelectedContentType(type); }}
      style={{ borderColor: active ? '#1677ff' : undefined, background: active ? 'rgba(22,119,255,0.08)' : undefined }}
      title={<Space><Tag color={contentTypeColorMap[type]}>{contentTypeLabelMap[type]}</Tag><span>{contentTitle(content) || `未命名内容 #${content.id}`}</span></Space>}
      extra={<Space onClick={event => event.stopPropagation()}>
        <Tag color={active ? 'processing' : 'default'}>{active ? '当前目标' : `#${content.id}`}</Tag>
        <Button size="small" type="link" onClick={() => selectedTopic && openConfirmContent(selectedTopic, content)}>编辑</Button>
        <Popconfirm title="删除这个内容？" description={hardDeleteTitle} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => deleteContent(content)}>
          <Button size="small" danger type="link" loading={deletingContentId === content.id}>删除</Button>
        </Popconfirm>
      </Space>}
    >
      <div style={{ color: '#8c8c8c' }}>{pick<string>(content, 'content_summary', 'contentSummary') || '暂无备注'}</div>
    </Card>;
  };

  const contentTypeSelector = <Card size="small" style={{ borderColor: accountConfirmed ? '#1677ff' : undefined }}>
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Alert type={accountConfirmed ? 'success' : 'warning'} showIcon message={accountConfirmed ? `账号已锁定为：${contentTypeLabelMap[effectiveContentType]}` : '请先确认账号属于图文还是视频'} description={accountConfirmed ? '后续内容上传只按该类型处理。需要切换时，点击“手动更改类型”。' : '确认后另一种类型会被锁住，避免同一个账号下图文和视频混用。'} />
      <Tag color={contentTypeColorMap[effectiveContentType]} style={{ width: 'fit-content' }}>{contentTypeLabelMap[effectiveContentType]}</Tag>
      <div style={{ color: '#8c8c8c' }}>{contentTypeOptions.find(item => item.value === effectiveContentType)?.desc}</div>
      <Button disabled={!accountConfirmed} onClick={openTypeChangeModal}>手动更改类型</Button>
    </Space>
  </Card>;

  return <>
    <PageHeader title="运营数据" extra={<Space>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>创建主题包</Button>
      <Button loading={reportGenerating} onClick={generateReport}>生成当日报告</Button>
      {selectedPackage ? <Popconfirm title="删除当前主题包？" description={hardDeleteTitle} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={deletePackage}>
        <Button danger icon={<DeleteOutlined />} loading={deletingPackageId === selectedPackage.id}>删除主题包</Button>
      </Popconfirm> : null}
    </Space>} />

    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前子主题" value={selectedPlatformTopics.length} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="账号确认" value={accountConfirmed ? '已确认' : '未确认'} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="账号类型" value={accountConfirmed ? contentTypeLabelMap[effectiveContentType] : '待确认'} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前类型内容" value={activeContents.length} /></Card></Col>
    </Row>

    <Row gutter={[16, 16]} className="mt12">
      <Col xs={24} lg={5}>
        <Card title="主题路径"><Tree showIcon defaultExpandAll selectedKeys={selectedPackage ? [`platform-${selectedPackage.id}-${selectedPlatform}`] : []} treeData={treeData} onSelect={handleTreeSelect} /></Card>
      </Col>
      <Col xs={24} lg={19}>
        <Card loading={loading} title={selectedPackage ? `${packageTitle(selectedPackage)} / ${platformLabelMap[selectedPlatform]}` : '主题包工作区'} extra={<Space><Tag color="blue">{platformLabelMap[selectedPlatform]}</Tag><Button icon={<PlusOutlined />} onClick={() => openTopicModal(selectedPlatform)}>创建平台子主题</Button></Space>}>
          {!selectedPackage ? <Empty description="请先创建或选择主题包" /> : <>
            <Table
              rowKey="id"
              pagination={{ pageSize: 5 }}
              dataSource={selectedPlatformTopics as any[]}
              onRow={(record: DataOpsPlatformTopic) => ({ onClick: () => { setSelectedTopicId(record.id); setSelectedContentId(undefined); } })}
              columns={[
                { title: '平台', width: 90, render: (_: any, row: any) => platformLabelMap[pick(row, 'platform_code', 'platformCode') || selectedPlatform] },
                { title: '子主题/账号入口', render: (_: any, row: any) => pick(row, 'sub_topic_name', 'subTopicName') },
                { title: '账号', render: (_: any, row: any) => pick(row, 'ocr_account_name', 'ocrAccountName') || '待识别' },
                { title: platformIdLabelMap[selectedPlatform], render: (_: any, row: any) => pick(row, 'ocr_platform_user_id', 'ocrPlatformUserId') || '待识别' },
                { title: '账号类型', render: (_: any, row: DataOpsPlatformTopic) => { const type = topicContentType(row); return topicAccountConfirmed(row) && type ? <Tag color={contentTypeColorMap[type]}>{contentTypeLabelMap[type]}</Tag> : <Tag color="gold">待确认</Tag>; } },
                { title: '账号确认', render: (_: any, row: DataOpsPlatformTopic) => <Tag color={topicAccountConfirmed(row) ? 'green' : 'gold'}>{topicAccountConfirmed(row) ? '已确认' : '待确认'}</Tag> },
                { title: '操作', width: 560, render: (_: any, row: DataOpsPlatformTopic) => <Space wrap onClick={event => event.stopPropagation()}>
                  <Upload showUploadList={false} beforeUpload={file => { uploadAccountProfile(row, file); return false; }}><Button loading={uploadingAccount && selectedTopicId === row.id} icon={<CloudUploadOutlined />}>上传账号主页</Button></Upload>
                  <Button icon={<ScanOutlined />} disabled={!topicCoverAssetId(row)} onClick={() => recognizeAccountProfile(row)}>识别账号</Button>
                  <Button onClick={() => { setSelectedTopicId(row.id); setSelectedContentId(undefined); accountForm.setFieldsValue({ accountName: topicAccountName(row), platformUserId: topicPlatformUserId(row), contentType: topicContentType(row) || 'IMAGE_TEXT' }); }}>确认账号/类型</Button>
                  {topicAccountConfirmed(row) ? <Button onClick={() => { setSelectedTopicId(row.id); typeChangeForm.setFieldsValue({ contentType: topicContentType(row) || 'IMAGE_TEXT' }); setTypeChangeOpen(true); }}>手动更改类型</Button> : null}
                  <Popconfirm title="删除这个账号/子主题？" description={hardDeleteTitle} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => deletePlatformTopic(row)}>
                    <Button danger icon={<DeleteOutlined />} loading={deletingTopicId === row.id}>删除账号</Button>
                  </Popconfirm>
                </Space> }
              ]}
            />

            <Card type="inner" className="mt12" title={selectedTopic ? `账号主页确认：${topicName(selectedTopic)}` : '账号主页确认'} extra={selectedTopic ? <Space><Tag color={accountConfirmed ? 'green' : 'gold'}>{accountConfirmed ? '账号已确认' : '必须先确认账号'}</Tag>{accountConfirmed ? <Tag color={contentTypeColorMap[effectiveContentType]}>{contentTypeLabelMap[effectiveContentType]}</Tag> : null}</Space> : null}>
              {selectedTopic ? <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}><Card size="small" title="账号主页截图" extra={assetExtra(accountProfileAsset)}>{preview(accountProfileAsset)}<Upload showUploadList={false} beforeUpload={file => { uploadAccountProfile(selectedTopic, file); return false; }}><Button block className="mt12" icon={<CloudUploadOutlined />} loading={uploadingAccount}>上传/替换账号主页</Button></Upload></Card></Col>
                <Col xs={24} lg={16}>
                  <Form form={accountForm} layout="vertical">
                    <Row gutter={12}>
                      <Col xs={24} md={12}><Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请确认账号名称' }]}><Input placeholder="OCR识别后可人工修正" /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name="platformUserId" label={platformIdLabelMap[selectedPlatform]} rules={[{ required: true, message: '请确认平台账号ID' }]}><Input placeholder="例如抖音号/视频号/小红书号" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="contentType" label="确认账号类型" rules={[{ required: true, message: '请选择图文或视频' }]}><Radio.Group optionType="button" buttonStyle="solid" size="large" disabled={accountConfirmed}>{contentTypeOptions.map(item => <Radio.Button key={item.value} value={item.value}>{item.label}</Radio.Button>)}</Radio.Group></Form.Item>
                    <Space><Button type="primary" loading={accountConfirming} onClick={confirmAccount}>{accountConfirmed ? '重新确认账号信息' : '确认账号和类型'}</Button>{accountConfirmed ? <Button onClick={openTypeChangeModal}>手动更改类型</Button> : null}</Space>
                  </Form>
                  <div style={{ marginTop: 12, color: accountConfirmed ? '#52c41a' : '#fa8c16' }}>{accountConfirmed ? `已确认：${topicAccountName(selectedTopic)} / ${topicPlatformUserId(selectedTopic)}，账号类型：${contentTypeLabelMap[effectiveContentType]}。` : '未确认前，内容页面上传、数据页上传全部禁止。确认后只允许上传对应类型内容。'}</div>
                </Col>
              </Row> : <Empty description="请选择一个平台子主题" />}
            </Card>

            <Card type="inner" className="mt12" title="账号下的内容" extra={<Space><Tag color={accountConfirmed ? 'green' : 'default'}>{accountConfirmed ? `账号：${topicAccountName(selectedTopic)}` : '先确认账号'}</Tag>{accountConfirmed ? <Tag color={contentTypeColorMap[effectiveContentType]}>{contentTypeLabelMap[effectiveContentType]}</Tag> : null}</Space>}>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>{contentTypeSelector}</Col>
                <Col xs={24} lg={16}>
                  <Space wrap>
                    <Upload showUploadList={false} beforeUpload={file => { selectedTopic && uploadContentPageAndUnlock(selectedTopic, file); return false; }}><Button type="primary" disabled={!accountConfirmed} loading={uploadingContentPage} icon={<CloudUploadOutlined />}>上传{contentTypeLabelMap[effectiveContentType]}页面识别并新增</Button></Upload>
                    <Button disabled={!accountConfirmed} onClick={() => selectedTopic && openConfirmContent(selectedTopic)}>手动新增{contentTypeLabelMap[effectiveContentType]}内容</Button>
                    <Button disabled={!selectedTopic || !selectedContent} onClick={() => selectedTopic && selectedContent && openConfirmContent(selectedTopic, selectedContent)}>编辑当前内容</Button>
                    {selectedContent ? <Popconfirm title="删除当前内容？" description={hardDeleteTitle} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => deleteContent(selectedContent)}><Button danger disabled={!selectedContent} loading={deletingContentId === selectedContent.id} icon={<DeleteOutlined />}>删除当前内容</Button></Popconfirm> : null}
                  </Space>
                  <div style={{ marginTop: 12, opacity: 0.72 }}>当前账号已锁定为{contentTypeLabelMap[effectiveContentType]}。点击某条内容后，下面数据页1/2/3会绑定到当前选中内容。</div>
                  <Card size="small" title={`${contentTypeLabelMap[effectiveContentType]}内容（${activeContents.length}）`} style={{ marginTop: 12 }}>{activeContents.length ? <Space direction="vertical" style={{ width: '100%' }}>{activeContents.map(renderContentCard)}</Space> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`暂无${contentTypeLabelMap[effectiveContentType]}内容`} />}</Card>
                </Col>
              </Row>
            </Card>

            <Card type="inner" className="mt12" title="账号 → 当前内容 → 数据表" extra={selectedMetricStatus ? <Space><Tag color={selectedStatus.color}>{selectedStatus.label}</Tag><span>成功 {selectedMetricStatus.success || 0}/{selectedMetricStatus.total || 0}</span></Space> : null}><AccountVideoMetricTable rows={selectedMetricRows} loading={metricLoading} contentType={effectiveContentType} contentTitle={contentTitle(selectedContent)} /></Card>

            <Card type="inner" className="mt12" title={`${contentTypeLabelMap[effectiveContentType]}数据页上传`}>
              {selectedTopic ? <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                  <Card size="small" title="当前上传目标" extra={<Tag color={selectedContent ? 'green' : 'gold'}>{selectedContent ? '已选中内容' : '待选择内容'}</Tag>}>
                    <Statistic title="当前标题" value={contentTitle(selectedContent) || '请先新增/选择内容'} />
                    <Upload showUploadList={false} beforeUpload={file => { uploadContentPageAndUnlock(selectedTopic, file); return false; }}><Button block className="mt12" disabled={!accountConfirmed} loading={uploadingContentPage} icon={<CloudUploadOutlined />}>新增{contentTypeLabelMap[effectiveContentType]}内容：上传页面识别</Button></Upload>
                    <Button block className="mt12" disabled={!accountConfirmed} onClick={() => openConfirmContent(selectedTopic)}>手动新增{contentTypeLabelMap[effectiveContentType]}内容</Button>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>{dataGroups.map(group => {
                    const groupAssets = dataAssets.filter(asset => assetGroup(asset) === group.key && selectedContent?.id && assetContentId(asset) === selectedContent.id);
                    const latest = [...groupAssets].sort((a, b) => Number(b.id) - Number(a.id))[0];
                    return <Card key={group.key} size="small" title={group.title} extra={assetExtra(latest)}><div style={{ marginBottom: 8, color: '#8c8c8c' }}>{group.desc}</div>{preview(latest)}<Upload showUploadList={false} beforeUpload={file => { uploadDataPage(group.key, file); return false; }}><Button className="mt12" icon={<CloudUploadOutlined />} disabled={!selectedContent?.id} loading={uploadingData}>上传到当前{contentTypeLabelMap[effectiveContentType]}内容：{group.title}</Button></Upload></Card>;
                  })}</Space>
                </Col>
              </Row> : <Empty description="请选择一个平台子主题" />}
            </Card>
          </>}
        </Card>
      </Col>
    </Row>

    <Modal title="创建主题包" open={packageOpen} onCancel={() => setPackageOpen(false)} onOk={createPackage} confirmLoading={packageSubmitting} destroyOnClose><Form form={packageForm} layout="vertical" initialValues={{ topicDate: today }}><Form.Item name="topicDate" label="主题日期" rules={[{ required: true, message: '请选择日期' }]}><Input placeholder="YYYY-MM-DD" /></Form.Item><Form.Item name="operatorUserIds" label="运营人员" rules={[{ required: true, message: '请选择运营人员' }]}><Select mode="multiple" options={userOptions(operatorUsers)} /></Form.Item><Form.Item name="mediaUserIds" label="媒体人员" rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode="multiple" options={userOptions(mediaUsers)} /></Form.Item></Form></Modal>
    <Modal title="创建平台子主题" open={topicOpen} onCancel={() => setTopicOpen(false)} onOk={createPlatformTopic} confirmLoading={topicSubmitting} destroyOnClose><Form form={topicForm} layout="vertical"><Form.Item name="platformCode" label="平台" rules={[{ required: true }]}><Select options={platformOptions} /></Form.Item><Form.Item name="subTopicName" label="子主题名称"><Input placeholder="例如：抖音账号主页" /></Form.Item></Form></Modal>
    <Modal title={editingContentId ? `编辑${contentTypeLabelMap[effectiveContentType]}内容` : `新增${contentTypeLabelMap[effectiveContentType]}内容`} open={contentOpen} onCancel={() => { setContentOpen(false); setEditingContentId(undefined); }} onOk={confirmContent} confirmLoading={contentSubmitting} destroyOnClose width={720}><Form form={contentForm} layout="vertical"><Alert type="info" showIcon message={`该账号已锁定为${contentTypeLabelMap[effectiveContentType]}，本次只能新增/编辑${contentTypeLabelMap[effectiveContentType]}内容。`} style={{ marginBottom: 16 }} /><Form.Item name="contentType" label="内容类型"><Radio.Group optionType="button" buttonStyle="solid" size="large" disabled>{contentTypeOptions.map(item => <Radio.Button key={item.value} value={item.value}>{item.label}</Radio.Button>)}</Radio.Group></Form.Item><Form.Item name="contentTitle" label="内容标题" rules={[{ required: true, message: '请确认标题' }]}><Input.TextArea rows={3} placeholder="OCR识别后可人工修正" /></Form.Item><Form.Item name="contentDate" label="内容日期"><Input placeholder="YYYY-MM-DD" /></Form.Item><Form.Item name="contentSummary" label="识别说明/备注"><Input.TextArea rows={3} /></Form.Item></Form></Modal>
    <Modal title="手动更改账号内容类型" open={typeChangeOpen} onCancel={() => setTypeChangeOpen(false)} onOk={changeAccountContentType} confirmLoading={contentTypeChanging} destroyOnClose><Alert type="warning" showIcon message="更改后，后续内容上传只按新类型处理；已有旧类型内容不会删除，但当前列表会只展示新类型内容。" style={{ marginBottom: 16 }} /><Form form={typeChangeForm} layout="vertical"><Form.Item name="contentType" label="账号内容类型" rules={[{ required: true, message: '请选择图文或视频' }]}><Radio.Group optionType="button" buttonStyle="solid" size="large">{contentTypeOptions.map(item => <Radio.Button key={item.value} value={item.value}>{item.label}</Radio.Button>)}</Radio.Group></Form.Item></Form></Modal>
  </>;
}
