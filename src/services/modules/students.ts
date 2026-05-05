import http from '@/services/http';
export const fetchStudents = () => http.get('/students');
