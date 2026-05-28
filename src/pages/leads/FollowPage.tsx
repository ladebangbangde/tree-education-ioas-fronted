import { Button, Card, Col, Empty, Form, Input, List, Progress, Row, Space, Spin, Tag, Timeline } from 'antd';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { customerTrackingsApi, type TrackingDetail, type TrackingFlowNode, type TrackingSummary } from '@/api/customerTrackings';

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

const statusColor = (status?: string) => {
  if (status === 'COMPLETED') return '#52c41a';
  if (status === 'IN_PROGRESS' || status === 'PENDING') return '#1677ff';
  if (status === 'REJECTED') return '#ff4d4f';
  if (status === 'SKIPPED') return '#bfbfbf';
  if (status === 'LOCKED') return '#d9d9d9';
  return '#722ed1';
};

const statusTagColor = (status?: string) => {
  if (status === 'COMPLETED') return 'green';
  if (status === 'IN_PROGRESS' || status === 'PENDING') return 'blue';
  if (status === 'REJECTED') return 'red';
  if (status === 'SKIPPED' || status === 'LOCKED') return 'default';
  return 'purple';
};

const statusText = (status?: string) => ({
  COMPLETED: '已完成',
  IN_PROGRESS: '处理中',
  PENDING: '待处理',
  REJECTED: '已退回',
  LOCKED: '未解锁',
  SKIPPED: '否'
}[status || ''] || status || '-');

function FlowGraph({ nodes }: { nodes: TrackingFlowNode[] }) {
  const option = useMemo(() => {
    const graphNodes = nodes.map((node, index) => {
      const isCondition = node.nodeType === 'condition';
      const color = statusColor(node.status);
      return {
        id: node.id,
        name: node.label,
        x: 110 + index * 210,
        y: isCondition ? 150 : 140,
        symbol: isCondition ? 'diamond' : node.nodeType === 'start' ? 'circle' : 'roundRect',
        symbolSize: isCondition ? [118, 118] : node.nodeType === 'start' ? 96 : [150, 84],
        value: [node.label, statusText(node.status), node.description || '-', fmt(node.happenedAt)].join('\n'),
        itemStyle: {
          color: '#ffffff',
          borderColor: color,
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.08)'
        },
        label: {
          show: true,
          color: '#1f1f1f',
          fontSize: 12,
          lineHeight: 18,
          formatter: () => `${node.label}\n{status|${statusText(node.status)}}`,
          rich: {
            status: { color, fontWeight: 700, lineHeight: 24 }
          }
        },
        tooltip: {
          formatter: () => `<b>${node.label}</b><br/>状态：${statusText(node.status)}<br/>说明：${node.description || '-'}<br/>时间：${fmt(node.happenedAt)}`
        }
      };
    });
    const links = nodes.slice(1).map((node, index) => ({
      source: nodes[index].id,
      target: node.id,
      label: { show: node.id === 'transfer', formatter: '判断', color: '#8c8c8c', fontSize: 11 },
      lineStyle: { color: '#91caff', width: 2, curveness: 0 }
    }));
    return {
      animationDuration: 500,
      tooltip: { trigger: 'item', confine: true },
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      dataZoom: [{ type: 'inside', xAxisIndex: 0, filterMode: 'none' }],
      xAxis: { show: false, min: 0, max: Math.max(900, nodes.length * 210 + 80) },
      yAxis: { show: false, min: 40, max: 260 },
      series: [{
        type: 'graph',
        coordinateSystem: 'cartesian2d',
        layout: 'none',
        roam: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 12],
        data: graphNodes,
        links,
        emphasis: { focus: 'adjacency' },
        lineStyle: { opacity: 0.95 },
        labelLayout: { hideOverlap: false }
      }]
    };
  }, [nodes]);

  if (!nodes.length) return <Empty description='暂无流程节点' />;
  return <div style={{ height: 320, width: '100%' }}>
    <ReactECharts option={option} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
  </div>;
}

