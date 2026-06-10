import type { Role } from '@/types';
export const roles: Role[]=['SUPER_ADMIN','MEDIA','OPERATOR','CONSULTANT','DATA','ADMINISTRATIVE','ANCHOR'];
export const roleLabels: Record<Role,string>={SUPER_ADMIN:'Super Admin',MEDIA:'Media',OPERATOR:'Operator',CONSULTANT:'Consultant',DATA:'Data',ADMINISTRATIVE:'Administrative',ANCHOR:'Anchor'};
export type ButtonAction=string;
export const defaultRouteByRole: Record<Role,string>={SUPER_ADMIN:'/dashboard',MEDIA:'/media/content',OPERATOR:'/operator/leads',CONSULTANT:'/dashboard',DATA:'/data-ops/operation-data',ADMINISTRATIVE:'/dashboard',ANCHOR:'/dashboard'};
export const getDefaultRoute=(role?:Role)=>role?defaultRouteByRole[role]:'/dashboard';
export const rolePageMatrix: Record<Role,string[]>={SUPER_ADMIN:['*'],MEDIA:['/media','/media/content','/media-assets','/tasks','