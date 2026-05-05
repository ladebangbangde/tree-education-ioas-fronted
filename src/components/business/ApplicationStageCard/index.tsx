import { Card, Progress, Tag } from 'antd';
export default function ApplicationStageCard({name,country,term,owner,progress}:{name:string;country:string;term:string;owner:string;progress:number}){return <Card size='small' className='kanban-card'><b>{name}</b><div>{country} · {term}</div><div>负责人：{owner}</div><Progress percent={progress} size='small'/><Tag color='blue'>申请中</Tag></Card>}
