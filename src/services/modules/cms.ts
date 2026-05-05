import http from '@/services/http';
export const getCms = () => Promise.resolve({ data: [] as any[] });
export const getCmsByApi = () => http.get('/cms');
