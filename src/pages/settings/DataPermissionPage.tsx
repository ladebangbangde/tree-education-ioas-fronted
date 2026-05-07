import { Button, Card, Checkbox, Col, Form, Row, Select, Space, Tag } from 'antd';
import { PageHeader } from '@/components';
import { dataPermissionScopes } from '@/mock/settings';

export default function DataPermissionPage(){
  return <><PageHeader title='数据权限配置' extra={<Space><Button>查看变更记录</Button><Button type='primary'>保存配置</Button></Space>} /><Row gutter={[16,16]}><Col span={10}><Card title='权限范围'><Form layout='vertical'><Form.Item label='适用角色'><Select defaultValue='STAFF' options={['SUPER_ADMIN','STAFF','OPERATOR'].map(value=>({value}))}/></Form.Item><Form.Item label='可见部门'><Checkbox.Group options={dataPermissionScopes.departments} defaultValue={['咨询一部']}/></Form.Item><Form.Item label='可见业务'><Checkbox.Group options={dataPermissionScopes.modules} defaultValue={['线索中心','学生档案']}/></Form.Item></Form></Card></Col><Col span={14}><Card title='配置说明'>{dataPermissionScopes.rules.map(rule=><p key={rule}><Tag color='blue'>规则</Tag>{rule}</p>)}</Card></Col></Row></>;
}
