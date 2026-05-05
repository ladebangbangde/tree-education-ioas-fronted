import http from '@/services/http';
export const fetchKnowledge = () => http.get('/knowledge');
