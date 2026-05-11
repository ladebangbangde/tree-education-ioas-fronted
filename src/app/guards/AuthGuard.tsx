import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export default function AuthGuard({children}:{children:JSX.Element}){
  const {isLogin, token, userName, fetchCurrentUser}=useAuthStore();
  const loc=useLocation();
  const [checking, setChecking] = useState(Boolean(token && (!userName || userName === '用户')));
  useEffect(() => {
    if (!token || (userName && userName !== '用户')) return;
    setChecking(true);
    fetchCurrentUser().catch(() => undefined).finally(() => setChecking(false));
  }, [fetchCurrentUser, token, userName]);
  if(!isLogin) return <Navigate to='/login' replace state={{from:loc.pathname}}/>;
  if(checking) return <Spin fullscreen tip='正在校验登录态...' />;
  return children;
}