export default function LeadsFollowPage() {
  const nav = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<TrackingSummary[]>([]);
  const [activeId, setActiveId] = useState<number>();
  const [detail, setDetail] = useState<TrackingDetail>();
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await customerTrackingsApi.list({ keyword: keyword || undefined });
      setRows(data || []);
      const first = data?.[0]?.customerId;
      if (first && !activeId) await openDetail(first);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (customerId: number) => {
    setActiveId(customerId);
    setDetailLoading(true);
    try {
      const data = await customerTrackingsApi.detail(customerId);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const summary = detail?.summary;

  return <>
    <PageHeader title='客资跟进记录' extra={summary?.flowId ? <Button type='primary' onClick={() => nav(`/applications/detail/${summary.flowId}`)}>进入申请流程</Button> : <Button onClick={() => nav('/students/list')}>客户档案</Button>} />
    <SearchFilterBar>
      <Form layout='inline' style={{ gap: 16, rowGap: 16 }}>
        <Form.Item label='关键词'><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='客户姓名/客户编号/线索编号' allowClear /></Form.Item>
        <Button type='primary' onClick={() => load()}>查询</Button>
        <Button onClick={() => { setKeyword(''); setTimeout(() => load(), 0); }}>重置</Button>
      </Form>
    </SearchFilterBar>
    <Row gutter={[16, 16]}>
      <Col span={7}>
        <Card title='已生成客资' bodyStyle={{ padding: 0 }}>
          <Spin spinning={loading}>
            <List
              dataSource={rows}
              locale={{ emptyText: <Empty description='暂无已生成客资' /> }}
              renderItem={item => <List.Item onClick={() => openDetail(item.customerId)} style={{ cursor: 'pointer', padding: 14, background: activeId === item.customerId ? '#e6f4ff' : undefined }}>
                <Space direction='vertical' size={4} style={{ width: '100%' }}>
                  <Space><b>{item.customerName}</b><Tag>{item.customerNo || '-'}</Tag></Space>
                  <span className='text-muted'>线索：{item.sourceLeadNo || item.sourceLeadId || '-'}</span>
                  <span className='text-muted'>生成：{fmt(item.customerCreatedAt)}</span>
                  <Space>
                    <Tag color={item.transferred ? 'orange' : 'default'}>{item.transferred ? '曾转让' : '未转让'}</Tag>
                    {item.transferredAt && <span className='text-muted'>{fmt(item.transferredAt)}</span>}
                  </Space>
                  <Progress percent={item.progressPercent || 0} size='small' />
                </Space>
              </List.Item>}
            />
          </Spin>
        </Card>
      </Col>
      <Col span={17}>
        <Spin spinning={detailLoading}>
          {!detail ? <Card><Empty description='请选择左侧客资查看真实跟进流程' /></Card> : <Space direction='vertical' size={16} style={{ width: '100%' }}>
            <Card title='关键时间'>
              <Row gutter={[16, 16]}>
                <Col span={6}><div className='text-muted'>线索生成时间</div><b>{fmt(summary?.leadCreatedAt)}</b></Col>
                <Col span={6}><div className='text-muted'>是否转让</div><Tag color={summary?.transferred ? 'orange' : 'default'}>{summary?.transferred ? '是' : '否'}</Tag></Col>
                <Col span={6}><div className='text-muted'>转让/分配时间</div><b>{fmt(summary?.transferredAt)}</b></Col>
                <Col span={6}><div className='text-muted'>档案生成时间</div><b>{fmt(summary?.customerCreatedAt)}</b></Col>
              </Row>
            </Card>
            <Card title='档案生成后的流程图' extra={<span className='text-muted'>支持鼠标滚轮缩放、拖动画布</span>}>
              <FlowGraph nodes={detail.graphNodes || []} />
              <Space wrap style={{ marginTop: 8 }}>
                {(detail.graphNodes || []).map(node => <Tag key={node.id} color={statusTagColor(node.status)}>{node.label} · {statusText(node.status)}</Tag>)}
              </Space>
            </Card>
            <Card title='真实跟进时间线'>
              <Timeline items={(detail.events || []).map(item => ({
                color: item.type === 'LEAD_TRANSFER' ? 'orange' : item.type === 'ATTACHMENT' ? 'purple' : 'blue',
                children: <Space direction='vertical' size={2}>
                  <Space><b>{item.title}</b><Tag>{item.type}</Tag></Space>
                  <span>{item.content || '-'}</span>
                  <span className='text-muted'>{item.operatorName || '-'} · {fmt(item.happenedAt)}</span>
                </Space>
              }))} />
            </Card>
          </Space>}
        </Spin>
      </Col>
    </Row>
  </>;
}
