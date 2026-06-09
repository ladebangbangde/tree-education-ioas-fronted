import { Button, Card, Empty, Input, Modal, Space, Table, Tag, Tooltip, message } from 'antd';
import { DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import client, { API_BASE_URL } from '@/api/client';
import type { DataOpsContentType, DataOpsMetricRow } from '@/api/dataOps';

const groupLabel: Record<string, string> = {
  OVERVIEW: '数据页1 · 总览指标',
  OVERVIEW_CHART: '数据页2 · 趋势/粉丝图表',
  FLOW_ANALYSIS: '数据页3 · 流量分析'
};

const groupOrder: Record<string, number> = {
  OVERVIEW: 1,
  OVERVIEW_CHART: 2,
  FLOW_ANALYSIS: 3
};

const contentTypeLabel: Record<string, string> = {
  IMAGE_TEXT: '图文',
  VIDEO: '视频'
};

function statusColor(status?: string) {
  const value = String(status || '').toUpperCase();
  if (value === 'SUCCESS') return 'green';
  if (value === 'FAILED') return 'red';
  if (value === 'PENDING') return 'gold';
  return 'default';
}

function todayText() {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function rowTime(row: DataOpsMetricRow) {
  return row.recognizedAt ? new Date(row.recognizedAt).getTime() : 0;
}

function isBetterMetricRow(next: DataOpsMetricRow, current?: DataOpsMetricRow) {
  if (!current) return true;
  const nextAsset = Number(next.assetId || 0);
  const currentAsset = Number(current.assetId || 0);
  if (nextAsset !== currentAsset) return nextAsset > currentAsset;
  const nextTime = rowTime(next);
  const currentTime = rowTime(current);
  if (nextTime !== currentTime) return nextTime > currentTime;
  if (String(next.recognitionStatus).toUpperCase() === 'SUCCESS' && String(current.recognitionStatus).toUpperCase() !== 'SUCCESS') return true;
  return Number(next.id || 0) > Number(current.id || 0);
}

function betterTitle(current: string | undefined, next?: string | null) {
  const text = String(next || '').trim();
  if (!text || text.toLowerCase() === 'null') return current || '当前已确认内容';
  if (!current || current === '当前已确认内容' || current === '未归属内容') return text;
  return current;
}

function buildGroups(rows: DataOpsMetricRow[], confirmedContentType?: DataOpsContentType, confirmedTitle?: string) {
  const accounts = new Map<string, any>();
  rows.forEach(row => {
    const accountKey = String(row.accountId || row.accountName || row.platformUserId || 'unknown-account');
    if (!accounts.has(accountKey)) {
      accounts.set(accountKey, {
        key: accountKey,
        accountName: row.accountName || '未归属账号',
        platformUserId: row.platformUserId || '-',
        contents: new Map<string, any>()
      });
    }
    const account = accounts.get(accountKey);

    const contentKey = 'current-confirmed-content';
    if (!account.contents.has(contentKey)) {
      account.contents.set(contentKey, {
        key: contentKey,
        contentId: row.contentId,
        contentType: confirmedContentType || row.contentType || 'VIDEO',
        title: confirmedTitle || row.videoTitle || '当前已确认内容',
        pages: new Map<string, any>()
      });
    }
    const content = account.contents.get(contentKey);
    content.contentId = content.contentId || row.contentId;
    content.contentType = confirmedContentType || (row.contentType === 'VIDEO' ? 'VIDEO' : content.contentType || row.contentType || 'VIDEO');
    content.title = confirmedTitle || betterTitle(content.title, row.videoTitle);

    const pageKey = row.metricGroup || 'OVERVIEW';
    if (!content.pages.has(pageKey)) {
      content.pages.set(pageKey, {
        key: pageKey,
        label: groupLabel[pageKey] || pageKey,
        assetId: row.assetId,
        rowsByMetric: new Map<string, DataOpsMetricRow>()
      });
    }
    const page = content.pages.get(pageKey);
    const metricKey = row.metricKey || row.metricLabel;
    const current = page.rowsByMetric.get(metricKey);
    if (isBetterMetricRow(row, current)) {
      page.rowsByMetric.set(metricKey, row);
      if (row.assetId) page.assetId = row.assetId;
    }
  });
  return Array.from(accounts.values()).map(account => ({
    ...account,
    contents: Array.from(account.contents.values()).map((content: any) => ({
      ...content,
      pages: Array.from(content.pages.values())
        .map((page: any) => ({ ...page, rows: Array.from(page.rowsByMetric.values()).sort((a: DataOpsMetricRow, b: DataOpsMetricRow) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)) }))
        .sort((a: any, b: any) => (groupOrder[a.key] || 99) - (groupOrder[b.key] || 99))
    }))
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AccountVideoMetricTable({
  rows,
  loading,
  contentType,
  contentTitle
}: {
  rows: DataOpsMetricRow[];
  loading?: boolean;
  contentType?: DataOpsContentType;
  contentTitle?: string;
}) {
  const accounts = buildGroups(rows || [], contentType, contentTitle);
  const [editingId, setEditingId] = useState<number>();
  const [editingValue, setEditingValue] = useState('');
  const [savingId, setSavingId] = useState<number>();
  const [overrides, setOverrides] = useState<Record<number, { value: string; source?: string }>>({});
  const [exporting, setExporting] = useState(false);

  const currentValue = (row: DataOpsMetricRow) => overrides[row.id]?.value ?? (row.metricValue ?? '');
  const currentSource = (row: DataOpsMetricRow) => overrides[row.id]?.source || row.source;

  const startEdit = (row: DataOpsMetricRow) => {
    setEditingId(row.id);
    setEditingValue(currentValue(row));
  };

  const saveMetric = async (row: DataOpsMetricRow, confirmed = false) => {
    const oldValue = String(row.metricValue ?? '');
    const nextValue = editingValue.trim();
    const changed = nextValue !== oldValue;
    if (!nextValue) return message.warning('请填写修改后的数据');
    if (changed && !confirmed) {
      Modal.confirm({
        title: '确认修改这项数据吗？',
        content: `识别值是「${oldValue || '空'}」，你准备改成「${nextValue}」。确认后会以人工修正值为准，并在导出表中标记。`,
        okText: '确认修改',
        cancelText: '再看看',
        onOk: () => saveMetric(row, true)
      });
      return;
    }
    setSavingId(row.id);
    try {
      await client.patch(`/data-ops/metrics/${row.id}`, { metricValue: nextValue, confirmed: changed });
      setOverrides(prev => ({ ...prev, [row.id]: { value: nextValue, source: changed ? 'MANUAL' : row.source } }));
      setEditingId(undefined);
      message.success(changed ? '已保存人工修正值' : '已保存');
    } finally {
      setSavingId(undefined);
    }
  };

  const exportDailyExcel = () => {
    const date = todayText();
    Modal.confirm({
      title: '要下载今天的数据 Excel 吗？',
      content: '系统会把今天所有平台子主题下的内容汇总成 Excel。每个子主题/内容一行，数据页1、2、3的指标会横向展开，方便你发给老板或继续整理。',
      okText: '下载 Excel',
      cancelText: '先不下载',
      onOk: async () => {
        setExporting(true);
        try {
          const res = await client.get('/data-ops/reports/daily/export', { params: { date }, responseType: 'blob', timeout: 0 });
          downloadBlob(res.data, `运营数据-${date}.xlsx`);
          message.success('Excel 已开始下载');
        } finally {
          setExporting(false);
        }
      }
    });
  };

  if (!loading && !accounts.length) return <Empty description="当前主题还没有识别出账号/内容数据，上传数据页1后会自动生成数据表" />;
  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    <Card size="small">
      <Space wrap>
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportDailyExcel}>下载当日数据 Excel</Button>
        <span style={{ color: '#8c8c8c' }}>导出前会先确认；人工修正过的值会在 Excel 中标记。</span>
      </Space>
    </Card>
    {accounts.map(account => <Card key={account.key} type="inner" title={<Space><span>账号：{account.accountName}</span><Tag>账号ID：{account.platformUserId}</Tag></Space>}>
      {account.contents.map((content: any) => <Card key={content.key} size="small" style={{ marginBottom: 12 }} title={<Space><span>{contentTypeLabel[content.contentType] || content.contentType || '内容'}：{content.title}</span><Tag color="blue">#{content.contentId || '当前作品'}</Tag></Space>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {content.pages.map((page: any) => <Card key={page.key} size="small" title={<Space><span>{page.label}</span><Tag color="blue">来源图片 #{page.assetId || '-'}</Tag></Space>}>
            <Table<DataOpsMetricRow>
              loading={loading}
              size="small"
              rowKey={row => `${row.metricGroup}-${row.metricKey}-${row.assetId || row.id}`}
              pagination={false}
              dataSource={page.rows}
              columns={[
                { title: '数据标签', dataIndex: 'metricLabel', width: 180 },
                {
                  title: '识别/修正值',
                  width: 220,
                  render: (_, row) => editingId === row.id
                    ? <Space.Compact style={{ width: '100%' }}>
                        <Input autoFocus value={editingValue} onChange={event => setEditingValue(event.target.value)} onPressEnter={() => saveMetric(row)} />
                        <Button type="primary" loading={savingId === row.id} onClick={() => saveMetric(row)}>保存</Button>
                        <Button onClick={() => setEditingId(undefined)}>取消</Button>
                      </Space.Compact>
                    : <Tooltip title="点击这里可以人工修正这项数据">
                        <Button type="link" style={{ padding: 0 }} onClick={() => startEdit(row)}>
                          {currentValue(row) || 'null'} <EditOutlined />
                        </Button>
                      </Tooltip>
                },
                { title: '单位', width: 80, render: (_, row) => row.metricUnit || '-' },
                { title: '来源', width: 100, render: (_, row) => <Tag color={currentSource(row) === 'MANUAL' ? 'purple' : 'blue'}>{currentSource(row) === 'MANUAL' ? '人工修正' : 'OCR'}</Tag> },
                { title: '状态', width: 100, render: (_, row) => <Tag color={statusColor(row.recognitionStatus)}>{row.recognitionStatus || 'PENDING'}</Tag> },
                { title: '识别时间', width: 190, render: (_, row) => row.recognizedAt || '-' }
              ]}
            />
          </Card>)}
        </Space>
      </Card>)}
    </Card>)}
  </Space>;
}
