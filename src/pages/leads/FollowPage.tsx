import { Button, Card, Col, Empty, Form, Input, List, Progress, Row, Space, Spin, Tag, Timeline } from 'antd';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchFilterBar } from '@/components';
import { customerTrackingsApi, type TrackingDetail, type TrackingFlowNode, type TrackingSummary } from '@/api/customerTrackings';

const fmt = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

const FLOW_CARD = 'path://M14,0 L166,0 Q180,0 180,14 L180,76 Q180,90 166,90 L14,90 Q0,90 0,76 L0,14 Q0,0 14,0 Z';
const FLOW_DIAMOND = 'path://M90,0 L180,70 L90,140 L0,70 Z';
const FLOW_START = 'path://M45,0 A45,45 0 1,1 44.9,0 Z';

const statusColor = (status?: string) => {
  if (status === 'COMPLETED') return '#52c41a';
  if (status === 'IN_PROGRESS' || status === 'PENDING') return '#1677ff';
  if (status === 'REJECTED') return '#ff4d4f';
  if (status === 'SKIPPED') return '#8c8c8c';
  if (status === 'LOCKED') return '#bfbfbf';
  return '#722ed1';
};

const statusFill = (status?: string) => {
  if (status === 'COMPLETED') return '#f6ffed';
  if (status === 'IN_PROGRESS' || status === 'PENDING') return '#e6f4ff';
  if (status === 'REJECTED') return '#fff1f0';
  if (status === 'SKIPPED' || status === 'LOCKED') return '#fafafa';
  return '#f9f0ff';
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
      const isStart = node.nodeType === 'start';
      const color = statusColor(node.status);
      return {
        id: node.id,
        name: node.label,
        x: index * 240,
        y: isCondition ? 18 : 0,
        symbol: isCondition ? FLOW_DIAMOND : isStart ? FLOW_START : FLOW_CARD,
        symbolSize: isCondition ? [132, 106] : isStart ? [92, 92] : [176, 88],
        itemStyle: {
          color: statusFill(node.status),
          borderColor: color,
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.08)'
        },
        label: {
          show: true,
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle',
          color: '#1f1f1f',
          fontSize: 12,
          lineHeight: 19,
          width: isCondition ? 96 : isStart ? 76 : 146,
          overflow: 'break',
          formatter: () => `{name|${node.label}}\n{status|${statusText(node.status)}}`,
          rich: {
            name: { color: '#1f1f1f', fontWeight: 700, fontSize: 12, lineHeight: 22 },
            status: { color, fontWeight: 700, fontSize: 12, lineHeight: 22 }
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
      lineStyle: { color: '#91caff', width: 2, curveness: 0.03 }
    }));

    return {
      backgroundColor: '#fff',
      animationDuration: 500,
      tooltip: { trigger: 'item', confine: true },
      series: [{
        type: 'graph',
        layout: 'none',
        roam: true,
        left: 56,
        right: 56,
        top: 78,
        bottom: 74,
        zoom: nodes.length > 4 ? 0.72 : 0.92,
        scaleLimit: { min: 0.45, max: 2.2 },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        data: graphNodes,
        links,
        emphasis: { focus: 'adjacency' },
        lineStyle: { opacity: 0.95 },
        labelLayout: { hideOverlap: false }
      }]
    };
  }, [nodes]);

  if (!nodes.length) return <Empty description='暂无流程节点' />;
  return <div style={{ height: 300, width: '100%' }}>
    <ReactECharts option={option} style={{ height: 300, width: '100%' }} notMerge lazyUpdate />
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
