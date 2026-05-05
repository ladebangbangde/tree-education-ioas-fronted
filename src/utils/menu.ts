import type { AppMenuItem, Role } from '@/types';
export const filterMenusByRole = (menus: AppMenuItem[], role: Role): AppMenuItem[] => menus.filter(m => !m.roles || m.roles.includes(role)).map(m => ({ ...m, children: m.children ? filterMenusByRole(m.children, role) : undefined }));
export const flatMenuPathMap = (menus: AppMenuItem[]) => {
  const map = new Map<string, string[]>();
  const walk = (list: AppMenuItem[], chain: string[]) => list.forEach(i => { const next=[...chain,i.label]; if(i.path) map.set(i.path,next); if(i.children) walk(i.children,next);});
  walk(menus,[]); return map;
};
