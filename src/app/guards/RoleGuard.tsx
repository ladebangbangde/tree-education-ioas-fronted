import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function RoleGuard({children}:{children:JSX.Element}){
  const { isLogin, role, token, userName, fetchCurrentUser } = useAuthStore();
  const loc = useLocation();
  const [checking, setChecking] = useState(Boolean(token && (!userName || userName === '用户')));

  useEffect(() => {
    if (!token || (userName && userName !== '用户')) return;
    setChecking(true);
    fetchCurrentUser().catch(() => undefined).finally(() => setChecking(false));
  }, [fetchCurrentUser, token, userName]);

  if(!isLogin) return <Navigate to='/login' replace state={{from:loc.pathname}}/>;
  if(checking) return <Spin fullscreen tip='正在校验登录态...' />;
  if(loc.pathname !== '/' && !canAccessRoute(role, loc.pathname)) return <Navigate to='/403' replace />;
  return children;
}
