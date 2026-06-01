import { Card, Col, Row, Statistic, Button, Space, Tree, Tag, Empty } from 'antd';
import { CalendarOutlined, FolderOpenOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components';

export default function OperationDataPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const treeData = [
    {
      title: `${today}`,
      key: today,
      icon: <CalendarOutlined />,
      children: [
        {
          title: '运营人员+媒体人员+创建日期',
          key: `${today}/package`,
          icon: <FolderOpenOutlined />,
          children: [
            { title: '封面识别主题', key: `${today}/cover` },
            { title: '小红书', key: `${today}/xhs` },
            { title: '抖音', key: `${today}/douyin` }
          ]
        }
      ]
    }
  ];

  return (
    <>
      <PageHeader title='运营数据' extra={<Space><Button type='primary' icon={<PlusOutlined />}>创建主题包</Button><Button>生成当日报告</Button></Space>} />
      <Row gutter={[16,16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='今日主题包' value={0} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='主题内容' value={0} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='上传图片' value={0} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title='失败任务' value={0} /></Card></Col>
      </Row>
      <Row gutter={[16,16]} className='mt12'>
        <Col xs={24} lg={7}><Card title='左侧文件路径'><Tree showIcon defaultExpandAll treeData={treeData} /></Card></Col>
        <Col xs={24} lg={17}>
          <Card title='主题包工作区' extra={<Tag color='blue'>数据员生产线</Tag>}>
            <Row gutter={[16,16]}>
              <Col xs={24} md={12}><Card hoverable title='抖音'><Button icon={<PlusOutlined />}>创建抖音子主题</Button></Card></Col>
              <Col xs={24} md={12}><Card hoverable title='小红书'><Button icon={<PlusOutlined />}>创建小红书子主题</Button></Card></Col>
            </Row>
            <Card type='inner' title='主题内容' className='mt12'><Empty description='创建主题包后上传封面和数据截图' /></Card>
          </Card>
        </Col>
      </Row>
    </>
  );
}
