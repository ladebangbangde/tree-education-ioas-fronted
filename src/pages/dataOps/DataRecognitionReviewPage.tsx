import { Button, Card, Col, Descriptions, Drawer, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Upload, message } from 'antd';
import { CloudUploadOutlined, EyeOutlined, ReloadOutlined, ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import {
  dataRecognitionApi,
  type RecognitionContentType,
  type RecognitionPlatform,
  type RecognitionRecordDetail,
  type RecognitionRecordSummary,
  type RecognitionStatus
} from '@/api/dataRecognition';

const platformOptions: { label: string; value: RecognitionPlatform }[] = [
  { label: '抖音', value: 'DOUYIN' },
  { label: '小红书', value: 'XIAOHONGSHU' },
  { label: '视频号', value: 'WECHAT_CHANNEL' },
  { label: '未知', value: 'UNKNOWN' }
];

const contentTypeOptions: { label: string; value: RecognitionContentType }[] = [
  { label: '自动判断', value: 'AUTO' },
  { label: '图文/笔记', value: 'IMAGE_TEXT' },
  { label: '视频', value: 'VIDEO' },
  { label: '账号主页', value: 'ACCOUNT_OVERVIEW' }
];

const statusOptions: { label: string; value: RecognitionStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '待校验', value: 'PENDING_REVIEW' },
  { label: '已确认', value: 'CONFIRMED' },
  { label: '已驳回', value: 'REJECTED' }
];

const platformLabel: Record<string, string> = { DOUYIN: '抖音', XIAOHONGSHU: '小红书', WECHAT_CHANNEL: '视频号', UNKNOWN: '未知' };
const contentTypeLabel: Record<string, string> = { AUTO: '自动', IMAGE_TEXT: '图文', VIDEO: '视频', ACCOUNT_OVERVIEW: '账号主页', UNKNOWN: '未知' };
const statusLabel: Record<string, string> = { PENDING_REVIEW: '待校验', CONFIRMED: '已确认', REJECTED: '已驳回' };
const statusColor: Record<string, string> = { PENDING_REVIEW: 'gold', CONFIRMED: 'green', REJECTED: 'red' };

function safeJson(value: any) {
  if (value === undefined || value === null || value === '') return '{}';
  try { return JSON.stringify(value, null, 2); } catch { return '{}'; }
}

function parseJson(text?: string) {
  if (!text || !text.trim()) return undefined;
  return JSON.parse(text);
}

function metricEntries(detail?: RecognitionRecordDetail) {
  const kv = detail?.keyValueMetrics || {};
  if (Object.keys(kv).length) return Object.entries(kv).map(([key, value]) => ({ key, value }));
  const stats = detail?.contentType === 'VIDEO' ? detail?.videoStats : detail?.imageTextStats;
  return Object.entries(stats || {}).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => ({ key, value }));
}

