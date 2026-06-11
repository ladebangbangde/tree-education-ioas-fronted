import client, { unwrapResponse } from './client';

export interface DataOpsExcelReportPreview {
  date: string;
  platform: string;
  topicPackageId?: number | null;
  onlyConfirmed: boolean;
  tableName?: string;
  sourceMode?: string;
  totalContentCount: number;
  confirmedCount: number;
  unconfirmedCount: number;
  manualCorrectedCount: number;
  platformStats: Array<{ platform: string; contentCount: number }>;
}

export interface DataOpsExcelReportLog {
  id: number;
  report_date: string;
  platform: string;
  file_name: string;
  total_content_count: number;
  confirmed_count: number;
  unconfirmed_count: number;
  manual_corrected_count: number;
  exported_by_name: string;
  exported_at: string;
}

export interface DataOpsExcelReportTopRow {
  date: string;
  packageName: string;
  platform: string;
  account: string;
  title: string;
  subTopic: string;
  contentType: string;
  publishedAt: string;
  operatorName: string;
  mediaName: string;
  page1Views: number;
  page1Likes: number;
  page1Comments: number;
  page1Favorites: number;
  page1Shares: number;
  page2Exposure: number;
  page2ProfileViews: number;
  page2Followers: number;
  page3CompletionRate: number;
  page3EngagementRate: number;
  ocrConfidence: number;
  corrected: boolean;
  reviewer: string;
  createdAt: string;
  confirmed: boolean;
}

export interface DataOpsExcelReportTop5Response {
  logId: number;
  reportDate: string;
  platform: string;
  fileName: string;
  tableName?: string;
  sourceMode?: string;
  rows: DataOpsExcelReportTopRow[];
}

export async function getDataOpsExcelReportPreview(params: {
  date?: string;
  platform?: string;
  topicPackageId?: number | null;
  onlyConfirmed?: boolean;
}) {
  const res = await client.get('/data-ops/reports2/export-preview', { params });
  return unwrapResponse<DataOpsExcelReportPreview>(res.data);
}

export async function getDataOpsExcelReportLogs() {
  const res = await client.get('/data-ops/reports2/export-logs');
  return unwrapResponse<DataOpsExcelReportLog[]>(res.data);
}

export async function getDataOpsExcelReportTop5(logId: number | string) {
  const res = await client.get(`/data-ops/reports2/export-logs/${logId}/top5`);
  return unwrapResponse<DataOpsExcelReportTop5Response>(res.data);
}

export async function exportDataOpsExcelReport(payload: {
  date?: string;
  platform?: string;
  topicPackageId?: number | null;
  onlyConfirmed?: boolean;
}) {
  const res = await client.post('/data-ops/reports2/export-excel', payload, {
    responseType: 'blob',
    timeout: 0
  });
  const contentType = String(res.headers['content-type'] || '');
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType || 'application/octet-stream' });
  if (!contentType.includes('spreadsheetml') && !contentType.includes('application/octet-stream')) {
    const text = await blob.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed?.message || parsed?.msg || '导出失败');
    } catch {
      throw new Error(text || '导出失败');
    }
  }
  if (!blob.size) throw new Error('导出的文件为空');
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
  const fileName = decodeURIComponent(match?.[1] || match?.[2] || `数据操作日报_${payload.date || 'today'}.xlsx`);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    a.remove();
    window.URL.revokeObjectURL(url);
  }, 1000);
  return { fileName, size: blob.size };
}
