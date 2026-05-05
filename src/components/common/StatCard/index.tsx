import { Card, Statistic, Typography } from 'antd';
export default function StatCard({title,value,suffix}:{title:string;value:number|string;suffix?:string}){
  return <Card className='stat-card'>
    <Typography.Text type='secondary'>{title}</Typography.Text>
    <Statistic value={value} suffix={suffix} />
  </Card>;
}
