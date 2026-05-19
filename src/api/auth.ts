import { mockAuth } from '@/mock/mediaFlowApi';

export interface LoginPayload { username: string; password: string; }
export interface AuthUserDto { id?: string | number; userId?: string | number; username?: string; userName?: string; name?: string; role?: string; department?: string; deptName?: string; }
export interface LoginResultDto { token?: string; accessToken?: string; access_token?: string; jwt?: string; user?: AuthUserDto; role?: string; userName?: string; username?: string; department?: string; id?: string | number; }

export const authApi = {
  login: (payload: LoginPayload) => mockAuth.login(payload.username),
  me: () => mockAuth.me()
};
