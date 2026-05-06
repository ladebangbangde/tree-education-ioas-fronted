import { Col, Row } from 'antd';
import ReactECharts from 'echarts-for-react';
import { ChartCard, FunnelChart, PageHeader, StatCard } from '@/components';
import { advisorRank, channelRate, conversionCompare, countryIntent, leadStats } from '@/mock/reports';

export default function ReportsLeadsPage(){
  return <>
    <PageHeader title='线索分析'/>
    <Row gutter={[16,16]} className='mb12'>{leadStats.map(s=><Col span={6} key={s.title}><StatCard title={s.title} value={s.value}/></Col>)}</Row>
    <Row gutter={[16,16]}>
      <Col span={12}><ChartCard title='来源渠道分布'><ReactECharts option={{xAxis:{type:'category',data:channelRate.map(i=>i.name)},yAxis:{},series:[{type:'bar',data:channelRate.map(i=>i.value)}]}}/></ChartCard></Col>
      <Col span={12}><ChartCard title='国家意向分布'><ReactECharts option={{series:[{type:'pie',radius:['35%','65%'],data:countryIntent}]}}/></ChartCard></Col>
    </Row>
    <Row gutter={[16,16]} className='mt12'>
      <Col span={12}><ChartCard title='渠道转化柱状图'><ReactECharts option={{legend:{},xAxis:{type:'category',data:conversionCompare.channels},yAxis:{type:'value'},series:[{name:'咨询量',type:'bar',data:conversionCompare.consult},{name:'签约量',type:'bar',data:conversionCompare.contract}]}}/></ChartCard></Col>
      <Col span={6}><ChartCard title='顾问转化排行'><ReactECharts option={{xAxis:{type:'value'},yAxis:{type:'category',data:advisorRank.map(i=>i.name)},series:[{type:'bar',data:advisorRank.map(i=>i.value)}]}}/></ChartCard></Col>
      <Col span={6}><ChartCard title='线索阶段漏斗'><FunnelChart data={[{name:'新增线索',value:420},{name:'有效沟通',value:290},{name:'方案确认',value:175},{name:'签约',value:92}]}/></ChartCard></Col>
    </Row>
  </>
}
