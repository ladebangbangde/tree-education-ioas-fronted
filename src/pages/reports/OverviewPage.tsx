import { Col, Row } from 'antd';
import ReactECharts from 'echarts-for-react';
import { ChartCard, PageHeader, PieChart, StatCard, TrendLineChart } from '@/components';
import { channelRate, signTrend } from '@/mock/reports';

export default function ReportsOverviewPage(){return <><PageHeader title='报表总览'/><Row gutter={12}><Col span={6}><StatCard title='线索总量' value={1256}/></Col><Col span={6}><StatCard title='有效线索' value={856}/></Col><Col span={6}><StatCard title='签约客户' value={128}/></Col><Col span={6}><StatCard title='签约金额' value='¥3,856,000'/></Col></Row><Row gutter={12} className='mt12'><Col span={8}><ChartCard title='渠道来源占比'><PieChart data={channelRate}/></ChartCard></Col><Col span={8}><ChartCard title='月度签约趋势'><TrendLineChart x={signTrend.x} data={signTrend.data}/></ChartCard></Col><Col span={8}><ChartCard title='渠道转化对比'><ReactECharts option={{xAxis:{type:'category',data:['官网咨询','微信咨询','小红书','抖音']},yAxis:{type:'value'},series:[{name:'咨询',type:'bar',data:[120,90,110,80]},{name:'签约',type:'bar',data:[38,26,34,19]}]}}/></ChartCard></Col></Row></>}
