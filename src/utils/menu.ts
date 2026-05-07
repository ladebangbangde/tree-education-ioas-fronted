import type { AppMenuItem, Role } from '@/types';
import { canAccessRoute } from '@/constants/permissions';

export const filterMenusByRole = (menus: AppMenuItem[], role: Role): AppMenuItem[] => menus
  .map(m => ({ ...m, children: m.children ? filterMenusByRole(m.children, role) : undefined }))
  .filter(m => {
    const selfAllowed = !m.path || canAccessRoute(role, m.path);
    const hasAllowedChildren = Boolean(m.children?.length);
    return selfAllowed && (m.path ? true : hasAllowedChildren);
  });

export const flatMenuPathMap = (menus: AppMenuItem[]) => {
  const map = new Map<string, string[]>();
  const walk = (list: AppMenuItem[], chain: string[]) => list.forEach(i => { const next=[...chain,i.label]; if(i.path) map.set(i.path,next); if(i.children) walk(i.children,next);});
  walk(menus,[]); return map;
};
