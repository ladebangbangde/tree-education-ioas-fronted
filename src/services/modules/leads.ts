import http from '@/services/http';
export const getLeads = () => Promise.resolve({ data: [] as any[] });
export const getLeadsByApi = () => http.get('/leads');
