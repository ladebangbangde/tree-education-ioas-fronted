import { create } from 'zustand';
import type { Role } from '@/types';
interface AuthState { token:string|null; role:Role; userName:string; login:(u:string,p:string)=>void; logout:()=>void; }
export const useAuthStore = create<AuthState>((set)=>({
  token: localStorage.getItem('token'), role:(localStorage.getItem('role') as Role)||'SUPER_ADMIN', userName:localStorage.getItem('userName')||'管理员',
  login:(u)=>{localStorage.setItem('token','mock-token');localStorage.setItem('role','SUPER_ADMIN');localStorage.setItem('userName',u);set({token:'mock-token',role:'SUPER_ADMIN',userName:u});},
  logout:()=>{localStorage.clear();set({token:null,role:'SUPER_ADMIN',userName:'管理员'});}
}));
