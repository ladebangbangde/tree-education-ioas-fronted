import { Card, Table } from 'antd';import type { TableProps } from 'antd';
export default function DataTable<T extends object>(props:TableProps<T>){return <Card><Table<T> scroll={{x:1200}} {...props}/></Card>}
