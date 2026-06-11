import { Button, Card, Checkbox, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';

export default function LoginPage(){
  const nav = useNavigate();
  const loc = useLocation();
  const loginByApi = useAuthStore(s=>s.loginByApi);
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
          <Form.Item label='账号' name='username' rules={[{required:true,message:'请输入账号'}]}><Input placeholder='请输入后端账号'/></Form.Item>
          <Form.Item label='密码' name='password' rules={[{required:true,message:'请输入密码'}]}><Input.Password/></Form.Item>
          <Form.Item name='remember' valuePropName='checked'><Checkbox>记住我</Checkbox></Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>登录系统</Button>
        </Form>
      </Card>
    </div>
  </div>;
}
