import { Button, Form, Input, Select, Space, Tag } from 'antd';
import { DataTable, PageHeader, SearchFilterBar } from '@/components';
import { offers } from '@/mock/applications';

export default function OffersPage(){
  const color=(s:string)=>s==='已录取'?'green':s==='有条件录取'?'gold':'blue';
  const columns=[{title:'学校',dataIndex:'school'},{title:'专业',dataIndex:'major'},{title:'Offer状态',dataIndex:'status',render:(v:string)=><Tag color={color(v)}>{v}</Tag>},{title:'奖学金',dataIndex:'scholarship'},{title:'结果时间',dataIndex:'resultAt'},{title:'备注',dataIndex:'remark'},{title:'操作',render:()=> <Button type='link'>查看详情</Button>}];
  return <>
    <PageHeader title='Offer管理'/>
    <SearchFilterBar><Form layout='inline'><Form.Item label='学校'><Input placeholder='输入学校名称'/></Form.Item><Form.Item label='状态'><Select style={{width:140}} options={[{value:'已录取'},{value:'有条件录取'},{value:'审理中'}]}/></Form.Item><Space><Button type='primary'>查询</Button><Button>重置</Button></Space></Form></SearchFilterBar>
    <DataTable rowKey='id' columns={columns} dataSource={offers} pagination={{total:18}}/>
  </>
}
