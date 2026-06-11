import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export type ButtonAction = string;

export const roles: Role[] = [
  'SUPER_ADMIN',
  'MEDIA',
  'OPERATOR',
  'CONSULTANT',
  'DATA',
  'ADMINISTRATIVE',
  'ANCHOR',
  'IDLE_ANCHOR'
];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MEDIA: 'Media',
  OP