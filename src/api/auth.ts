import client, { unwrapResponse } from './client';

export interface LoginPayload { username: string; password: string; }
export interface AuthUserDto { id?: string | number; userId?: string | number; username?: string; userName?: string; name?: string; role?: string; department?: string; deptName?: string; }
export interface LoginResultDto { token?: string; accessToken?: string; access_token?: string; jwt?: string; user?: AuthUserDto; role?: string; userName?: string; username?: string; department?: string; id?: string | number; }

export const authApi = {
  async login(payload: LoginPayload) {
    const res = await client.post('/auth/login', payload);
    return unwrapResponse<LoginResultDto>(res.data);
  },
  async me() {
    const res = await client.get('/auth/me');
    return unwrapResponse<AuthUserDto>(res.data);
  }
};
