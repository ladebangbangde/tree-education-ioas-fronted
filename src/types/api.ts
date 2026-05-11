export interface ApiResponse<T> {
  code?: number | string;
  success?: boolean;
  message?: string;
  msg?: string;
  data?: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
}

export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
}
