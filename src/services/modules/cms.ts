import http from '@/services/http';
export const fetchCms = () => http.get('/cms');
