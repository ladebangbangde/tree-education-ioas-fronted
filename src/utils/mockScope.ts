import { useAuthStore } from '@/store/auth';
import type { Role } from '@/types';

export const principalByRole: Record<Role, string> = {
  SUPER_ADMIN: '运营管理员',
  OPERATOR: '运营管理员',
  CONSULTANT: 'Amy顾问',
  APPLICANT_TEACHER: 'Mia老师',
  COPYWRITER: '文案老师-周航',
  AFTER_SERVICE: '签证老师-刘琪'
};

export const afterServiceStages = ['签证办理','行前准备','后服务阶段','资料审核中','待递签'];

export function getCurrentRole(){ return useAuthStore.getState().role; }
export function getCurrentPrincipal(){ const role=getCurrentRole(); return principalByRole[role]; }

const containsOwner = (value: unknown, principal: string) => String(value ?? '').includes(principal) || String(value ?? '').includes(principal.replace('文案老师-','')) || String(value ?? '').includes(principal.replace('签证老师-',''));

export function maskSensitive<T extends Record<string, any>>(row: T): T {
  return { ...row, phone: row.phone ? String(row.phone).replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : row.phone, budget: row.budget ? '已脱敏' : row.budget, amount: row.amount ? '已脱敏' : row.amount };
}

export function scopeLeads<T extends Record<string, any>>(rows: T[]): T[] {
  const role=getCurrentRole(); const principal=getCurrentPrincipal();
  if(role==='CONSULTANT') return rows.filter(i=>i.advisor===principal).map(maskSensitive);
  if(role==='COPYWRITER' || role==='APPLICANT_TEACHER' || role==='AFTER_SERVICE') return [];
  return rows;
}

export function scopeStudents<T extends Record<string, any>>(rows: T[]): T[] {
  const role=getCurrentRole(); const principal=getCurrentPrincipal();
  if(role==='CONSULTANT') return rows.filter(i=>i.advisor===principal);
  if(role==='APPLICANT_TEACHER') return rows.filter(i=>containsOwner(i.owner, principal)||containsOwner(i.participant, principal)||containsOwner(i.stage, '文书')).map(maskSensitive);
  if(role==='AFTER_SERVICE') return rows.filter(i=>afterServiceStages.includes(i.stage) && i.status==='已签约');
  if(role==='COPYWRITER') return rows.map(maskSensitive);
  return rows;
}

export function scopeApplications<T extends Record<string, any>>(rows: T[]): T[] {
  const role=getCurrentRole(); const principal=getCurrentPrincipal();
  if(role==='APPLICANT_TEACHER') return rows.filter(i=>containsOwner(i.owner, principal)||containsOwner(i.participant, principal)||containsOwner(i.owner, '老师'));
  if(role==='AFTER_SERVICE') return rows.filter(i=>afterServiceStages.includes(i.status)||afterServiceStages.includes(i.stage));
  if(role==='CONSULTANT') return [];
  return rows;
}

export function scopeKanban<T extends Record<string, any>>(data: Record<string, T[]>): Record<string, T[]> {
  const role=getCurrentRole(); const principal=getCurrentPrincipal();
  return Object.fromEntries(Object.entries(data).map(([stage, rows])=>{
    let scoped=rows;
    if(role==='APPLICANT_TEACHER') scoped=rows.filter(i=>containsOwner(i.owner, principal)||containsOwner(i.owner, '老师'));
    if(role==='AFTER_SERVICE') scoped=afterServiceStages.includes(stage) ? rows : [];
    return [stage, scoped];
  }));
}

export function scopeCms<T extends Record<string, any>>(rows: T[]): T[] {
  const role=getCurrentRole(); const principal=getCurrentPrincipal();
  if(role==='COPYWRITER') return rows.filter(i=>containsOwner(i.author, principal)||containsOwner(i.owner, principal)||i.status!=='已发布');
  return rows;
}

export function scopeTasks<T extends Record<string, any>>(rows: T[]): T[] {
  const role=getCurrentRole(); const principal=getCurrentPrincipal();
  if(role==='SUPER_ADMIN'||role==='OPERATOR') return rows;
  return rows.filter(i=>containsOwner(i.owner, principal));
}
