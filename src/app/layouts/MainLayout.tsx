import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { AppHeader, AppSider } from '@/components';

export default function MainLayout(){
  return <Layout className='main-layout'>
    <AppSider/>
    <Layout className='main-layout-right'>
      <AppHeader/>
      <Layout.Content className='content'>
        <div className='content-inner'>
          <Outlet/>
        </div>
      </Layout.Content>
    </Layout>
  </Layout>;
}
