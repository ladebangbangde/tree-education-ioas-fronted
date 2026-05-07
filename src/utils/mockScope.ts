import { useAuthStore } from '@/store/auth';
import type { Department, Position, Role } from '@/types';

export interface OwnershipFields { ownerId?: string; ownerName?: string; createdBy?: string; createdRole?: Role; department?: Department; position?: Position; advisor?: string; owner?: string; author?: string; status?: string; stage?: string; participant?: string; [key: string]: unknown; }

export function getCurrentProfile(){ return useAuthStore.getState(); }
export function getCurrentPrincipal(){ const { userName, role, position } = getCurrentProfile(); if(role==='OPERATOR' && userName==='运营人员') return '林娜'; if(role==='STAFF' && userName==='运营人员') return position === '文案老师' ? '周航' : position === '签证服务' ? '刘琪' : position === '申请老师' ? 'Mia老师' : 'Amy顾问'; return userName; }

const includes = (value: unknown, target?: string) => Boolean(target) && String(value ?? '').includes(target);
const isMine = (row: OwnershipFields) => {
  const principal = getCurrentPrincipal();
  return [row.ownerName,row.createdBy,row.advisor,row.owner,row.author,row.participant].some(v=>includes(v, principal)) || (principal === '林娜' && [row.ownerName,row.createdBy,row.author,row.owner].some(v=>includes(v, '内容运营-林娜')));
};
const isDepartment = (row: OwnershipFields) => row.department === getCurrentProfile().department;

export function maskSensitive<T extends Record<string, any>>(row: T): T {
  return { ...row, phone: row.phone ? String(row.phone).replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : row.phone, budget: row.budget ? '已脱敏' : row.budget, amount: row.amount ? '已脱敏' : row.amount };
}

export function canManageRecord(row: OwnershipFields) {
  const { role } = getCurrentProfile();
  if(role === 'SUPER_ADMIN') return true;
  if(role === 'OPERATOR') return isMine(row);
  if(role === 'STAFF') return isMine(row) || isDepartment(row);
  return false;
}

export function scopeLeads<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return rows.filter(i=>i.createdRole==='OPERATOR' || i.source !== '内部转介绍');
  return rows.filter(i=>isMine(i)||isDepartment(i)).map(i=>maskSensitive(i as any));
}

export function scopeStudents<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return [];
  return rows.filter(i=>isMine(i)||isDepartment(i)).map(i=>maskSensitive(i as any));
}

export function scopeApplications<T extends OwnershipFields>(rows: T[]): T[] {
  const { role, position }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return [];
  if(position==='签证服务') return rows.filter(i=>['签证办理','行前准备','后服务阶段','资料审核中','待递签'].includes(String(i.status||i.stage)) || isMine(i));
  if(position==='文案老师') return rows.filter(i=>['文书准备','材料清单'].includes(String(i.status||i.stage)) || isMine(i));
  return rows.filter(i=>isMine(i)||isDepartment(i));
}

export function scopeKanban<T extends OwnershipFields>(data: Record<string, T[]>): Record<string, T[]> {
  const { role, position }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return data;
  if(role==='OPERATOR') return Object.fromEntries(Object.keys(data).map(key=>[key, []]));
  return Object.fromEntries(Object.entries(data).map(([stage, rows])=>{
    if(position==='签证服务') return [stage, ['签证办理','行前准备'].includes(stage) ? rows.filter(i=>isMine(i)||isDepartment(i)) : []];
    if(position==='文案老师') return [stage, ['文书准备','网申提交'].includes(stage) ? rows.filter(i=>isMine(i)||isDepartment(i)) : []];
    return [stage, rows.filter(i=>isMine(i)||isDepartment(i))];
  }));
}

export function scopeCms<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return rows.filter(isMine);
  return [];
}

export function scopeTasks<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  return rows.filter(i=>isMine(i)||isDepartment(i));
}
