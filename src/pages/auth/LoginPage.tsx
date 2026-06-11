import { Button, Card, Form, Input, message, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const loginByApi = useAuthStore(state => state.loginByApi);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const role = await loginByApi(values.username, values.password);
      message.success('登录成功');
      navigate(getDefaultRoute(role), { replace: true });
    } catch (error: any) {
      const text = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '登录失败';
      message.error(String(text));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b2347', padding: 24 }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3}>后台登录</Typography.Title>
        <Form layout='vertical' onFinish={onFinish} autoComplete='off'>
          <Form.Item label='账号' name='username' rules={[{ required: true, message: '请输入账号' }]}>
            <Input size='large' placeholder='请输入用户名' />
          </Form.Item>
          <Form.Item label='密码' name='password' rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size='large' placeholder='请输入密码' />
          </Form.Item>
          <Button type='primary' htmlType='submit' size='large' block loading={loading}>登录</Button>
        </Form>
      </Card>
    </div>
  );
}
