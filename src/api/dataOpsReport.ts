import client, { unwrapResponse } from './client';

export interface DataOpsExcelReportPreview {
  date: string;
  platform: string;
  topicPackageId?: number | null;
  onlyConfirmed: boolean;
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

export async function getDataOpsExcelReportPreview(params: {
  date?: string;
  platform?: string;
  topicPackageId?: number | null;
  onlyConfirmed?: boolean;
}) {
  const res = await client.get('/data-ops/reports/export-preview', { params });
  return unwrapResponse<DataOpsExcelReportPreview>(res.data);
}

export async function getDataOpsExcelReportLogs() {
  const res = await client.get('/data-ops/reports/export-logs');
  return unwrapResponse<DataOpsExcelReportLog[]>(res.data);
}

export async function exportDataOpsExcelReport(payload: {
  date?: string;
  platform?: string;
  topicPackageId?: number | null;
  onlyConfirmed?: boolean;
}) {
  const res = await client.post('/data-ops/reports/export-excel', payload, {
    responseType: 'blob',
    timeout: 0
  });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
  const fileName = decodeURIComponent(match?.[1] || match?.[2] || `数据操作日报_${payload.date || 'today'}.xlsx`);
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
