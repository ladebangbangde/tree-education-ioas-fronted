import { Button, Card, Col, Input, Row, Space, Tag } from 'antd';
import { PageHeader } from '@/components';
import { mediaResources } from '@/mock/cms';

export default function MediaCenterPage(){
  return <><PageHeader title='媒体资源中心' extra={<Space><Input.Search placeholder='搜索图片、视频、文件' style={{width:260}}/><Button type='primary'>上传资源</Button></Space>} /><Row gutter={[16,16]}>{mediaResources.map(item=><Col span={8} key={item.id}><Card title={item.name} extra={<Tag color='blue'>{item.type}</Tag>}><p>使用场景：{item.scene}</p><p>大小：{item.size}</p><p>更新时间：{item.updatedAt}</p></Card></Col>)}</Row></>;
}
