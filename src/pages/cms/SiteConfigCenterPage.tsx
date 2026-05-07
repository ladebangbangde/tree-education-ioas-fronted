import { Button, Card, Col, Row, Space, Switch, Tag } from 'antd';
import { PageHeader } from '@/components';
import { siteConfigs } from '@/mock/cms';

export default function SiteConfigCenterPage(){
  return <><PageHeader title='站点配置中心' extra={<Space><Button>查看发布记录</Button><Button type='primary'>保存站点配置</Button></Space>} /><Row gutter={[16,16]}>{siteConfigs.map(item=><Col span={8} key={item.key}><Card title={item.name} extra={<Tag color={item.status==='已启用'?'green':'blue'}>{item.status}</Tag>}><p>{item.desc}</p><p>负责人：{item.owner}</p><Switch checkedChildren='启用' unCheckedChildren='停用' defaultChecked={item.status==='已启用'} /></Card></Col>)}</Row></>;
}
