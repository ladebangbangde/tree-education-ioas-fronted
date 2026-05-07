import { useAuthStore } from '@/store/auth';

export type OwnershipFields = Record<string, any>;

export function getCurrentProfile(){ return useAuthStore.getState(); }
export function getCurrentPrincipal(){ const { userName, role } = getCurrentProfile(); const principal = userName || ''; if(role==='OPERATOR' && principal==='运营') return '林娜'; if(role==='CONSULTANT' && principal==='运营') return 'Amy顾问'; return principal; }

const includes = (value: unknown, target?: string) => target ? String(value ?? '').includes(target) : false;
const isMine = (row: OwnershipFields) => {
  const principal = getCurrentPrincipal();
  return [row.ownerName,row.createdBy,row.advisor,row.owner,row.author,row.participant].some(v=>includes(v, principal)) || (principal === '林娜' && [row.ownerName,row.createdBy,row.author,row.owner].some(v=>includes(v, '内容运营-林娜')));
};
const isDepartment = (row: OwnershipFields) => row.department === getCurrentProfile().department;

export function maskSensitive<T extends OwnershipFields>(row: T): T {
  return { ...row, phone: row.phone ? String(row.phone).replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : row.phone, budget: row.budget ? '已脱敏' : row.budget, amount: row.amount ? '已脱敏' : row.amount };
}

export function canManageRecord(row: OwnershipFields) {
  const { role } = getCurrentProfile();
  if(role === 'SUPER_ADMIN') return true;
  if(role === 'OPERATOR') return isMine(row);
  if(role === 'CONSULTANT') return isMine(row) || isDepartment(row);
  return false;
}

export function scopeLeads<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return rows.filter(i=>i.role==='OPERATOR' || i.createdRole==='OPERATOR' || i.source !== '内部转介绍');
  return rows.filter(i=>isMine(i)||isDepartment(i)).map(maskSensitive);
}

export function scopeStudents<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return [];
  return rows.filter(i=>isMine(i)||isDepartment(i)).map(maskSensitive);
}

export function scopeApplications<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return [];
  return rows.filter(i=>isMine(i)||isDepartment(i));
}

export function scopeKanban<T extends OwnershipFields>(data: Record<string, T[]>): Record<string, T[]> {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return data;
  if(role==='OPERATOR') return Object.fromEntries(Object.keys(data).map(key=>[key, []]));
  return Object.fromEntries(Object.entries(data).map(([stage, rows])=>[stage, rows.filter(i=>isMine(i)||isDepartment(i))]));
}

export function scopeCms<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  if(role==='OPERATOR') return rows.filter(isMine);
  return rows;
}

export function scopeTasks<T extends OwnershipFields>(rows: T[]): T[] {
  const { role }=getCurrentProfile();
  if(role==='SUPER_ADMIN') return rows;
  return rows.filter(i=>isMine(i)||isDepartment(i));
}
