import { Button, DatePicker, Form, Input, Select } from 'antd';
import { DataTable, PageHeader, SearchFilterBar } from '@/components';
import { logs } from '@/mock/settings';

export default function LogsPage(){
  const columns=[{title:'操作人',dataIndex:'operator'},{title:'模块',dataIndex:'module'},{title:'操作类型',dataIndex:'type'},{title:'描述',dataIndex:'desc'},{title:'IP',dataIndex:'ip'},{title:'时间',dataIndex:'time'},{title:'结果',dataIndex:'result'}];
  return <>
    <PageHeader title='审计日志'/>
    <SearchFilterBar>
      <Form layout='inline'>
        <Form.Item label='操作人'><Input/></Form.Item>
        <Form.Item label='模块'><Select style={{width:140}} options={[{value:'线索中心'},{value:'学生档案'},{value:'CMS文章'}]}/></Form.Item>
        <Form.Item label='操作类型'><Select style={{width:140}} options={[{value:'分配'},{value:'更新'},{value:'发布'}]}/></Form.Item>
        <Form.Item label='结果'><Select style={{width:120}} options={[{value:'成功'},{value:'失败'}]}/></Form.Item>
        <Form.Item label='时间范围'><DatePicker.RangePicker/></Form.Item>
        <Button type='primary'>查询</Button><Button>重置</Button>
      </Form>
    </SearchFilterBar>
    <DataTable rowKey='id' columns={columns} dataSource={logs}/>
  </>
}
