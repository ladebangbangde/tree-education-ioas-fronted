import { BellOutlined, LogoutOutlined, SearchOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Empty, Input, Layout, List, Space, Spin, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, type NotificationItem } from '@/api/notifications';
import { roleLabels } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';
const { Header } = Layout;

export default function AppHeader(){
  const nav=useNavigate();
  const {userName,role,department,logout}=useAuthStore();
  const [unreadCount,setUnreadCount]=useState(0);
  const [notifications,setNotifications]=useState<NotificationItem[]>([]);
  const [loadingNotifications,setLoadingNotifications]=useState(false);

  const loadUnreadCount=useCallback(async()=>{
    try{
      const summary=await notificationsApi.unreadCount({quiet:true});
      setUnreadCount(summary?.unreadCount||0);
    }catch{ setUnreadCount(0); }
  },[]);

  const loadNotifications=useCallback(async()=>{
    setLoadingNotifications(true);
    try{
      const page=await notificationsApi.list({pageNum:1,pageSize:10},{quiet:true});
      setNotifications(page.records||[]);
      await loadUnreadCount();
    }catch{
      setNotifications([]);
    }finally{
      setLoadingNotifications(false);
    }
  },[loadUnreadCount]);

  useEffect(()=>{
    loadUnreadCount();
    const timer=window.setInterval(loadUnreadCount,10000);
    return()=>window.clearInterval(timer);
  },[loadUnreadCount]);

  const openNotification=async(item:NotificationItem)=>{
    if(item.readStatus==='UNREAD'){
      await notificationsApi.markRead(item.id,{quiet:true});
      await loadUnreadCount();
    }
    if(item.actionUrl){ nav(item.actionUrl); return; }
    if(item.bizType==='lead'&&item.bizId){ nav(`/leads/detail/${item.bizId}`); }
  };

  const notificationPanel=<div style={{width:380,maxHeight:460,overflow:'auto',padding:12}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
      <Typography.Text strong>站内通知</Typography.Text>
      <Button type='link' size='small' onClick={async()=>{await notificationsApi.markAllRead({quiet:true});await loadNotifications();}}>全部已读</Button>
    </div>
    {loadingNotifications?<div style={{padding:32,textAlign:'center'}}><Spin/></div>:notifications.length===0?<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无通知'/>:<List
      itemLayout='vertical'
      dataSource={notifications}
      renderItem={(item)=><List.Item style={{cursor:'pointer',padding:'10px 4px'}} onClick={()=>openNotification(item)}>
        <Space direction='vertical' size={4} style={{width:'100%'}}>
          <Space style={{justifyContent:'space-between',width:'100%'}}>
            <Typography.Text strong={item.readStatus==='UNREAD'}>{item.title}</Typography.Text>
            {item.readStatus==='UNREAD'?<Badge status='processing'/>:null}
          </Space>
          {item.content?<Typography.Paragraph type='secondary' ellipsis={{rows:2}} style={{marginBottom:0,fontSize:12}}>{item.content}</Typography.Paragraph>:null}
          <Space size={8}>
            <Tag>{item.bizType}</Tag>
            <Typography.Text type='secondary' style={{fontSize:12}}>{item.createdAt?.replace('T',' ').slice(0,16)}</Typography.Text>
          </Space>
        </Space>
      </List.Item>}
    />}
  </div>;

  return <Header className='top'>
    <div className='header-left'>tree-education-ioas-fronted</div>
    <Space size={16}>
      <Input className='header-search' prefix={<SearchOutlined/>} placeholder='搜索学生 / 线索 / 任务' />
      <Dropdown trigger={['click']} dropdownRender={()=>notificationPanel} onOpenChange={(open)=>{if(open)loadNotifications();}}>
        <Badge count={unreadCount} overflowCount={99} showZero={false}><BellOutlined className='icon-btn'/></Badge>
      </Dropdown>
      <Tag color='blue'>{roleLabels[role]}</Tag>
      {department&&<Tag>{department}</Tag>}
      <Dropdown menu={{items:[
        {key:'profile',icon:<UserOutlined/>,label:'个人信息设置',onClick:()=>nav('/profile/settings')},
        {key:'tasks',icon:<FileTextOutlined/>,label:'任务中心',onClick:()=>nav('/tasks')},
        {type:'divider'},
        {key:'logout',icon:<LogoutOutlined/>,label:'退出登录',onClick:()=>{logout();nav('/login');}}
      ]}}>
        <Space className='click user-info'><Avatar icon={<UserOutlined/>}/>{userName}</Space>
      </Dropdown>
    </Space>
  </Header>;
}