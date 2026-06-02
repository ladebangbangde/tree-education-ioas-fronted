import client, { unwrapResponse } from './client';

export type AdminUserStatus = 'ACTIVE' | 'DISABLED';

export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  department: string;
  roleCode: string;
  roleName?: string;
  status: AdminUserStatus;
  tokenVersion?: number;
  createdAt?: string;
}

export interface OptionItem { value: string; label: string; }
export interface UserOptions { roles: OptionItem[]; departments: OptionItem[]; statuses: OptionItem[]; }

export interface UserQuery { keyword?: string; department?: string; roleCode?: string; status?: AdminUserStatus; }
export interface CreateUserPayload { username: string; displayName: string; department: string; roleCode: string; initialCode?: string; status?: AdminUserStatus; }
export interface UpdateUserPayload { displayName: string; department: string; roleCode: string; status?: AdminUserStatus; }

export const adminUsersApi = {
  async list(params?: UserQuery) {
    const res = await client.get('/admin/users', { params });
    return unwrapResponse<AdminUser[]>(res.data) || [];
  },
  async options() {
    const res = await client.get('/admin/users/options');
    return unwrapResponse<UserOptions>(res.data);
  },
  async create(payload: CreateUserPayload) {
    const res = await client.post('/admin/users', payload);
    return unwrapResponse<{ userId: number; username: string; initialCode: string }>(res.data);
  },
  async update(id: number, payload: UpdateUserPayload) {
    const res = await client.put(`/admin/users/${id}`, payload);
    return unwrapResponse<AdminUser>(res.data);
  },
  async updateStatus(id: number, status: AdminUserStatus) {
    const res = await client.patch(`/admin/users/${id}/status`, { status });
    return unwrapResponse<AdminUser>(res.data);
  },
  async resetCode(id: number, initialCode?: string) {
    const res = await client.post(`/admin/users/${id}/initial-code/reset`, { initialCode });
    return unwrapResponse<{ userId: number; username: string; initialCode: string }>(res.data);
  }
};
