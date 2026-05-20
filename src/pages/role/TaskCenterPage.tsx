import { Button, Drawer, Progress, Popconfirm, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import { DataTable, PageHeader } from '@/components';
import { useAuthStore } from '@/store/auth';
import type { Task } from '@/types/mediaFlow';
import { adaptTask } from '@/utils/adapters/mediaFlow';

const mediaStatus: Record<string, { text: string; color: string; status?: 'success' | 'exception' | 'active' | 'normal' }> = {
  created: { text: '已创建', color: 'default', status: 'normal' },
  processing: { text: '处理中', color: 'processing', status: 'active' },
  uploading: { text: '上传中', color: 'processing', status: 'active' },
  success: { text: '上传成功', color: 'green', status: 'success' },
  failed: { text: '上传失败', color: 'red', status: 'exception' },
  cancelled: { text: '已取消', color: 'default', status: 'exception' },
  partial_success: { text: '部分成功', color: 'gold', status: 'active' },
  pending_supplement: { text: '待补充素材', color: 'orange', status: 'normal' }
};
const operatorStatus: Record<string, { text: string; color: string; status?: 'success' | 'exception' | 'active' | 'normal' }> = { pending: { text: '待处理', color: 'orange' }, processing: { text: '处理中', color: 'processing' }, completed: { text: '已完成', color: 'green', status: 'success' }, overdue: { text: '已逾期', color: 'red', status: 'exception' }, rejected: { text: '已驳回', color: 'volcano', status: 'exception' } };

const formatDateTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
const isTerminal = (status: string) => ['success', 'failed', 'cancelled', 'completed', 'rejected'].includes(status);

export default function TaskCenterPage(){
  const role = useAuthStore(s => s.role);
  const userId = useAuthStore(s => s.id);
  const isMedia = role === 'MEDIA';
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [logTask, setLogTask] = useState<Task>();
  const [logs, setLogs] = useState<string[]>([]);
  const listLoadingRef = useRef(false);
  const logsLoadingRef = useRef(false);

  const loadData = useCallback(async (quiet = false) => {
    if (listLoadingRef.current) return;
    listLoadingRef.current = true;
    if (!quiet) setLoading(true);
    try {
      const taskRows = isMedia ? await tasksApi.media({ quiet }) : await tasksApi.operator({ quiet });
      const rows = (taskRows || []).map(row => adaptTask(row, isMedia ? 'media' : 'operator'));
      const visibleRows = role === 'SUPER_ADMIN' ? rows : rows.filter(row => !userId || !row.assigneeId || row.assigneeId === userId);
      setData(visibleRows);
    } finally {
      listLoadingRef.current = false;
      if (!quiet) setLoading(false);
    }
  }, [isMedia, role, userId]);

  useEffect(() => { loadData().catch(() => undefined); }, [loadData]);
  useEffect(() => {
    const timer = window.setInterval(() => loadData(true).catch(() => undefined), 3000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const activeCount = useMemo(() => data.filter(row => !isTerminal(row.status)).length, [data]);

  const patchTask = async (task: Task, action: string) => {
    await tasksApi.update(task.id, { action });
    message.success('任务已更新');
    loadData();
  };
  const cancelTask = async (task: Task) => {
    await tasksApi.cancel(task.id);
    message.success('任务已取消');
    loadData();
  };
  const refreshLogs = useCallback(async (task: Task, quiet = false) => {
    if (logsLoadingRef.current) return;
    logsLoadingRef.current = true;
    try {
      const rows = await tasksApi.logs(task.id, 300, { quiet });
      setLogs(rows || []);
    } finally {
      logsLoadingRef.current = false;
    }
  }, []);
  const openLogs = async (task: Task) => {
    setLogTask(task);
    setLogs([]);
    await refreshLogs(task, false);
  };

  useEffect(() => {
    if (!logTask) return;
    const timer = window.setInterval(() => refreshLogs(logTask, true).catch(() => undefined), 3000);
    return () => window.clearInterval(timer);
  }, [logTask, refreshLogs]);

  const common = [
    { title: '任务ID', dataIndex: 'id', width: 90 },
    { title: '主题名称', width: 220, render: (_: unknown, r: Task) => r.topicName || `主题包 #${r.relatedPackageId || '-'}` },
    { title: isMedia ? '上传任务' : '任务名称', width: 280, render: (_: unknown, r: Task) => r.title || '-' },
    { title: isMedia ? '绑定运营' : '负责人', width: 120, render: (_: unknown, r: Task) => isMedia ? r.operatorName || '-' : r.assigneeName || '-' },
    { title: '状态', dataIndex: 'status', width: 110, render: (v: string) => { const map = isMedia ? mediaStatus : operatorStatus; return <Tag color={map[v]?.color}>{map[v]?.text || v}</Tag>; } },
    { title: '进度', dataIndex: 'progress', width: 220, render: (v: number, r: Task) => {
      const map = isMedia ? mediaStatus : operatorStatus;
      return <Progress percent={v || 0} size='small' status={map[r.status]?.status} />;
    } },
    { title: '开始时间', dataIndex: 'createdAt', width: 170, render: formatDateTime },
    { title: '完成时间', dataIndex: 'completedAt', width: 170, render: formatDateTime },
    { title: '失败原因', dataIndex: 'errorMessage', width: 240, render: (v?: string) => v || '-' }
  ];
  const mediaColumns = [
    ...common,
    { title: '操作', fixed: 'right' as const, width: 180, render: (_: unknown, r: Task) => <Space>
      <Button type='link' onClick={() => openLogs(r)}>日志</Button>
      {!isTerminal(r.status) && <Popconfirm title='取消后该任务会进入已取消状态，是否继续？' onConfirm={() => cancelTask(r)}><Button type='link' danger>取消</Button></Popconfirm>}
      {(r.status === 'failed' || r.status === 'cancelled') && <Button type='link' onClick={() => patchTask(r, 'retry')}>重试</Button>}
    </Space> }
  ];
  const operatorColumns = [...common, { title: '操作', fixed: 'right' as const, render: (_: unknown, r: Task) => <Space>{r.status !== 'completed' && <Button type='link' onClick={() => patchTask(r, 'process')}>去生成线索</Button>}<Button type='link' onClick={() => openLogs(r)}>日志</Button></Space> }];

  return <>
    <PageHeader title={isMedia ? '任务中心｜文件级上传任务' : '任务中心｜线索生成任务'} extra={<span>{isMedia ? `文件级任务，自动刷新中｜进行中 ${activeCount} 个` : '素材入库后自动生成运营待处理任务'}</span>} />
    <DataTable loading={loading} rowKey='id' columns={isMedia ? mediaColumns : operatorColumns} dataSource={data} scroll={{ x: 1500 }} />
    <Drawer open={Boolean(logTask)} onClose={() => { setLogTask(undefined); setLogs([]); }} title={`任务日志：${logTask?.id || ''}`} width={760}>
      <Typography.Paragraph type='secondary'>每个任务独立日志文件：task-{logTask?.id}.log，3 秒自动刷新。</Typography.Paragraph>
      <pre style={{ background: '#0b1220', color: '#d7e2ff', padding: 16, borderRadius: 12, minHeight: 420, whiteSpace: 'pre-wrap' }}>{logs.length ? logs.join('\n') : '暂无日志'}</pre>
    </Drawer>
  </>;
}
