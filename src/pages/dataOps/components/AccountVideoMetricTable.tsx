import { Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import client from '@/api/client';
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

function metricRowKey(row: DataOpsMetricRow) {
  return String(row.id || `${row.metricGroup}-${row.metricKey}-${row.assetId || 'no-asset'}`);
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
  const [selectedKey, setSelectedKey] = useState<string>();
  const [editingKey, setEditingKey] = useState<string>();
  const [editingValue, setEditingValue] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string>();
  const [manualValues, setManualValues] = useState<Record<string, string | null>>({});

  const accounts = buildGroups(rows || [], contentType, contentTitle);
  if (!loading && !accounts.length) return <Empty description="当前主题还没有识别出账号/内容数据，上传数据页1后会自动生成数据表" />;

  const currentMetricValue = (row: DataOpsMetricRow) => {
    const key = metricRowKey(row);
    return Object.prototype.hasOwnProperty.call(manualValues, key) ? manualValues[key] : row.metricValue ?? null;
  };

  const startEdit = (row: DataOpsMetricRow) => {
    const key = metricRowKey(row);
    const value = currentMetricValue(row);
    setSelectedKey(key);
    setEditingKey(key);
    setEditingValue(values => ({ ...values, [key]: value == null ? '' : String(value) }));
  };

  const cancelEdit = () => {
    setEditingKey(undefined);
  };

  const saveEdit = async (row: DataOpsMetricRow) => {
    const key = metricRowKey(row);
    const nextValue = editingValue[key] ?? '';
    setSavingKey(key);
    try {
      await client.patch(`/data-ops/platform-topics/metrics/${row.id}`, { metricValue: nextValue });
      const normalized = nextValue.trim();
      setManualValues(values => ({ ...values, [key]: normalized ? normalized : null }));
      setEditingKey(undefined);
      message.success('识别值已人工修改');
    } finally {
      setSavingKey(undefined);
    }
  };

  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    {accounts.map(account => <Card key={account.key} type="inner" title={<Space><span>账号：{account.accountName}</span><Tag>账号ID：{account.platformUserId}</Tag></Space>}>
      {account.contents.map((content: any) => <Card key={content.key} size="small" style={{ marginBottom: 12 }} title={<Space><span>{contentTypeLabel[content.contentType] || content.contentType || '内容'}：{content.title}</span><Tag color="blue">#{content.contentId || '当前作品'}</Tag></Space>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {content.pages.map((page: any) => <Card key={page.key} size="small" title={<Space><span>{page.label}</span><Tag color="blue">来源图片 #{page.assetId || '-'}</Tag></Space>}>
            <Table<DataOpsMetricRow>
              loading={loading}
              size="small"
              rowKey={metricRowKey}
              pagination={false}
              dataSource={page.rows}
              onRow={row => ({
                onClick: () => setSelectedKey(metricRowKey(row)),
                style: {
                  cursor: 'pointer',
                  background: selectedKey === metricRowKey(row) ? '#f0f7ff' : undefined
                }
              })}
              columns={[
                { title: '数据标签', dataIndex: 'metricLabel', width: 180 },
                {
                  title: '识别值',
                  width: 200,
                  render: (_, row) => {
                    const key = metricRowKey(row);
                    if (editingKey === key) {
                      return <Input
                        size="small"
                        autoFocus
                        value={editingValue[key] ?? ''}
                        placeholder="输入新值；留空表示 null"
                        onClick={event => event.stopPropagation()}
                        onChange={event => setEditingValue(values => ({ ...values, [key]: event.target.value }))}
                        onPressEnter={() => saveEdit(row)}
                      />;
                    }
                    return currentMetricValue(row) ?? 'null';
                  }
                },
                { title: '单位', width: 80, render: (_, row) => row.metricUnit || '-' },
                {
                  title: '状态',
                  width: 100,
                  render: (_, row) => {
                    const key = metricRowKey(row);
                    const isManual = Object.prototype.hasOwnProperty.call(manualValues, key);
                    const status = isManual ? (manualValues[key] == null ? 'PENDING' : 'SUCCESS') : row.recognitionStatus;
                    return <Tag color={isManual ? 'blue' : statusColor(status)}>{isManual ? 'MANUAL' : status || 'PENDING'}</Tag>;
                  }
                },
                { title: '识别时间', width: 190, render: (_, row) => row.recognizedAt || '-' },
                {
                  title: '操作',
                  width: 130,
                  render: (_, row) => {
                    const key = metricRowKey(row);
                    if (editingKey === key) {
                      return <Space onClick={event => event.stopPropagation()}>
                        <Button type="link" size="small" loading={savingKey === key} onClick={() => saveEdit(row)}>确认</Button>
                        <Button type="link" size="small" onClick={cancelEdit}>取消</Button>
                      </Space>;
                    }
                    return selectedKey === key ? <Button type="link" size="small" onClick={event => { event.stopPropagation(); startEdit(row); }}>编辑</Button> : null;
                  }
                }
              ]}
            />
          </Card>)}
        </Space>
      </Card>)}
    </Card>)}
  </Space>;
}
