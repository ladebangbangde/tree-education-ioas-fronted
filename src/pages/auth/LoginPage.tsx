import { Button, Card, Checkbox, Form, Input, Select, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRoute, roleLabels, roles } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';
import type { Department, Role } from '@/types';

const departmentByRole: Record<Role, Department> = {
  SUPER_ADMIN: '系统管理部',
  MEDIA: '媒体部',
  OPERATOR: '运营部',
  CONSULTANT: '咨询中心'
};

export default function LoginPage(){
  const nav = useNavigate();
  const loc = useLocation();
  const login = useAuthStore(s=>s.login);

  return <div className='login'>
    <div className='login-left'><div><h1>留学中介运营中台</h1><p>覆盖线索、学生、申请、内容、报表全链路</p></div></div>
    <div className='login-right'>
      <Card className='login-card'>
        <Typography.Title level={3}>欢迎登录</Typography.Title>
        <Form
          layout='vertical'
          initialValues={{username:'运营',role:'OPERATOR',remember:true}}
          onFinish={(v)=>{
            const role = v.role as Role;
            login(v.username, v.password, role, { department: departmentByRole[role] });
            nav((loc.state as any)?.from || getDefaultRoute(role));
          }}
        >
          <Form.Item label='账号' name='username' rules={[{required:true,message:'请输入账号'}]}><Input placeholder='例如：林娜 / 陈思 / Amy顾问'/></Form.Item>
          <Form.Item label='密码' name='password' rules={[{required:true,message:'请输入密码'}]}><Input.Password/></Form.Item>
          <Form.Item label='后台身份' name='role' rules={[{required:true,message:'请选择身份'}]}><Select options={roles.map(value=>({value,label:`${roleLabels[value]}（${value}）`}))}/></Form.Item>
          <Form.Item name='remember' valuePropName='checked'><Checkbox>记住我</Checkbox></Form.Item>
          <Button type='primary' htmlType='submit' block>登录系统</Button>
        </Form>
      </Card>
    </div>
  </div>;
}
