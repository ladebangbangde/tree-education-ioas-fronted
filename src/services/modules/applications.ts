import http from '@/services/http';
export const getApplications = () => Promise.resolve({ data: [] as any[] });
export const getApplicationsByApi = () => http.get('/applications');
