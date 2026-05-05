import { Button, Card, Col, Form, Input, Row, Select } from 'antd';
import { DataTable, PageHeader, SearchFilterBar, StatusTag } from '@/components/common';
const data=[{key:'1',name:'张同学',country:'英国',status:'跟进中',owner:'Amy顾问',time:'2026-05-05'}];
export default function Page(){
const cols=[{title:'姓名',dataIndex:'name'},{title:'国家',dataIndex:'country'},{title:'状态',dataIndex:'status',render:(v:string)=><StatusTag status={v}/>},{title:'负责人',dataIndex:'owner'},{title:'更新时间',dataIndex:'time'},{title:'操作',render:()=> <Button size='small'>查看</Button>}];
return <><PageHeader title='操作日志'/><SearchFilterBar><Form layout='inline'><Form.Item label='关键词'><Input/></Form.Item><Form.Item label='状态'><Select style={{width:140}} options={[{{value:'跟进中'}}]}/></Form.Item><Button type='primary'>查询</Button><Button>重置</Button></Form></SearchFilterBar><DataTable rowKey='key' columns={cols} dataSource={data} pagination={{total:1}}/></>;
}}
