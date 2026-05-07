import { create } from 'zustand';
import type { Department, Role } from '@/types';

interface LoginProfile { department?: Department; }
interface AuthState { token:string|null; role:Role; userName:string; department?:Department; isLogin:boolean; login:(name:string,pwd:string,role?:Role,profile?:LoginProfile)=>void; logout:()=>void; }
const token = localStorage.getItem('token');
const storedRole = (localStorage.getItem('role') as Role) || 'OPERATOR';
export const useAuthStore = create<AuthState>((set) => ({
  token,
  role: storedRole,
  userName: localStorage.getItem('userName') || '运营',
  department: (localStorage.getItem('department') as Department) || (storedRole === 'SUPER_ADMIN' ? '系统管理部' : storedRole === 'CONSULTANT' ? '咨询中心' : '运营部'),
  isLogin: Boolean(token),
  login: (name, _pwd, role = 'OPERATOR', profile = {}) => {
    const department = profile.department || (role === 'SUPER_ADMIN' ? '系统管理部' : role === 'CONSULTANT' ? '咨询中心' : '运营部');
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('department', department);
    set({ token: 'mock-token', role, userName: name, department, isLogin: true });
  },
  logout: () => {
    localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('userName'); localStorage.removeItem('department');
    set({ token: null, role: 'OPERATOR', userName: '运营', department: '运营部', isLogin: false });
  }
}));
