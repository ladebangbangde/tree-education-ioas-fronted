import { BellOutlined, LogoutOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Input, Layout, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/api/notifications';
import { roleLabels } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';
const { Header } = Layout;

export default function AppHeader(){
  const nav=useNavigate();
  const {userName,role,department,logout}=useAuthStore();
  const [unreadCount,setUnreadCount]=useState(0);

  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try{
        const summary=await notificationsApi.summary({quiet:true});
        if(alive)setUnreadCount(summary?.unreadCount||0);
      }catch{ if(alive)setUnreadCount(0); }
    };
    load();
    const timer=window.setInterval(load,10000);
    return()=>{alive=false;window.clearInterval(timer);};
  },[]);

  return <Header className='top'>
    <div className='header-left'>tree-education-ioas-fronted</div>
    <Space size={16}>
      <Input className='header-search' prefix={<SearchOutlined/>} placeholder='搜索学生 / 线索 / 任务' />
      <Badge count={unreadCount} overflowCount={99} showZero={false}><BellOutlined className='icon-btn'/></Badge>
      <Tag color='blue'>{roleLabels[role]}</Tag>
      {department&&<Tag>{department}</Tag>}
      <Dropdown menu={{items:[{key:'logout',icon:<LogoutOutlined/>,label:'退出登录',onClick:()=>{logout();nav('/login');}}]}}>
        <Space className='click user-info'><Avatar icon={<UserOutlined/>}/>{userName}</Space>
      </Dropdown>
    </Space>
  </Header>;
}
