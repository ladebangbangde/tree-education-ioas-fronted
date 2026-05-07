import type { ButtonAction } from '@/constants/permissions';
import { canAccessRoute, canUseButton } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export const usePermission = () => {
  const role = useAuthStore(s=>s.role);
  return {
    role,
    canAccessRoute: (path: string) => canAccessRoute(role, path),
    hasButtonPermission: (action: ButtonAction) => canUseButton(role, action)
  };
};
