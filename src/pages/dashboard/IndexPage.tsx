import { Button, Card, Col, List, Row, Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartCard, DataTable, FunnelChart, PageHeader, StatCard, TrendLineChart } from '@/components';
import { leadsApi } from '@/api/leads';
import { studentsApi } from '@/api/students';
import { tasksApi } from '@/api/tasks';
import { useAuthStore } from '@/store/auth';

const statusText: Record<string, string> = {
  unassigned: '未分配',
  assigned: '已分配',
  following: '跟进中',
  confirmed: '已确认',
  converted: '已生成客户档案',
  completed: '已完成',
  invalid: '无效',
  closed: '已关闭'
};

const fmt = (value?: string) => value ? dayjs(value).format('MM-DD HH:mm') : '-';
const inLastDays = (value: string | undefined, days: number) => value ? dayjs(value).isAfter(dayjs().subtract(days, 'day')) : false;

export default function DashboardPage() {
  const role = useAuthStore(s => s.role);
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [leadPage, studentPage, taskRows] = await Promise.all([
          leadsApi.list({ tab: role === 'CONSULTANT' ? 'mine' : undefined, pageNum: 1, pageSize: 500 }),
          studentsApi.list({ pageNum: 1, pageSize: 500 }),
          role === 'CONSULTANT' ? tasksApi.consultant({ quiet: true }) : role === 'MEDIA' ? tasksApi.media({ quiet: true }) : tasksApi.operator({ quiet: true })
        ]);
        if (!alive) return;
        setLeads(leadPage.records || []);
        setStudents(studentPage.records || []);
        setTasks(taskRows || []);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load().catch(() => {
      if (alive) {
        setLeads([]);
        setStudents([]);
        setTasks([]);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [role]);

  const metrics = useMemo(() => {
    const todayLeads = leads.filter(item => dayjs(item.createdAt).isSame(dayjs(), 'day')).length;
    const weekLeads = leads.filter(item => inLastDays(item.createdAt, 7)).length;
    const unassigned = leads.filter(item => item.status === 'unassigned').length;
    const converted = leads.filter(item => item.status === 'converted' || item.convertedStudentId).length;
    const pendingTasks = tasks.filter(item => ['pending', 'processing', 'created', 'uploading'].includes(item.status)).length;
    return [
      { title: '总线索数', value: leads.length },
      { title: '今日新增线索', value: todayLeads },
      { title: '待处理线索', value: unassigned },
      { title: '客户档案数', value: students.length },
      { title: '本周新增线索', value: weekLeads },
      { title: '已生成档案', value: converted },
      { title: '待办任务', value: pendingTasks },
      { title: '转化率', value: leads.length ? `${Math.round((converted / leads.length) * 100)}%` : '0%' }
    ];
  }, [leads, students, tasks]);

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => dayjs().subtract(6 - index, 'day'));
    return {
      x: days.map(day => day.format('MM-DD')),
      data: days.map(day => leads.filter(item => item.createdAt && dayjs(item.createdAt).isSame(day, 'day')).length)
    };
  }, [leads]);

  const funnel = useMemo(() => [
    { name: '未分配', value: leads.filter(item => item.status === 'unassigned').length },
    { name: '已分配', value: leads.filter(item => item.status === 'assigned').length },
    { name: '跟进中', value: leads.filter(item => item.status === 'following').length },
    { name: '已确认', value: leads.filter(item => item.status === 'confirmed').length },
    { name: '已生成档案', value: leads.filter(item => item.status === 'converted' || item.convertedStudentId).length }
  ], [leads]);

  const leadColumns = [
    { title: '客户', dataIndex: 'studentName', render: (v: string) => v || '-' },
    { title: '意向区域', render: (_: unknown, r: any) => r.intentionRegionName || r.targetCountry || '-' },
    { title: '来源', render: (_: unknown, r: any) => r.sourceChannel || r.sourceType || '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag>{statusText[v] || v || '未知'}</Tag> },
    { title: '顾问', dataIndex: 'assignedToName', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'createdAt', render: fmt }
  ];

  return <>
    <PageHeader title='工作台 Dashboard' />
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {metrics.map(item => <Col xs={24} sm={12} lg={6} key={item.title}><StatCard title={item.title} value={item.value} /></Col>)}
      </Row>
      <Row gutter={[16, 16]} className='mt12'>
        <Col xs={24} lg={16}><ChartCard title='近7天线索变化趋势'><TrendLineChart x={trend.x} data={trend.data} /></ChartCard></Col>
        <Col xs={24} lg={8}><ChartCard title='线索阶段漏斗'><FunnelChart data={funnel} /></ChartCard></Col>
      </Row>
      <Row gutter={[16, 16]} className='mt12'>
        <Col xs={24} lg={14}><DataTable rowKey='id' columns={leadColumns as any} dataSource={leads.slice(0, 8)} pagination={false} /></Col>
        <Col xs={24} lg={10}>
          <Card title='今日待办' className='mb12'>
            <List
              dataSource={tasks.slice(0, 6)}
              locale={{ emptyText: '暂无待办任务' }}
              renderItem={(item: any) => <List.Item><Space direction='vertical' size={2}><span>{item.title || item.taskType || '待办任务'}</span><Tag>{item.status || 'pending'}</Tag></Space></List.Item>}
            />
          </Card>
          <Card title='快捷入口'>
            <Space wrap>
              <Button onClick={() => nav('/leads/list')}>线索列表</Button>
              <Button onClick={() => nav('/students/list')}>客户档案</Button>
              <Button onClick={() => nav('/tasks')}>任务中心</Button>
              <Button onClick={() => nav('/settings/advisors')}>顾问中心</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Spin>
  </>;
}
