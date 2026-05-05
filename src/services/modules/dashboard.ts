import http from '@/services/http';
export const getDashboard = () => Promise.resolve({ data: [] as any[] });
export const getDashboardByApi = () => http.get('/dashboard');
