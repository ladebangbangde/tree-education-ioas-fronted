import { Card, Space } from 'antd';
export default function SearchFilterBar({children,extra}:{children:React.ReactNode;extra?:React.ReactNode}){
  return <Card className='filter-bar'>
    <div className='filter-main'><Space wrap size={[12,12]}>{children}</Space></div>
    {extra && <div className='filter-extra'>{extra}</div>}
  </Card>;
}
