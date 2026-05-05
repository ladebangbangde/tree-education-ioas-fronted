import type { ReactNode } from 'react';
export type Role = 'SUPER_ADMIN'|'OPERATOR'|'CONSULTANT'|'APPLICANT_TEACHER'|'COPYWRITER'|'AFTER_SERVICE';
export interface AppMenuItem { key:string; label:string; path?:string; icon?:ReactNode; children?:AppMenuItem[]; roles?:Role[]; }
export interface LeadItem { id:string; studentName:string; phone:string; intentCountry:string; degree:string; source:string; score:number; status:string; advisor:string; lastFollowAt:string; nextFollowAt:string; createdAt:string; }
