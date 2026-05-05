import { Card, List, Tag } from 'antd';
export default function TaskListCard({title,data}:{title:string;data:{task:string;deadline:string;priority:string}[]}){return <Card title={title}><List size='small' dataSource={data} renderItem={(i)=><List.Item><span>{i.task}</span><div><Tag color={i.priority==='高'?'red':'blue'}>{i.priority}</Tag>{i.deadline}</div></List.Item>}/></Card>}
