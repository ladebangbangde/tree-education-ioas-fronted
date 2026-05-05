import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { AppHeader, AppSider } from '@/components/common';
export default function MainLayout(){return <Layout className='main-layout'><AppSider/><Layout><AppHeader/><Layout.Content className='content'><Outlet/></Layout.Content></Layout></Layout>}
