import { Breadcrumb, Card, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import { menuConfig } from '@/constants/menu';
import { flatMenuPathMap } from '@/utils/menu';
import { useMemo } from 'react';

export default function PageHeader({title,extra}:{title:string;extra?:React.ReactNode}){
  const {pathname}=useLocation();
  const map=useMemo(()=>flatMenuPathMap(menuConfig),[]);
  const crumbs=map.get(pathname)||pathname.split('/').filter(Boolean);
  return <Card className='page-header'>
    <Breadcrumb items={crumbs.map(c=>({title:c}))} />
    <div className='page-title-wrap'>
      <div>
        <Typography.Title level={4}>{title}</Typography.Title>
        <Typography.Text type='secondary'>留学中介运营中台 · 业务协同页面</Typography.Text>
      </div>
      <div className='page-header-extra'>{extra}</div>
    </div>
  </Card>;
}
