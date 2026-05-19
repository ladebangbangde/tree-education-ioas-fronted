import { Button, Card, Checkbox, Form, Input, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function LoginPage(){
  const nav = useNavigate();
  const loc = useLocation();
  const loginByApi = useAuthStore(s=>s.loginByApi);
  const mockLogin = useAuthStore(s=>s.login);
  const [loading, setLoading] = useState(false);

  return <div className='login'>
    <div className='login-left'><div><h1>留学中介运营中台</h1><p>覆盖线索、学生、申请、内容、报表全链路</p></div></div>
    <div className='login-right'>
      <Card className='login-card'>
        <Typography.Title level={3}>欢迎登录</Typography.Title>
        <Form
          layout='vertical'
          initialValues={{remember:true}}
          onFinish={async (v)=>{
            setLoading(true);
            try {
              const role = await loginByApi(v.username, v.password);
              message.success('登录成功');
              nav((loc.state as any)?.from || getDefaultRoute(role), { replace: true });
            } catch (error: any) {
              message.error(error?.response?.data?.message || error?.response?.data?.msg || error?.message || '登录失败，请检查账号密码');
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item label='账号' name='username' rules={[{required:true,message:'请输入账号'}]}><Input placeholder='admin / media / operator / consultant 任一演示账号'/></Form.Item>
          <Form.Item label='密码' name='password' rules={[{required:true,message:'请输入密码'}]}><Input.Password/></Form.Item>
          <Form.Item name='remember' valuePropName='checked'><Checkbox>记住我</Checkbox></Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>登录演示系统</Button>
        </Form>
        <Typography.Paragraph type='secondary' style={{ marginTop: 16 }}>演示版固定使用本地 mock 登录，不会请求后端。也可以直接选择角色进入：</Typography.Paragraph>
        <Space wrap>
          {[
            ['SUPER_ADMIN', '超管'],
            ['MEDIA', '媒体'],
            ['OPERATOR', '运营'],
            ['CONSULTANT', '顾问']
          ].map(([role, label]) => <Button key={role} onClick={() => { mockLogin(`${label}演示账号`, 'mock', role as any); nav(getDefaultRoute(role as any), { replace: true }); }}>{label}演示</Button>)}
        </Space>
      </Card>
    </div>
  </div>;
}
