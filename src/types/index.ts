export type Role = 'SUPER_ADMIN'|'OPERATOR'|'CONSULTANT'|'APPLICANT_TEACHER'|'COPYWRITER'|'AFTER_SERVICE';
export interface MenuItem { key:string; label:string; path?:string; icon?:React.ReactNode; children?:MenuItem[]; roles?:Role[] }
