import type{Role}from'@/types';
export type ButtonAction=string;
export const roles:Role[]=['SUPER_ADMIN','MEDIA','OPERATOR','CONSULTANT','DATA','ADMINISTRATIVE','ANCHOR','IDLE_ANCHOR'];
export const roleLabels=Object.fromEntries(roles.map(r=>[r,r==='IDLE_ANCHOR'?'闲杂主播':r])) as Record<Role,string>;
export function canAccessRoute(role:Role,path:string){return role==='IDLE_ANCHOR'?path==='/403':true}
export function canUseButton(role:Role){