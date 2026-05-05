import http from '@/services/http';
export const getSettings = () => Promise.resolve({ data: [] as any[] });
export const getSettingsByApi = () => http.get('/settings');
