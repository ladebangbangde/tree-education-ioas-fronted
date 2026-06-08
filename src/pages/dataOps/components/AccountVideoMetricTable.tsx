import { Card, Empty, Space, Table, Tag } from 'antd';
import type { DataOpsMetricRow } from '@/api/dataOps';

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

function statusColor(status?: string) {
  const value = String(status || '').toUpperCase();
  if (value === 'SUCCESS') return 'green';
  if (value === 'FAILED') return 'red';
  if (value === 'PENDING') return 'gold';
  return 'default';
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

function buildGroups(rows: DataOpsMetricRow[]) {
  const accounts = new Map<string, any>();
  rows.forEach(row => {
    const accountKey = String(row.accountId || row.accountName || row.platformUserId || 'unknown-account');
    if (!accounts.has(accountKey)) {
      accounts.set(accountKey, {
        key: accountKey,
        accountName: row.accountName || '未归属账号',
        platformUserId: row.platformUserId || '-',
        videos: new Map<string, any>()
      });
    }
    const account = accounts.get(accountKey);
    const videoKey = String(row.videoId || row.videoTitle || row.contentId || `${row.contentType}-content` || 'unknown-video');
    if (!account.videos.has(videoKey)) {
      account.videos.set(videoKey, {
        key: videoKey,
        videoId: row.videoId,
        videoTitle: row.videoTitle || '未归属内容',
        contentType: row.contentType,
        pages: new Map<string, any>()
      });
    }
    const video = account.videos.get(videoKey);
    const pageKey = row.metricGroup || 'OVERVIEW';
    if (!video.pages.has(pageKey)) {
      video.pages.set(pageKey, {
        key: pageKey,
        label: groupLabel[pageKey] || pageKey,
        assetId: row.assetId,
        rowsByMetric: new Map<string, DataOpsMetricRow>()
      });
    }
    const page = video.pages.get(pageKey);
    const metricKey = row.metricKey || row.metricLabel;
    const current = page.rowsByMetric.get(metricKey);
    if (isBetterMetricRow(row, current)) {
      page.rowsByMetric.set(metricKey, row);
      if (row.assetId) page.assetId = row.assetId;
    }
  });
  return Array.from(accounts.values()).map(account => ({
    ...account,
    videos: Array.from(account.videos.values()).map((video: any) => ({
      ...video,
      pages: Array.from(video.pages.values())
        .map((page: any) => ({ ...page, rows: Array.from(page.rowsByMetric.values()).sort((a: DataOpsMetricRow, b: DataOpsMetricRow) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)) }))
        .sort((a: any, b: any) => (groupOrder[a.key] || 99) - (groupOrder[b.key] || 99))
    }))
  }));
}

export function AccountVideoMetricTable({ rows, loading }: { rows: DataOpsMetricRow[]; loading?: boolean }) {
  const accounts = buildGroups(rows || []);
  if (!loading && !accounts.length) return <Empty description="当前主题还没有识别出账号/视频数据，上传数据页1后会自动生成视频" />;
  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    {accounts.map(account => <Card key={account.key} type="inner" title={<Space><span>账号：{account.accountName}</span><Tag>账号ID：{account.platformUserId}</Tag></Space>}>
      {account.videos.map((video: any) => <Card key={video.key} size="small" style={{ marginBottom: 12 }} title={<Space><span>{video.contentType === 'IMAGE_TEXT' ? '图文' : '视频'}：{video.videoTitle}</span><Tag color="blue">#{video.videoId || video.key}</Tag></Space>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {video.pages.map((page: any) => <Card key={page.key} size="small" title={<Space><span>{page.label}</span><Tag color="blue">来源图片 #{page.assetId || '-'}</Tag></Space>}>
            <Table<DataOpsMetricRow>
              loading={loading}
              size="small"
              rowKey={row => `${row.metricGroup}-${row.metricKey}-${row.assetId || row.id}`}
              pagination={false}
              dataSource={page.rows}
              columns={[
                { title: '数据标签', dataIndex: 'metricLabel', width: 180 },
                { title: '识别值', width: 160, render: (_, row) => row.metricValue ?? 'null' },
                { title: '单位', width: 80, render: (_, row) => row.metricUnit || '-' },
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
