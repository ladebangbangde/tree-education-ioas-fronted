import http from '@/services/http';
export const fetchTasks = () => http.get('/tasks');
