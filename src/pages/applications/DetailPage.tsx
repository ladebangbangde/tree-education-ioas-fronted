import { Card, Steps, Tabs } from 'antd';import { PageHeader } from '@/components/common';
export default function(){return <><PageHeader title='申请详情'/><Card><Steps current={2} items={['选校','文书','网申','Offer','签证','行前'].map(title=>({title}))}/><Tabs className='mt12' items={['院校列表','文书列表','材料清单','节点记录','风险预警'].map((x,i)=>({key:String(i),label:x,children:x+'内容'}))}/></Card></>}
