import type{Role}from'@/types';
export type ButtonAction=string;
export const roles=['SUPER_ADMIN','MEDIA','OPERATOR','CONSULTANT','DATA','ADMINISTRATIVE','ANCHOR','IDLE_ANCHOR'] as Role[];
export const roleLabels=roles.reduce((m,r)=>({...m,[r]:r==='IDLE_ANCHOR'?'闲杂主播':r}),{} as Record<Role,string>);
export function canAccessRoute(r:Role,p:string){return r==='IDLE_ANCHOR'?p==='/403':