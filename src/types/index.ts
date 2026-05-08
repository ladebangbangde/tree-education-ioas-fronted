import type { ReactNode } from 'react';
export type Role = 'SUPER_ADMIN'|'MEDIA'|'OPERATOR'|'CONSULTANT';
export type Department = '咨询中心'|'申请交付中心'|'文案部'|'签证部'|'媒体部'|'运营部'|'系统管理部';
export type DataScope = 'ALL'|'DEPARTMENT'|'MINE';
export interface AppMenuItem { key:string; label:string; path?:string; icon?:ReactNode; children?:AppMenuItem[]; roles?:Role[]; }
export interface LeadItem { id:string; studentName:string; phone:string; intentCountry:string; degree:string; source:string; score:number; status:string; advisor:string; lastFollowAt:string; nextFollowAt:string; createdAt:string; ownerId?:string; ownerName?:string; createdBy?:string; role?:Role; createdRole?:Role; department?:Department; }
