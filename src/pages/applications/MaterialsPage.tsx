import { Button, Checkbox, DatePicker, Form, Select, Space } from 'antd';
import { DataTable, PageHeader, SearchFilterBar, StatusTag } from '@/components';
import { materials } from '@/mock/applications';

export default function MaterialsPage(){
  const columns=[{title:'材料名称',dataIndex:'name'},{title:'状态',dataIndex:'status',render:(v:string)=><StatusTag status={v}/>},{title:'截止时间',dataIndex:'deadline'},{title:'负责人',dataIndex:'owner'},{title:'备注',dataIndex:'remark'},{title:'完成',render:()=> <Checkbox/>}];
  return <>
    <PageHeader title='材料清单'/>
    <SearchFilterBar><Form layout='inline'><Form.Item label='状态'><Select style={{width:120}} options={[{value:'已完成'},{value:'进行中'},{value:'待补充'}]} /></Form.Item><Form.Item label='负责人'><Select style={{width:140}} options={[{value:'学生'},{value:'教务老师'},{value:'家长'}]} /></Form.Item><Form.Item label='截止时间'><DatePicker.RangePicker/></Form.Item><Space><Button type='primary'>筛选</Button><Button>重置</Button></Space></Form></SearchFilterBar>
    <DataTable rowKey='id' columns={columns} dataSource={materials} pagination={{total:24}}/>
  </>
}
