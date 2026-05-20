import axios from 'axios';
import { message } from 'antd';
import type { ApiResponse, PageResult } from '@/types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
export const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || 'http://localhost:8080/api';

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
  }
}

function attachInterceptors(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      const status = error?.response?.status;
      const text = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '接口请求失败';
      const silent = Boolean(error?.config?.silent);
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('department');
        localStorage.removeItem('userId');
        if (window.location.pathname !== '/login') window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      } else if (!silent && text && !axios.isCancel(error)) {
        message.error(text);
      }
      return Promise.reject(error);
    }
  );
  return instance;
}

const client = attachInterceptors(axios.create({ baseURL: API_BASE_URL, timeout: 15000 }));
export const rootClient = attachInterceptors(axios.create({ baseURL: API_ROOT_URL, timeout: 15000 }));
export const transferClient = attachInterceptors(axios.create({ baseURL: API_BASE_URL, timeout: 0 }));

export function unwrapResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) return (payload as ApiResponse<T>).data as T;
  return payload as T;
}

export function normalizePage<T>(payload: unknown): PageResult<T> {
  const data = unwrapResponse(payload as any) as any;
  if (Array.isArray(data)) return { records: data, total: data.length };
  const records = data?.records || data?.list || data?.items || data?.content || [];
  return {
    records: Array.isArray(records) ? records : [],
    total: Number(data?.total ?? data?.totalElements ?? records.length ?? 0),
    pageNum: data?.pageNum ?? data?.page ?? data?.current,
    pageSize: data?.pageSize ?? data?.size
  };
}

export default client;
