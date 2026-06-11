import { matchPath } from 'react-router-dom';
import type { Role } from '@/types';

export type ButtonAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'restore'
  | 'purge'
  | 'upload'
  | 'download'
  | 'preview'
  | 'assign'
  | 'follow'
  | 'confirm'
  | 'reject'
  | 'export'
  | 'import'
  | 'review'
  | 'publish'
  | 'unpublish'
  | 'manage'
  | 'view'
  | string;

export const roles: Role[] = ['SUPER_ADMIN', 'MEDIA', 'OPERATOR', 'CONSULTANT', 'DATA', 'ADMINISTRATIVE', 'ANCHOR', 'IDLE_ANCHOR'];

export const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  MEDIA: 'Media',
  OPERATOR: 'Operator',
  CONSULTANT