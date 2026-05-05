import http from '@/services/http';
export const fetchDashboard = () => http.get('/dashboard');
