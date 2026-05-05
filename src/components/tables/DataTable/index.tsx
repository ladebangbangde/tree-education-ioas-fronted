import { Card, Empty, Table } from 'antd';
import type { TableProps } from 'antd';

export default function DataTable<T extends object>(props:TableProps<T>){
  return <Card className='table-card'>
    <Table<T>
      scroll={{x:1200}}
      size='middle'
      locale={{emptyText:<Empty description='暂无数据' />}}
      pagination={{showSizeChanger:true,showQuickJumper:true,...(props.pagination||{})}}
      {...props}
    />
  </Card>;
}
