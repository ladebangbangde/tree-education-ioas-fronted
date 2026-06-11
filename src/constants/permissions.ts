export type ButtonAction=string;
export const roles:any=['SUPER_ADMIN','MEDIA','OPERATOR','CONSULTANT','DATA','ADMINISTRATIVE','ANCHOR','IDLE_ANCHOR'];
export const roleLabels:any={IDLE_ANCHOR:'闲杂主播'};
export const canAccessRoute=(r:any,p:any)=>r!='IDLE_ANCHOR'||p=='/403';
export const canUseButton=(r:any)=>r!='IDLE_ANCHOR';
export const getDefaultRoute=(r:any)=>r=='IDLE_ANCHOR'?