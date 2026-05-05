import { Button, Card, Col, List, Radio, Row } from 'antd';
import { PageHeader } from '@/components/common';
export default function Assign(){return <><PageHeader title='线索分配'/><Row gutter={12}><Col span={14}><Card title='候选顾问'><List dataSource={['Amy顾问-英国/澳洲 负载12 转化95%','Tom顾问-美国/加拿大 负载18 转化88%']} renderItem={i=><List.Item>{i}</List.Item>} /></Card></Col><Col span={10}><Card title='线索摘要'><p>张同学 / 英国 / 本科</p><Radio.Group options={[{label:'按负载均衡',value:1},{label:'按国家匹配',value:2}]}/><Button className='mt12' type='primary' block>提交分配</Button></Card></Col></Row></>}
