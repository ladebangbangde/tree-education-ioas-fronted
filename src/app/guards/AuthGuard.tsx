import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
export default function AuthGuard({children}:{children:JSX.Element}){const token=useAuthStore(s=>s.token);return token?children:<Navigate to='/login' replace/>;}
