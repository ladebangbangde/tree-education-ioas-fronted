import { Card, Col, Row, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { PageHeader, StatCard } from '@/components';
import { assetFiles, contentPackages, mediaFlowLeads } from '@/mock/mediaFlow';
import { useAuthStore } from '@/store/auth';

export default function RoleReportsPage(){
  const role = useAuthStore(s => s.role);
  const isMedia = role === 'MEDIA';
  const now = dayjs('2026-05-08');
  const weekPackages = contentPackages.filter(pkg => dayjs(pkg.createdAt).isAfter(now.subtract(7, 'day')));
  const monthPackages = contentPackages.filter(pkg => dayjs(pkg.createdAt).isSame(now, 'month'));
  const leadByPackage = contentPackages.map(pkg => ({ topicName: pkg.topicName, count: mediaFlowLeads.filter(lead => lead.relatedPackageId === pkg.id).length }));
  const trendOption = { xAxis: { type: 'category', data: ['5/4','5/5','5/6','5/7','5/8'] }, yAxis: { type: 'value' }, series: [{ type: 'line', smooth: true, data: [0, 1, 2, 1, 3] }] };
  return <>
    <PageHeader title={isMedia ? '数据报表｜媒体产出' : '数据报表｜线索结果'} extra={<span>{isMedia ? '删除文件或主题包后，统计从主题包与文件明细重新计算' : '只统计运营线索创建、分配和完成结果'}</span>} />
    {isMedia ? <>
      <Row gutter={[16,16]}>
        <Col span={8}><StatCard title='脚本文案总数' value={assetFiles.filter(f => f.fileType === 'script' && contentPackages.some(pkg => pkg.id === f.packageId)).length} /></Col>
        <Col span={8}><StatCard title='视频文件总数' value={assetFiles.filter(f => f.fileType === 'video' && contentPackages.some(pkg => pkg.id === f.packageId)).length} /></Col>
        <Col span={8}><StatCard title='图片文件总数' value={assetFiles.filter(f => f.fileType === 'image' && contentPackages.some(pkg => pkg.id === f.packageId)).length} /></Col>
        <Col span={12}><StatCard title='本周新增主题包' value={weekPackages.length} /></Col>
        <Col span={12}><StatCard title='本月新增主题包' value={monthPackages.length} /></Col>
      </Row>
      <Card title='媒体产出说明'>当前报表只统计当前媒体账号上传的内容产出，不统计运营后续线索转化结果。</Card>
    </> : <>
      <Row gutter={[16,16]}>
        <Col span={6}><StatCard title='线索总数' value={mediaFlowLeads.length} /></Col>
        <Col span={6}><StatCard title='今日新增' value={mediaFlowLeads.filter(l => dayjs(l.createdAt).isSame(now, 'day')).length} /></Col>
        <Col span={6}><StatCard title='本周新增' value={mediaFlowLeads.filter(l => dayjs(l.createdAt).isAfter(now.subtract(7, 'day'))).length} /></Col>
        <Col span={6}><StatCard title='未分配数' value={mediaFlowLeads.filter(l => l.status === 'unassigned').length} /></Col>
        <Col span={6}><StatCard title='已分配数' value={mediaFlowLeads.filter(l => l.status === 'assigned').length} /></Col>
        <Col span={6}><StatCard title='已完成数' value={mediaFlowLeads.filter(l => l.status === 'completed').length} /></Col>
      </Row>
      <Row gutter={[16,16]}>
        <Col span={12}><Card title='按素材主题统计线索数量'><Table rowKey='topicName' pagination={false} dataSource={leadByPackage} columns={[{ title: '素材主题', dataIndex: 'topicName' }, { title: '线索数量', dataIndex: 'count' }]} /></Card></Col>
        <Col span={12}><Card title='时间趋势'><ReactECharts option={trendOption} style={{ height: 320 }} /></Card></Col>
      </Row>
    </>}
  </>;
}
