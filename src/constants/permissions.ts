import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export const roles: Role[] = ['SUPER_ADMIN','MEDIA','OPERATOR','CONSULTANT','DATA','ADMINISTRATIVE','ANCHOR'];
export const roleLabels = { SUPER_ADMIN:'Super Admin', MEDIA:'Media', OPERATOR:'Operator', CONSULTANT:'Consultant', DATA:'Data Operator', ADMINISTRATIVE:'Administrative', ANCHOR:'Anchor' } as Record<Role,string>;
