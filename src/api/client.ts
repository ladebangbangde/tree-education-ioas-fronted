import type { ApiResponse, PageResult } from '@/types/api';

export const API_BASE_URL = 'mock://local-demo';

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

const client = new Proxy({}, {
  get() {
    throw new Error('当前分支固定为纯前端 mock 演示版，禁止发起真实 API 请求。');
  }
});

export default client as never;
