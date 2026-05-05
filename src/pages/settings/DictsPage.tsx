import { Button, Card, Col, Row, Space, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import { dictItems, dictTypes } from '@/mock/settings';

export default function DictsPage(){
  const [active, setActive] = useState('country');
  const data = useMemo(()=>dictItems[active as keyof typeof dictItems] || [], [active]);
  const columns=[{title:'名称',dataIndex:'name'},{title:'编码',dataIndex:'code'},{title:'状态',dataIndex:'status',render:(v:string)=><Tag color='green'>{v}</Tag>},{title:'排序',dataIndex:'sort'},{title:'备注',dataIndex:'remark'},{title:'操作',render:()=> <Space><Button type='link'>编辑</Button><Button type='link' danger>删除</Button></Space>}];

  return <>
    <PageHeader title='字典配置中心'/>
    <Row gutter={12}>
      <Col span={6}><Card title='字典类型'>{dictTypes.map(t=><p key={t.code} className={`dict-type-item ${active===t.code?'active':''}`} onClick={()=>setActive(t.code)}>{t.name}</p>)}</Card></Col>
      <Col span={18}><Card title='字典项' extra={<Space><Button type='primary'>新增字典项</Button><Button>批量编辑</Button></Space>}><Table rowKey='id' pagination={false} dataSource={data} columns={columns}/></Card></Col>
    </Row>
  </>
}
