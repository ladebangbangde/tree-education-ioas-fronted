import { create } from 'zustand';
import type { Role } from '@/types';
interface AuthState { token:string|null; role:Role; userName:string; isLogin:boolean; login:(name:string,pwd:string,role?:Role)=>void; logout:()=>void; }
const token = localStorage.getItem('token');
export const useAuthStore = create<AuthState>((set) => ({
  token,
  role: (localStorage.getItem('role') as Role) || 'OPERATOR',
  userName: localStorage.getItem('userName') || '运营管理员',
  isLogin: Boolean(token),
  login: (name, _pwd, role = 'OPERATOR') => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', role);
    localStorage.setItem('userName', name);
    set({ token: 'mock-token', role, userName: name, isLogin: true });
  },
  logout: () => {
    localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('userName');
    set({ token: null, role: 'OPERATOR', userName: '运营管理员', isLogin: false });
  }
}));
