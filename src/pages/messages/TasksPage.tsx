import { Tabs, Tag } from 'antd';
import { DataTable, PageHeader } from '@/components';
import { tasks } from '@/mock/tasks';

export default function TasksPage(){
  const columns=[{title:'任务内容',dataIndex:'task'},{title:'负责人',dataIndex:'owner'},{title:'优先级',dataIndex:'priority',render:(v:string)=><Tag color={v==='高'?'red':v==='中'?'gold':'blue'}>{v}</Tag>},{title:'截止时间',dataIndex:'deadline'},{title:'任务状态',dataIndex:'status',render:(v:string)=><Tag color={v==='已完成'?'green':v==='超时'?'red':'blue'}>{v}</Tag>}];
  return <><PageHeader title='任务中心'/><Tabs items={[{key:'todo',label:`待办(${tasks.todo.length})`,children:<DataTable rowKey='task' columns={columns} dataSource={tasks.todo} pagination={false}/>},{key:'done',label:`已办(${tasks.done.length})`,children:<DataTable rowKey='task' columns={columns} dataSource={tasks.done} pagination={false}/>},{key:'timeout',label:`超时(${tasks.timeout.length})`,children:<DataTable rowKey='task' columns={columns} dataSource={tasks.timeout} pagination={false}/>}]} /></>
}
