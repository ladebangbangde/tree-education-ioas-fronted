import { Navigate, useLocation } from 'react-router-dom';import { useAuthStore } from '@/store/auth';
export default function AuthGuard({children}:{children:JSX.Element}){const {isLogin}=useAuthStore();const loc=useLocation();if(!isLogin) return <Navigate to='/login' replace state={{from:loc.pathname}}/>;return children;}
