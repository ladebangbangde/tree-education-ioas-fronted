import http from '@/services/http';
export const fetchApplications = () => http.get('/applications');
