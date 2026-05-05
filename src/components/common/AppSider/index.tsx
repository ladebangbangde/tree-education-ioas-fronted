import { Layout, Menu } from 'antd';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { menuConfig } from '@/constants/menu';
import { useAuthStore } from '@/store/auth';
import { filterMenusByRole } from '@/utils/menu';
const { Sider } = Layout;

export default function AppSider(){
  const { pathname }=useLocation();
  const nav=useNavigate();
  const role=useAuthStore(s=>s.role);
  const menus=useMemo(()=>filterMenusByRole(menuConfig,role),[role]);
  const items=menus.map((i:any)=>({...i,key:i.path||i.key,children:i.children?.map((c:any)=>({...c,key:c.path}))}));
  return <Sider width={248} className='app-sider'>
    <div className='logo'>
      <div className='logo-main'>Tree Education IOAS</div>
      <div className='logo-sub'>运营中台后台系统</div>
    </div>
    <Menu theme='dark' mode='inline' selectedKeys={[pathname]} onClick={({key})=>typeof key==='string'&&key.startsWith('/')&&nav(key)} items={items}/>
  </Sider>;
}
