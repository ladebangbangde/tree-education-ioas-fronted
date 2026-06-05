import { Card, Empty, Space, Table, Tag } from 'antd';
import type { DataOpsMetricRow } from '@/api/dataOps';

const groupLabel: Record<string, string> = {
  OVERVIEW: '数据页1 · 总览指标',
  OVERVIEW_CHART: '数据页2 · 趋势/粉丝图表',
  FLOW_ANALYSIS: '数据页3 · 流量分析'
};

function statusColor(status?: string) {
  const value = String(status || '').toUpperCase();
  if (value === 'SUCCESS') return 'green';
  if (value === 'FAILED') return 'red';
  if (value === 'PENDING') return 'gold';
  return 'default';
}

function buildGroups(rows: DataOpsMetricRow[]) {
  const accounts = new Map<string, any>();
  rows.forEach(row => {
    const accountKey = String(row.accountId || row.accountName || row.platformUserId || 'unknown-account');
    if (!accounts.has(accountKey)) {
      accounts.set(accountKey, {
        key: accountKey,
        accountName: row.accountName || '未归属账号',
        platformUserId: row.platformUserId || 'null',
        videos: new Map<string, any>()
      });
    }
    const account = accounts.get(accountKey);
    const videoKey = String(row.videoId || row.videoTitle || 'unknown-video');
    if (!account.videos.has(videoKey)) {
      account.videos.set(videoKey, {
        key: videoKey,
        videoId: row.videoId,
        videoTitle: row.videoTitle || '未归属视频',
        rows: []
      });
    }
    account.videos.get(videoKey).rows.push(row);
  });
  return Array.from(accounts.values()).map(item => ({ ...item, videos: Array.from(item.videos.values()) }));
}

export function AccountVideoMetricTable({ rows, loading }: { rows: DataOpsMetricRow[]; loading?: boolean }) {
  const accounts = buildGroups(rows || []);
  if (!loading && !accounts.length) return <Empty description="当前主题还没有识别出账号/视频数据，上传数据页1后会自动生成视频" />;
  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    {accounts.map(account => <Card key={account.key} type="inner" title={<Space><span>账号：{account.accountName}</span><Tag>账号ID：{account.platformUserId}</Tag></Space>}>
      {account.videos.map((video: any) => <Card key={video.key} size="small" style={{ marginBottom: 12 }} title={<Space><span>视频：{video.videoTitle}</span><Tag color="blue">#{video.videoId || 'null'}</Tag></Space>}>
        <Table<DataOpsMetricRow>
          loading={loading}
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={video.rows}
          columns={[
            { title: '图片类型', width: 160, render: (_, row) => groupLabel[row.metricGroup] || row.metricGroup },
            { title: '数据标签', dataIndex: 'metricLabel', width: 150 },
            { title: '识别值', width: 160, render: (_, row) => row.metricValue ?? 'null' },
            { title: '单位', width: 80, render: (_, row) => row.metricUnit || '-' },
            { title: '状态', width: 100, render: (_, row) => <Tag color={statusColor(row.recognitionStatus)}>{row.recognitionStatus || 'PENDING'}</Tag> },
            { title: '来源图片', width: 100, render: (_, row) => row.assetId ? `#${row.assetId}` : '-' },
            { title: '识别时间', width: 180, render: (_, row) => row.recognizedAt || '-' }
          ]}
        />
      </Card>)}
    </Card>)}
  </Space>;
}
