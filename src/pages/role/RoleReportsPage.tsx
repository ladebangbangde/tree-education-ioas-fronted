import { Card, Col, Row, Spin, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '@/api/reports';
import { PageHeader, StatCard } from '@/components';
import { useAuthStore } from '@/store/auth';
import { adaptReportMetrics } from '@/utils/adapters/mediaFlow';

interface PackageLeadRow { topicName: string; count: number; }
interface TrendRow { date: string; count: number; }

const adaptPackageRows = (rows: any[]): PackageLeadRow[] => (rows || []).map(row => ({ topicName: row.topicName || row.packageName || row.name || '-', count: Number(row.count ?? row.leadCount ?? row.total ?? 0) }));
const adaptTrendRows = (rows: any[]): TrendRow[] => (rows || []).map(row => ({ date: row.date || row.day || row.label || '-', count: Number(row.count ?? row.leadCount ?? row.total ?? 0) }));

export default function RoleReportsPage(){
  const role = useAuthStore(s => s.role);
  const isMedia = role === 'MEDIA';
  const [metrics, setMetrics] = useState(adaptReportMetrics({}));
  const [leadByPackage, setLeadByPackage] = useState<PackageLeadRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(false);
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      if (isMedia) {
        setMetrics(adaptReportMetrics(await reportsApi.mediaOutput()));
        setLeadByPackage([]); setTrend([]);
      } else {
        const [summary, byPackage, trendRows] = await Promise.all([reportsApi.operatorLeads(), reportsApi.operatorByPackage(), reportsApi.operatorTrend()]);
        setMetrics(adaptReportMetrics(summary));
        setLeadByPackage(adaptPackageRows(byPackage));
        setTrend(adaptTrendRows(trendRows));
      }
    } finally { setLoading(false); }
  }, [isMedia]);
  useEffect(() => { loadReports().catch(() => undefined); }, [loadReports]);

  const trendOption = { xAxis: { type: 'category', data: trend.map(item => item.date) }, yAxis: { type: 'value' }, series: [{ type: 'line', smooth: true, data: trend.map(item => item.count) }] };
  return <Spin spinning={loading}>
    <PageHeader title={isMedia ? '数据报表｜媒体产出' : '数据报表｜线索结果'} extra={<span>{isMedia ? '统计来自媒体产出接口' : '统计来自运营线索报表接口'}</span>} />
    {isMedia ? <>
      <Row gutter={[16,16]}>
        <Col span={8}><StatCard title='脚本文案总数' value={metrics.scriptCount} /></Col>
        <Col span={8}><StatCard title='视频文件总数' value={metrics.videoCount} /></Col>
        <Col span={8}><StatCard title='图片文件总数' value={metrics.imageCount} /></Col>
        <Col span={12}><StatCard title='本周新增主题包' value={metrics.weekPackageCount} /></Col>
        <Col span={12}><StatCard title='本月新增主题包' value={metrics.monthPackageCount} /></Col>
      </Row>
      <Card title='媒体产出说明'>当前报表只统计后端媒体产出接口返回的数据，不统计运营后续线索转化结果。</Card>
    </> : <>
      <Row gutter={[16,16]}>
        <Col span={6}><StatCard title='线索总数' value={metrics.totalLeads} /></Col>
        <Col span={6}><StatCard title='今日新增' value={metrics.todayNew} /></Col>
        <Col span={6}><StatCard title='本周新增' value={metrics.weekNew} /></Col>
        <Col span={6}><StatCard title='未分配数' value={metrics.unassigned} /></Col>
        <Col span={6}><StatCard title='已分配数' value={metrics.assigned} /></Col>
        <Col span={6}><StatCard title='已完成数' value={metrics.completed} /></Col>
      </Row>
      <Row gutter={[16,16]}>
        <Col span={12}><Card title='按素材主题统计线索数量'><Table rowKey='topicName' pagination={false} dataSource={leadByPackage} columns={[{ title: '素材主题', dataIndex: 'topicName' }, { title: '线索数量', dataIndex: 'count' }]} /></Card></Col>
        <Col span={12}><Card title='时间趋势'><ReactECharts option={trendOption} style={{ height: 320 }} /></Card></Col>
      </Row>
    </>}
  </Spin>;
}
