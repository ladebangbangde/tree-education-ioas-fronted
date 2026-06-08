import { Card, Empty, Space, Table, Tag } from 'antd';
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
    const effectiveType = confirmedContentType || row.contentType || 'VIDEO';
    const contentKey = String(row.contentId || `${effectiveType}-confirmed-content`);
    if (!account.contents.has(contentKey)) {
      account.contents.set(contentKey, {
        key: contentKey,
        contentId: row.contentId,
        contentType: effectiveType,
        title: confirmedTitle || row.videoTitle || '当前已确认内容',
        pages: new Map<string, any>()
      });
    }
    const content = account.contents.get(contentKey);
    content.contentType = confirmedContentType || content.contentType || row.contentType || 'VIDEO';
    if (confirmedTitle) content.title = confirmedTitle;
    else if (!content.title || content.title === '当前已确认内容') content.title = row.videoTitle || content.title;

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
  if (!loading && !accounts.length) return <Empty description="当前主题还没有识别出账号/内容数据，上传数据页1后会自动生成数据表" />;
  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    {accounts.map(account => <Card key={account.key} type="inner" title={<Space><span>账号：{account.accountName}</span><Tag>账号ID：{account.platformUserId}</Tag></Space>}>
      {account.contents.map((content: any) => <Card key={content.key} size="small" style={{ marginBottom: 12 }} title={<Space><span>{contentTypeLabel[content.contentType] || content.contentType || '内容'}：{content.title}</span><Tag color="blue">#{content.contentId || content.key}</Tag></Space>}>
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
