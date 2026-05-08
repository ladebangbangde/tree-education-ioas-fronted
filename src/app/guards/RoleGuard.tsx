import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function RoleGuard({children}:{children:JSX.Element}){
  const { isLogin, role } = useAuthStore();
  const loc = useLocation();
  if(!isLogin) return <Navigate to='/login' replace state={{from:loc.pathname}}/>;
  if(loc.pathname !== '/' && !canAccessRoute(role, loc.pathname)) return <Navigate to='/403' replace />;
  return children;
}
