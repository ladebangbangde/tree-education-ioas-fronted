import { create } from 'zustand';
import { authApi } from '@/api/auth';
import type { Department, Role } from '@/types';
import { normalizeAuthUser } from '@/utils/adapters/mediaFlow';

interface AuthState {
  token: string | null;
  role: Role;
  userName: string;
  department?: Department | string;
  id?: string;
  isLogin: boolean;
  loginByApi: (username: string, password: string) => Promise<Role>;
  fetchCurrentUser: () => Promise<void>;
  login: (name: string, pwd: string, role?: Role, profile?: { department?: Department }) => void;
  logout: () => void;
}

const validRoles: Role[] = ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE', 'ANCHOR', 'IDLE_ANCHOR'];

const normalizeStoredRole = (role?: string | null): Role => {
  const value = (role || 'OPERATOR').toUpperCase() as Role;
  return validRoles.includes(value) ? value : 'OPERATOR';
};

const defaultDepartment = (role: Role) => {
  if (role === 'SUPER_ADMIN') return '系统管理部';
  if (role === 'CONSULTANT') return '咨询中心';
  if (role === 'MEDIA') return '媒体部';
  if (role === 'DATA') return '数据部';
  if (role === 'ADMINISTRATIVE') return '行政部';
  if (role === 'ANCHOR' || role === 'IDLE_ANCHOR') return '主播部';
  return '运营部';
};

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
  localStorage.removeItem('department');
  localStorage.removeItem('userId');
};
const persistAuth = (state: { token?: string | null; role: Role; userName: string; department?: string; id?: string }) => {
  if (state.token) localStorage.setItem('token', state.token);
  localStorage.setItem('role', state.role);
  localStorage.setItem('userName', state.userName);
  localStorage.setItem('department', state.department || defaultDepartment(state.role));
  if (state.id) localStorage.setItem('userId', state.id);
};

const token = localStorage.getItem('token');
const storedRole = normalizeStoredRole(localStorage.getItem('role'));

export const useAuthStore = create<AuthState>((set, get) => ({
  token,
  role: storedRole,
  userName: localStorage.getItem('userName') || '用户',
  department: localStorage.getItem('department') || defaultDepartment(storedRole),
  id: localStorage.getItem('userId') || undefined,
  isLogin: false,
  loginByApi: async (username, password) => {
    clearAuthStorage();
    set({ token: null, isLogin: false });

    const data = await authApi.login({ username, password });
    const normalized = normalizeAuthUser(data);
    if (!normalized.token) throw new Error('登录响应缺少 token');

    const department = normalized.department || defaultDepartment(normalized.role);
    persistAuth({ ...normalized, department });
    set({ token: normalized.token, role: normalized.role, userName: normalized.userName, department, id: normalized.id || undefined, isLogin: true });

    await get().fetchCurrentUser();
    return get().role;
  },
  fetchCurrentUser: async () => {
    const tokenValue = get().token || localStorage.getItem('token');
    if (!tokenValue) {
      clearAuthStorage();
      set({ token: null, isLogin: false });
      return;
    }

    try {
      const user = await authApi.me();
      const normalized = normalizeAuthUser(user, get().role);
      const department = normalized.department || defaultDepartment(normalized.role);
      persistAuth({ token: tokenValue, role: normalized.role, userName: normalized.userName, department, id: normalized.id });
      set({ token: tokenValue, role: normalized.role, userName: normalized.userName, department, id: normalized.id || undefined, isLogin: true });
    } catch (error) {
      clearAuthStorage();
      set({ token: null, role: 'OPERATOR', userName: '用户', department: '运营部', id: undefined, isLogin: false });
      throw error;
    }
  },
  login: (_name, _pwd, _role = 'OPERATOR', _profile = {}) => {
    throw new Error('本地模拟登录已禁用，请使用后端账号密码登录');
  },
  logout: () => {
    clearAuthStorage();
    set({ token: null, role: 'OPERATOR', userName: '用户', department: '运营部', id: undefined, isLogin: false });
  }
}));
