import { create } from 'zustand';
import type { Department, Position, Role } from '@/types';
import { departmentByPosition } from '@/constants/permissions';

interface LoginProfile { department?: Department; position?: Position; }
interface AuthState { token:string|null; role:Role; userName:string; department:Department; position:Position; isLogin:boolean; login:(name:string,pwd:string,role?:Role,profile?:LoginProfile)=>void; logout:()=>void; }
const token = localStorage.getItem('token');
const storedRole = (localStorage.getItem('role') as Role) || 'OPERATOR';
const storedPosition = (localStorage.getItem('position') as Position) || (storedRole === 'SUPER_ADMIN' ? '超级管理员' : storedRole === 'STAFF' ? '留学顾问' : '运营人员');
export const useAuthStore = create<AuthState>((set) => ({
  token,
  role: storedRole,
  userName: localStorage.getItem('userName') || '运营人员',
  department: (localStorage.getItem('department') as Department) || departmentByPosition[storedPosition],
  position: storedPosition,
  isLogin: Boolean(token),
  login: (name, _pwd, role = 'OPERATOR', profile = {}) => {
    const position = profile.position || (role === 'SUPER_ADMIN' ? '超级管理员' : role === 'STAFF' ? '留学顾问' : '运营人员');
    const department = profile.department || departmentByPosition[position];
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('department', department);
    localStorage.setItem('position', position);
    set({ token: 'mock-token', role, userName: name, department, position, isLogin: true });
  },
  logout: () => {
    localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('userName'); localStorage.removeItem('department'); localStorage.removeItem('position');
    set({ token: null, role: 'OPERATOR', userName: '运营人员', department: '运营部', position: '运营人员', isLogin: false });
  }
}));
