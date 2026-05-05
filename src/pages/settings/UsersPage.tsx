import { Button, Form, Input, Modal, Select, Switch } from 'antd';
import { useState } from 'react';
import { DataTable, PageHeader } from '@/components';
import { users } from '@/mock/settings';

export default function UsersPage(){
  const [open,setOpen]=useState(false);
  const columns=[{title:'用户姓名',dataIndex:'name'},{title:'手机号',dataIndex:'mobile'},{title:'角色',dataIndex:'role'},{title:'部门',dataIndex:'dept'},{title:'最后登录',dataIndex:'lastLogin'},{title:'启停',dataIndex:'enabled',render:(v:boolean)=><Switch checked={v}/>},{title:'操作',render:()=> <Button type='link'>编辑</Button>}];
  return <><PageHeader title='用户管理' extra={<Button type='primary' onClick={()=>setOpen(true)}>新建用户</Button>}/><DataTable rowKey='id' columns={columns} dataSource={users}/><Modal title='新建用户' open={open} onCancel={()=>setOpen(false)} onOk={()=>setOpen(false)}><Form layout='vertical'><Form.Item label='姓名'><Input/></Form.Item><Form.Item label='手机号'><Input/></Form.Item><Form.Item label='角色'><Select options={[{value:'CONSULTANT'},{value:'COPYWRITER'},{value:'APPLICANT_TEACHER'}]}/></Form.Item><Form.Item label='部门'><Input/></Form.Item></Form></Modal></>
}
