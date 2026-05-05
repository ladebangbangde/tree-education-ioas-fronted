import { Card } from 'antd';
export default function ChartCard({title,children}:{title:string;children:React.ReactNode}){
  return <Card title={title} className='chart-card' bodyStyle={{minHeight:280}}>{children}</Card>;
}
