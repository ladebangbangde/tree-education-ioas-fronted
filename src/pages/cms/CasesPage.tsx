import { Button, Space, Tag } from 'antd';
import { DataTable, PageHeader } from '@/components';
import { cases } from '@/mock/cms';

export default function CasesPage(){
  const columns=[{title:'案例标题',dataIndex:'title'},{title:'国家',dataIndex:'country'},{title:'院校',dataIndex:'school'},{title:'专业',dataIndex:'major'},{title:'顾问',dataIndex:'advisor'},{title:'发布时间',dataIndex:'publishAt'},{title:'状态',dataIndex:'status',render:(v:string)=><Tag color={v==='已发布'?'green':'blue'}>{v}</Tag>},{title:'操作',render:()=> <Space><Button type='link'>预览</Button><Button type='link'>编辑</Button></Space>}];
  return <><PageHeader title='CMS / 成功案例管理'/><DataTable rowKey='id' columns={columns} dataSource={cases} /></>
}
