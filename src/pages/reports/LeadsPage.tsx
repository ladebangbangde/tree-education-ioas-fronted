import ReactECharts from 'echarts-for-react';import { ChartCard, PageHeader } from '@/components/common';
export default function(){return <><PageHeader title='线索分析'/><ChartCard title='来源&国家&漏斗'><ReactECharts option={{xAxis:{type:'category',data:['官网','抖音','小红书']},yAxis:{},series:[{type:'bar',data:[120,90,70]}]}}/></ChartCard></>}
