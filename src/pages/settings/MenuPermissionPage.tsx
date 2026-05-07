import { Button, Card, Col, Row, Space, Table, Tree } from 'antd';
import { PageHeader } from '@/components';
import { menuPermissionTree, menuPermissionRows } from '@/mock/settings';

export default function MenuPermissionPage(){
  return <><PageHeader title='菜单权限配置' extra={<Space><Button>恢复默认</Button><Button type='primary'>保存菜单权限</Button></Space>} /><Row gutter={[16,16]}><Col span={8}><Card title='菜单树'><Tree checkable defaultExpandAll defaultCheckedKeys={['dashboard','leads','cms']} treeData={menuPermissionTree}/></Card></Col><Col span={16}><Card title='按钮权限矩阵'><Table rowKey='key' pagination={false} dataSource={menuPermissionRows} columns={[{title:'模块',dataIndex:'module'},{title:'查看',dataIndex:'view'},{title:'新增',dataIndex:'create'},{title:'编辑',dataIndex:'edit'},{title:'导出',dataIndex:'export'}]} /></Card></Col></Row></>;
}