export default function DataRecognitionReviewPage() {
  const [uploadForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState<RecognitionRecordSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string>('PENDING_REVIEW');
  const [contentType, setContentType] = useState<string>('');
  const [detail, setDetail] = useState<RecognitionRecordDetail>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const stats = useMemo(() => ({
    pending: records.filter(row => row.status === 'PENDING_REVIEW').length,
    confirmed: records.filter(row => row.status === 'CONFIRMED').length,
    rejected: records.filter(row => row.status === 'REJECTED').length,
    video: records.filter(row => row.contentType === 'VIDEO').length
  }), [records]);

  const loadRecords = async (nextPage = pageNum, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const page = await dataRecognitionApi.list({
        status: status || undefined,
        contentType: contentType || undefined,
        pageNum: nextPage,
        pageSize: nextPageSize
      });
      setRecords(page.records || []);
      setTotal(page.total || 0);
      setPageNum(nextPage);
      setPageSize(nextPageSize);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(1, pageSize).catch(() => undefined); }, [status, contentType]);

  const uploadAndRecognize = async (file: File) => {
    const values = uploadForm.getFieldsValue();
    setUploading(true);
    try {
      const result = await dataRecognitionApi.recognizeAndSave(file, {
        platform: values.platform || 'DOUYIN',
        scene: 'CONTENT_DETAIL',
        contentType: values.contentType || 'AUTO'
      });
      message.success(`识别完成，已进入人工校验队列 #${result.recordId}`);
      await loadRecords(1, pageSize);
      await openDetail(result.recordId);
    } finally {
      setUploading(false);
    }
  };

  const openDetail = async (id: number) => {
    const row = await dataRecognitionApi.detail(id);
    setDetail(row);
    reviewForm.setFieldsValue({
      correctedResult: safeJson(row.correctedResult || row.result || row.videoStats || row.imageTextStats),
      reviewRemark: row.reviewRemark || '',
      reviewedBy: localStorage.getItem('userName') || 'operator'
    });
    setDetailOpen(true);
  };

  const confirm = async () => {
    if (!detail?.id) return;
    setReviewing(true);
    try {
      const values = await reviewForm.validateFields();
      const correctedResult = parseJson(values.correctedResult);
      await dataRecognitionApi.confirm(detail.id, {
        correctedResult,
        reviewRemark: values.reviewRemark,
        reviewedBy: values.reviewedBy
      });
      message.success('识别结果已确认');
      setDetailOpen(false);
      await loadRecords(pageNum, pageSize);
    } catch (error: any) {
      if (error?.message?.includes('JSON')) message.error('修正结果不是合法 JSON');
      throw error;
    } finally {
      setReviewing(false);
    }
  };

  const reject = async () => {
    if (!detail?.id) return;
    const values = reviewForm.getFieldsValue();
    setReviewing(true);
    try {
      await dataRecognitionApi.reject(detail.id, {
        reviewRemark: values.reviewRemark || '识别结果不准确，已驳回',
        reviewedBy: values.reviewedBy || localStorage.getItem('userName') || 'operator'
      });
      message.success('识别结果已驳回');
      setDetailOpen(false);
      await loadRecords(pageNum, pageSize);
    } finally {
      setReviewing(false);
    }
  };

  return <>
    <PageHeader title="AI识别校验" extra={<Space><Button icon={<ReloadOutlined />} onClick={() => loadRecords()}>刷新</Button></Space>} />

    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前页待校验" value={stats.pending} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前页已确认" value={stats.confirmed} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前页已驳回" value={stats.rejected} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前页视频截图" value={stats.video} /></Card></Col>
    </Row>

    <Card className="mt12" title="上传运营截图识别" extra={<Tag color="blue">图文 / 视频分流识别</Tag>}>
      <Form form={uploadForm} layout="inline" initialValues={{ platform: 'DOUYIN', contentType: 'AUTO' }}>
        <Form.Item name="platform" label="平台"><Select style={{ width: 140 }} options={platformOptions} /></Form.Item>
        <Form.Item name="contentType" label="内容类型"><Select style={{ width: 160 }} options={contentTypeOptions} /></Form.Item>
        <Form.Item>
          <Upload showUploadList={false} beforeUpload={file => { uploadAndRecognize(file); return false; }}>
            <Button type="primary" loading={uploading} icon={<CloudUploadOutlined />}>上传截图并识别</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Card>

    <Card className="mt12" title="人工校验队列" extra={<Space>
      <Select style={{ width: 130 }} value={status} options={statusOptions} onChange={value => setStatus(value)} />
      <Select style={{ width: 130 }} value={contentType} onChange={value => setContentType(value)} options={[{ label: '全部类型', value: '' }, { label: '图文', value: 'IMAGE_TEXT' }, { label: '视频', value: 'VIDEO' }, { label: '账号主页', value: 'ACCOUNT_OVERVIEW' }]} />
    </Space>}>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={records}
        pagination={{ current: pageNum, pageSize, total, showSizeChanger: true, onChange: loadRecords }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '平台', dataIndex: 'platform', width: 100, render: value => platformLabel[value] || value },
          { title: '类型', dataIndex: 'contentType', width: 110, render: value => <Tag color={value === 'VIDEO' ? 'purple' : value === 'IMAGE_TEXT' ? 'blue' : 'default'}>{contentTypeLabel[value] || value}</Tag> },
          { title: '状态', dataIndex: 'status', width: 110, render: value => <Tag color={statusColor[value] || 'default'}>{statusLabel[value] || value}</Tag> },
          { title: '账号', dataIndex: 'accountName', width: 160, render: value => value || '-' },
          { title: '标题', dataIndex: 'contentTitle', ellipsis: true, render: value => value || '-' },
          { title: '置信度', dataIndex: 'confidence', width: 100, render: value => value ? Number(value).toFixed(2) : '-' },
          { title: '创建时间', dataIndex: 'createdAt', width: 170, render: value => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-' },
          { title: '操作', width: 120, render: (_, row) => <Button icon={<EyeOutlined />} onClick={() => openDetail(row.id)}>查看校验</Button> }
        ]}
      />
    </Card>

    <Drawer title={detail ? `识别记录 #${detail.id}` : '识别详情'} width={860} open={detailOpen} onClose={() => setDetailOpen(false)} extra={<Space>
      <Button danger loading={reviewing} onClick={reject}>驳回</Button>
      <Button type="primary" loading={reviewing} onClick={confirm}>确认入库</Button>
    </Space>}>
      {detail ? <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="平台">{platformLabel[detail.platform || ''] || detail.platform}</Descriptions.Item>
          <Descriptions.Item label="类型">{contentTypeLabel[detail.contentType || ''] || detail.contentType}</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color={statusColor[detail.status || ''] || 'default'}>{statusLabel[detail.status || ''] || detail.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="置信度">{detail.confidence ? Number(detail.confidence).toFixed(4) : '-'}</Descriptions.Item>
          <Descriptions.Item label="账号">{detail.accountName || '-'}</Descriptions.Item>
          <Descriptions.Item label="账号ID">{detail.accountId || '-'}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>{detail.contentTitle || '-'}</Descriptions.Item>
        </Descriptions>

        <Card size="small" title="识别指标">
          <Row gutter={[12, 12]}>{metricEntries(detail).map(item => <Col xs={24} sm={12} md={8} key={item.key}><Card size="small"><Statistic title={item.key} value={String(item.value)} /></Card></Col>)}</Row>
        </Card>

        <Card size="small" title="人工修正 JSON">
          <Form form={reviewForm} layout="vertical">
            <Form.Item name="correctedResult" label="修正后的最终结果"><Input.TextArea rows={12} /></Form.Item>
            <Row gutter={12}>
              <Col xs={24} md={12}><Form.Item name="reviewedBy" label="校验人"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="reviewRemark" label="备注"><Input /></Form.Item></Col>
            </Row>
          </Form>
        </Card>

        <Card size="small" title="OCR 原文"><Input.TextArea rows={8} value={detail.rawText || ''} readOnly /></Card>
      </Space> : null}
    </Drawer>
  </>;
}
