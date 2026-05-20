import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function RoleGuard({ children }: { children: JSX.Element }) {
  const { isLogin, role, token, fetchCurrentUser } = useAuthStore();
  const loc = useLocation();
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    setChecking(true);
    fetchCurrentUser().catch(() => undefined).finally(() => setChecking(false));
  }, [fetchCurrentUser, token]);

  if (checking) return <Spin fullscreen tip='正在校验登录态...' />;
  if (!isLogin && !token) return <Navigate to='/login' replace state={{ from: loc.pathname }} />;
  if (!isLogin) return <Spin fullscreen tip='正在恢复登录态...' />;
  if (loc.pathname !== '/' && !canAccessRoute(role, loc.pathname)) return <Navigate to='/403' replace />;
  return children;
}
