import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore(state => state.token);
  const role = useAuthStore(state => state.role);
  const loginByApi = useAuthStore(state => state.loginByApi);
  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorText, setErrorText] = useState('');

  const targetRoute = useMemo(() => {
    const stateFrom = (location.state as any)?.from;
    return stateFrom || getDefaultRoute(role);
  }, [location.state, role]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setChecking(true);
    fetchCurrentUser()
      .then(() => {
        if (!cancelled) navigate((location.state as any)?.from || getDefaultRoute(useAuthStore.getState().role), { replace: true });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, fetchCurrentUser, navigate, location.state]);

  const onFinish = async (values: { username: string; password: string; remember?: boolean }) => {
    setLoading(true);
    setErrorText('');
    try {
      const nextRole = await loginByApi(values.username, values.password);
      if (!values.remember) {
        sessionStorage.setItem('temp_login_username', values.username);
      }
      message.success('登录成功');
      navigate((location.state as any)?.from || getDefaultRoute(nextRole), { replace: true });
    } catch (error: any) {
      const text = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '登录失败，请检查账号和密码';
      setErrorText(String(text));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #081733 0%, #0d2f63 55%, #15478e 100%)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: '#fff' }}>
        <div style={{ maxWidth: 460 }}>
          <Typography.Title level={1} style={{ color: '#fff', marginBottom: 12 }}>留学中介运营中台</Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 0 }}>
            覆盖主题包、账号识别、内容确认、数据页上传、当日 Excel 导出等完整工作流。
          </Typography.Paragraph>
        </div>
      </div>
      <div style={{ width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ width: '100%', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }} styles={{ body: { padding: 32 } }}>
          <Space direction='vertical' size={18} style={{ width: '100%' }}>
            <div>
              <Typography.Title level={3} style={{ marginBottom: 4 }}>欢迎登录</Typography.Title>
              <Typography.Text type='secondary'>请输入后端账号密码进入系统</Typography.Text>
            </div>
            {errorText ? <Alert type='error' showIcon message={errorText} /> : null}
            <Form
              form={form}
              layout='vertical'
              initialValues={{ username: sessionStorage.getItem('temp_login_username') || '', remember: true }}
              onFinish={onFinish}
              autoComplete='off'
            >
              <Form.Item label='账号' name='username' rules={[{ required: true, message: '请输入账号' }]}>
                <Input size='large' placeholder='请输入用户名' disabled={loading || checking} />
              </Form.Item>
              <Form.Item label='密码' name='password' rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password size='large' placeholder='请输入密码' disabled={loading || checking} />
              </Form.Item>
              <Form.Item name='remember' valuePropName='checked'>
                <Checkbox disabled={loading || checking}>记住我</Checkbox>
              </Form.Item>
              <Button type='primary' htmlType='submit' size='large' block loading={loading || checking}>登录系统</Button>
            </Form>
            <Typography.Text type='secondary'>登录成功后默认跳转到：{targetRoute}</Typography.Text>
          </Space>
        </Card>
      </div>
    </div>
  );
}
