import { BellOutlined, LogoutOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Input, Layout, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { roleLabels } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';
const { Header } = Layout;

export default function AppHeader(){
  const nav=useNavigate();
  const {userName,role,department,logout}=useAuthStore();
  return <Header className='top'>
    <div className='header-left'>tree-education-ioas-fronted</div>
    <Space size={16}>
      <Input className='header-search' prefix={<SearchOutlined/>} placeholder='搜索学生 / 线索 / 任务' />
      <Badge count={6}><BellOutlined className='icon-btn'/></Badge>
      <Tag color='blue'>{roleLabels[role]}</Tag>
      {department&&<Tag>{department}</Tag>}
      <Dropdown menu={{items:[{key:'logout',icon:<LogoutOutlined/>,label:'退出登录',onClick:()=>{logout();nav('/login');}}]}}>
        <Space className='click user-info'><Avatar icon={<UserOutlined/>}/>{userName}</Space>
      </Dropdown>
    </Space>
  </Header>;
}
