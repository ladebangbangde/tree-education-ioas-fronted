import http from '@/services/http';
export const fetchReports = () => http.get('/reports');
