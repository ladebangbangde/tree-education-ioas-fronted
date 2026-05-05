import { Avatar, Breadcrumb, Button, Card, Drawer, Empty, Layout, Menu, Space, Table, Tag, Timeline, Typography, Input, Dropdown } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { menuConfig } from '@/constants/menu';
import { useAuthStore } from '@/store/auth';
import React from 'react';
const { Sider, Header } = Layout;
export const AppSider = () => { const loc=useLocation(); const items=menuConfig as any; return <Sider width={240}><div className='logo'>IOAS中台</div><Menu theme='dark' mode='inline' selectedKeys={[loc.pathname]} items={items.map((i:any)=>({...i,key:i.path||i.key,children:i.children?.map((c:any)=>({...c,key:c.path}))}))} /></Sider>; };
export const AppHeader = () => { const nav=useNavigate(); const {userName,logout}=useAuthStore(); return <Header className='top'><Space><Input placeholder='全局搜索'/><BellOutlined/><Dropdown menu={{items:[{key:'1',label:'退出登录',onClick:()=>{logout();nav('/login');}}]}}><Space><Avatar icon={<UserOutlined/>}/>{userName}</Space></Dropdown></Space></Header>; };
export const PageHeader = ({title,extra}:{title:string;extra?:React.ReactNode})=>{const loc=useLocation();const paths=loc.pathname.split('/').filter(Boolean); return <Card className='mb12'><Breadcrumb items={paths.map((p,i)=>({title:i===paths.length-1?p:<Link to={'/'+paths.slice(0,i+1).join('/')}>{p}</Link>}))}/><div className='ph'><Typography.Title level={4}>{title}</Typography.Title>{extra}</div></Card>};
export const SearchFilterBar=({children}:{children:React.ReactNode})=><Card className='mb12'>{children}</Card>;
export const StatCard=({title,value}:{title:string;value:string|number})=><Card><div>{title}</div><Typography.Title level={3}>{value}</Typography.Title></Card>;
export const DataTable=(props:any)=><Card><Table {...props}/></Card>;
export const StatusTag=({status}:{status:string})=><Tag color={status.includes('进行')||status.includes('跟进')?'processing':'default'}>{status}</Tag>;
export const DetailDrawer=(props:any)=><Drawer width={520} {...props}/>;
export const TimelineCard=({items}:{items:any[]})=><Card><Timeline items={items}/></Card>;
export const EmptyBlock=()=> <Empty description='暂无数据'/>;
export const ChartCard=({title,children}:{title:string;children:React.ReactNode})=><Card title={title}>{children}</Card>;
export const ActionBtns=()=> <Space><Button>新建</Button><Button>导出</Button></Space>
