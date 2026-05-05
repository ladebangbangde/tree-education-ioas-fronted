import { Button, Form, Input, Select, Space, Tag } from 'antd';
import { DataTable, PageHeader, SearchFilterBar } from '@/components';
import { articleCategories, articles } from '@/mock/cms';

export default function ArticlesPage(){
  const columns=[{title:'标题',dataIndex:'title'},{title:'分类',dataIndex:'category'},{title:'作者',dataIndex:'author'},{title:'状态',dataIndex:'status',render:(v:string)=><Tag color={v==='已发布'?'green':v==='草稿'?'default':'blue'}>{v}</Tag>},{title:'发布时间',dataIndex:'publishAt'},{title:'SEO',dataIndex:'seo'},{title:'PV',dataIndex:'pv'},{title:'操作',render:()=> <Space><Button type='link'>编辑</Button><Button type='link'>预览</Button><Button type='link'>发布</Button><Button type='link' danger>下线</Button></Space>}];
  return <>
    <PageHeader title='CMS / 文章管理' extra={<Button type='primary'>新建文章</Button>} />
    <SearchFilterBar><Form layout='inline'><Form.Item label='分类'><Select style={{width:160}} options={articleCategories.map(i=>({value:i}))}/></Form.Item><Form.Item label='关键词'><Input placeholder='输入标题关键词'/></Form.Item><Space><Button type='primary'>筛选</Button><Button>重置</Button></Space></Form></SearchFilterBar>
    <DataTable rowKey='id' columns={columns} dataSource={articles} />
  </>
}
