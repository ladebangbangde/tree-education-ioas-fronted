import { Card, Col, Input, Row, Tag, Tree } from 'antd';
import { PageHeader } from '@/components';
import { knowledgeCards, knowledgeTree } from '@/mock/knowledge';

export default function LibraryPage(){return <><PageHeader title='知识库'/><Row gutter={[16,16]}><Col span={6}><Card title='分类导航'><Tree defaultExpandAll treeData={knowledgeTree}/></Card></Col><Col span={18}><Card title='知识内容中心'><Input.Search placeholder='搜索 FAQ / 政策 / 院校资料 / 文书模板' className='mb12'/>{knowledgeCards.map(i=><Card key={i.title} type='inner' title={i.title} extra={<Tag color='blue'>{i.tag}</Tag>} className='mb12'><p>{i.desc}</p><p>维护人：{i.author} ｜ 更新时间：{i.updated}</p></Card>)}</Card></Col></Row></>}
