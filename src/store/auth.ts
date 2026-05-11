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

const defaultDepartment = (role: Role) => role === 'SUPER_ADMIN' ? '系统管理部' : role === 'CONSULTANT' ? '咨询中心' : role === 'MEDIA' ? '媒体部' : '运营部';
const persistAuth = (state: { token?: string | null; role: Role; userName: string; department?: string; id?: string }) => {
  if (state.token) localStorage.setItem('token', state.token);
  localStorage.setItem('role', state.role);
  localStorage.setItem('userName', state.userName);
  localStorage.setItem('department', state.department || defaultDepartment(state.role));
  if (state.id) localStorage.setItem('userId', state.id);
};

const token = localStorage.getItem('token');
const storedRole = (localStorage.getItem('role') as Role) || 'OPERATOR';

export const useAuthStore = create<AuthState>((set, get) => ({
  token,
  role: storedRole,
  userName: localStorage.getItem('userName') || '用户',
  department: localStorage.getItem('department') || defaultDepartment(storedRole),
  id: localStorage.getItem('userId') || undefined,
  isLogin: Boolean(token),
  loginByApi: async (username, password) => {
    const data = await authApi.login({ username, password });
    const normalized = normalizeAuthUser(data);
    if (!normalized.token) throw new Error('登录响应缺少 token');
    const department = normalized.department || defaultDepartment(normalized.role);
    persistAuth({ ...normalized, department });
    set({ token: normalized.token, role: normalized.role, userName: normalized.userName, department, id: normalized.id || undefined, isLogin: true });
    return normalized.role;
  },
  fetchCurrentUser: async () => {
    if (!get().token && !localStorage.getItem('token')) return;
    const user = await authApi.me();
    const normalized = normalizeAuthUser(user, get().role);
    const tokenValue = get().token || localStorage.getItem('token');
    const department = normalized.department || defaultDepartment(normalized.role);
    persistAuth({ token: tokenValue, role: normalized.role, userName: normalized.userName, department, id: normalized.id });
    set({ token: tokenValue, role: normalized.role, userName: normalized.userName, department, id: normalized.id || undefined, isLogin: Boolean(tokenValue) });
  },
  login: (name, _pwd, role = 'OPERATOR', profile = {}) => {
    const department = profile.department || defaultDepartment(role);
    localStorage.setItem('role', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('department', department);
    set({ role, userName: name, department, isLogin: Boolean(get().token), token: get().token });
  },
  logout: () => {
    localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('userName'); localStorage.removeItem('department'); localStorage.removeItem('userId');
    set({ token: null, role: 'OPERATOR', userName: '用户', department: '运营部', id: undefined, isLogin: false });
  }
}));
