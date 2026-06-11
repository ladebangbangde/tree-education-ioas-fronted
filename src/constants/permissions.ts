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

