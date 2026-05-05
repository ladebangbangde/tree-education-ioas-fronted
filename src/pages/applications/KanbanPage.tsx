import { Card, Col, List, Row } from 'antd';import { PageHeader } from '@/components/common';
const cols=['选校规划','文书准备','网申提交','Offer跟进','签证办理','行前准备'];
export default function(){return <><PageHeader title='申请交付看板'/><Row gutter={12}>{cols.map(c=><Col span={4} key={c}><Card title={c}><List size='small' dataSource={['张同学 英国 2026F Amy 60%','李同学 美国 2026F Tom 40%']} renderItem={i=><List.Item>{i}</List.Item>} /></Card></Col>)}<Col span={24} className='mt12'><Card title='今日待办与超期任务'>待办3条，超期1条</Card></Col></Row></>}
