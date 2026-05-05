import http from '@/services/http';
export const fetchSettings = () => http.get('/settings');
