import http from '@/services/http';
export const getReports = () => Promise.resolve({ data: [] as any[] });
export const getReportsByApi = () => http.get('/reports');
