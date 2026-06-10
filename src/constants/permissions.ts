import type { Role } from '@/types';
export const roles: Role[]=['SUPER_ADMIN','MEDIA','OPERATOR','CONSULTANT','DATA','ADMINISTRATIVE','ANCHOR'];
export const roleLabels: Record<Role,string>={SUPER_ADMIN:'Super Admin',MEDIA:'Media',OPERATOR:'Operator',CONSULTANT:'Consultant',DATA:'Data Operator',ADMINISTRATIVE:'Administrative',ANCHOR:'Anchor'};
export type ButtonAction='view'|'create'|'edit'|'delete'|'export'|'assign'|'publish'|'audit';
export const defaultRouteByRole: Record<Role