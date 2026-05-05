import http from '@/services/http';
export const getStudents = () => Promise.resolve({ data: [] as any[] });
export const getStudentsByApi = () => http.get('/students');
