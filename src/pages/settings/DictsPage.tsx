import { Tabs } from 'antd';import { DataTable, PageHeader } from '@/components/common';
const table=<DataTable rowKey='k' columns={[{title:'编码',dataIndex:'k'},{title:'名称',dataIndex:'v'}]} dataSource={[{k:'UK',v:'英国'}]} />;
export default function(){return <><PageHeader title='字典配置'/><Tabs items={[{key:'1',label:'国家字典',children:table},{key:'2',label:'线索状态字典',children:table},{key:'3',label:'渠道字典',children:table},{key:'4',label:'申请阶段字典',children:table}]}/></>}
