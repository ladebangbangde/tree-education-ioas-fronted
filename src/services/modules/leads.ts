import http from '@/services/http';
export const fetchLeads = () => http.get('/leads');
