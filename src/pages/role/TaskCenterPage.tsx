import { Button, Descriptions, Drawer, Popover, Progress, Popconfirm, Radio, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import { inferUploadTaskFileType, uploadTasksApi } from '@/api/uploadTasks';
import { DataTable, PageHeader } from '@/components';
import { useAuthStore } from '@/store/auth';
import type { Task } from '@/types/mediaFlow';
import { adaptTask } from '@/utils/adapters/mediaFlow';

const mediaStatus: Record<string, { text: string; color: string; status?: 'success' | 'exception' | 'active' | 'normal' }> = {
  created: { text: '已创建', color: 'default', status: 'normal' },
  processing: { text: '处理中', color: 'processing', status: 'active' },
  uploading: { text: '上传中', color: 'processing', status: 'active' },
  interrupted: { text: '上传中断', color: 'orange', status: 'exception' },
  success: { text: '上传成功', color: 'green', status: 'success' },
  failed: { text: '上传失败', color: 'red', status: 'exception' },
  cancelled: { text: '已取消', color: 'default', status: 'exception' },
  partial_success: { text: '部分成功', color: 'gold', status: 'active' },
  pending_supplement: { text: '待补充素材', color: 'orange', status: 'normal' }
};
const operatorStatus: Record<string, { text: string; color: string; status?: 'success' | 'exception' | 'active' | 'normal' }> = { pending: { text: '待处理', color: 'orange' }, processing: { text: '处理中', color: 'processing' }, completed: { text: '已完成', color: 'green', status: 'success' }, overdue: { text: '已逾期', color: 'red', status: 'exception' }, rejected: { text: '已驳回', color: 'volcano', status: 'exception' } };

const formatDateTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
const isTerminal = (status: string) => ['success', 'failed', 'cancelled', 'completed', 'rejected'].includes(status);
const canDeleteTask = (task: Task) => isTerminal(task.status);
const canResumeTask = (task: Task) => task.taskType === 'media_upload' && ['interrupted', 'failed'].includes(task.status);
const formatBytes = (value?: number) => {
  const size = Number(value || 0);
  if (!size) return '-';
  if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};
const formatSpeed = (value?: number) => value ? `${formatBytes(value)}/s` : '-';
const formatDuration = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '-';
  if (seconds < 60) return `${Math.ceil(seconds)} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分 ${Math.ceil(seconds % 60)} 秒`;
  return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分`;
};
type TaskView = 'media' | 'operator';

export default function TaskCenterPage(){
  const role = useAuthStore(s => s.role);
  const userId = useAuthStore(s => s.id);
  const [adminView, setAdminView] = useState<TaskView>('media');
  const view: TaskView = role === 'OPERATOR' ? 'operator' : role === 'SUPER_ADMIN' ? adminView : 'media';
  const isMedia = view === 'media';
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [logTask, setLogTask] = useState<Task>();
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [resumingTaskId, setResumingTaskId] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingResumeTaskRef = useRef<Task>();
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
      setSelectedRowKeys(prev => prev.filter(key => visibleRows.some(row => String(row.id) === String(key) && canDeleteTask(row))));
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
  const selectResumeFile = (task: Task) => {
    pendingResumeTaskRef.current = task;
    fileInputRef.current?.click();
  };
  const handleResumeFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const task = pendingResumeTaskRef.current;
    pendingResumeTaskRef.current = undefined;
    if (!file || !task) return;

    try {
      setResumingTaskId(task.id);
      message.loading({ content: `正在恢复上传：${file.name}`, key: `resume-${task.id}`, duration: 0 });
      await uploadTasksApi.resumeMultipartFile(task.id, file, inferUploadTaskFileType(file), info => {
        if (info.percent % 10 === 0) loadData(true).catch(() => undefined);
      });
      message.success({ content: '续传完成', key: `resume-${task.id}` });
      await loadData();
    } catch (error) {
      const text = error instanceof Error ? error.message : '续传失败';
      message.error({ content: text, key: `resume-${task.id}` });
      await loadData();
    } finally {
      setResumingTaskId(undefined);
    }
  };
  const batchDeleteTasks = async () => {
    const deletableIds = selectedRowKeys.filter(key => data.some(row => String(row.id) === String(key) && canDeleteTask(row)));
    if (!deletableIds.length) {
      message.warning('请先选择已完成、失败或已取消的任务');
      return;
    }
    const result = await tasksApi.batchDelete(deletableIds, true);
    message.success(`已删除 ${result?.deletedTasks ?? deletableIds.length} 个任务，永久删除对象 ${result?.deletedObjects ?? 0} 个`);
    setSelectedRowKeys([]);
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

  const renderProgressPopover = (value: number, task: Task) => {
    const map = isMedia ? mediaStatus : operatorStatus;
    const statusMeta = map[task.status] || { text: task.status, color: 'default', status: 'normal' as const };
    const percent = value || 0;
    const remainingBytes = Math.max((task.fileSize || 0) - (task.uploadedBytes || 0), 0);
    const etaSeconds = task.speedBytesPerSecond ? remainingBytes / task.speedBytesPerSecond : undefined;
    const content = <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Typography.Text strong>任务进度 #{task.id}</Typography.Text>
        <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
      </div>
      <Progress percent={percent} status={statusMeta.status} />
      <Descriptions column={1} size='small' colon={false} style={{ marginTop: 8 }}>
        <Descriptions.Item label='任务'>{task.title || '-'}</Descriptions.Item>
        <Descriptions.Item label='主题'>{task.topicName || `主题包 #${task.relatedPackageId || '-'}`}</Descriptions.Item>
        <Descriptions.Item label='文件'>{task.fileName || '-'}</Descriptions.Item>
        <Descriptions.Item label='已上传'>{task.fileSize ? `${formatBytes(task.uploadedBytes)} / ${formatBytes(task.fileSize)}` : '-'}</Descriptions.Item>
        <Descriptions.Item label='当前速度'>{formatSpeed(task.speedBytesPerSecond)}</Descriptions.Item>
        <Descriptions.Item label='平均速度'>{formatSpeed(task.averageSpeedBytesPerSecond)}</Descriptions.Item>
        <Descriptions.Item label='分片进度'>{task.partCount ? `${task.completedPartCount || 0} / ${task.partCount}` : '-'}</Descriptions.Item>
        <Descriptions.Item label='预计剩余'>{formatDuration(etaSeconds)}</Descriptions.Item>
        <Descriptions.Item label='最后进度'>{formatDateTime(task.lastProgressAt || task.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label={isMedia ? '绑定运营' : '负责人'}>{isMedia ? task.operatorName || '-' : task.assigneeName || '-'}</Descriptions.Item>
        <Descriptions.Item label='开始时间'>{formatDateTime(task.createdAt)}</Descriptions.Item>
        <Descriptions.Item label='完成时间'>{formatDateTime(task.completedAt)}</Descriptions.Item>
        {task.errorMessage && <Descriptions.Item label='失败原因'>{task.errorMessage}</Descriptions.Item>}
      </Descriptions>
      <Space style={{ marginTop: 10 }}>
        <Button size='small' type='primary' onClick={() => openLogs(task)}>查看日志</Button>
        {canResumeTask(task) && <Button size='small' onClick={() => selectResumeFile(task)} loading={resumingTaskId === task.id}>继续上传</Button>}
        {!isTerminal(task.status) && <Popconfirm title='取消后该任务会进入已取消状态，是否继续？' onConfirm={() => cancelTask(task)}><Button size='small' danger>取消任务</Button></Popconfirm>}
      </Space>
    </div>;

    return <Popover trigger='click' placement='left' content={content}>
      <div style={{ cursor: 'pointer', minWidth: 190 }} title='点击查看任务进度详情'>
        <Progress percent={percent} size='small' status={statusMeta.status} />
      </div>
    </Popover>;
  };

  const common = [
    { title: '任务ID', dataIndex: 'id', width: 90 },
    { title: '主题名称', width: 220, render: (_: unknown, r: Task) => r.topicName || `主题包 #${r.relatedPackageId || '-'}` },
    { title: isMedia ? '上传任务' : '任务名称', width: 280, render: (_: unknown, r: Task) => r.title || '-' },
    { title: isMedia ? '绑定运营' : '负责人', width: 120, render: (_: unknown, r: Task) => isMedia ? r.operatorName || '-' : r.assigneeName || '-' },
    { title: '状态', dataIndex: 'status', width: 110, render: (v: string) => { const map = isMedia ? mediaStatus : operatorStatus; return <Tag color={map[v]?.color}>{map[v]?.text || v}</Tag>; } },
    { title: '进度', dataIndex: 'progress', width: 220, render: (v: number, r: Task) => renderProgressPopover(v, r) },
    { title: '速度', width: 120, render: (_: unknown, r: Task) => formatSpeed(r.speedBytesPerSecond) },
    { title: '分片', width: 100, render: (_: unknown, r: Task) => r.partCount ? `${r.completedPartCount || 0}/${r.partCount}` : '-' },
    { title: '开始时间', dataIndex: 'createdAt', width: 170, render: formatDateTime },
    { title: '完成时间', dataIndex: 'completedAt', width: 170, render: formatDateTime },
    { title: '失败原因', dataIndex: 'errorMessage', width: 240, render: (v?: string) => v || '-' }
  ];
  const mediaColumns = [
    ...common,
    { title: '操作', fixed: 'right' as const, width: 220, render: (_: unknown, r: Task) => <Space>
      <Button type='link' onClick={() => openLogs(r)}>日志</Button>
      {canResumeTask(r) && <Button type='link' onClick={() => selectResumeFile(r)} loading={resumingTaskId === r.id}>继续上传</Button>}
      {!isTerminal(r.status) && <Popconfirm title='取消后该任务会进入已取消状态，是否继续？' onConfirm={() => cancelTask(r)}><Button type='link' danger>取消</Button></Popconfirm>}
      {(r.status === 'failed' || r.status === 'cancelled') && <Button type='link' onClick={() => patchTask(r, 'retry')}>重试</Button>}
    </Space> }
  ];
  const operatorColumns = [...common, { title: '操作', fixed: 'right' as const, render: (_: unknown, r: Task) => <Space>{r.status !== 'completed' && <Button type='link' onClick={() => patchTask(r, 'process')}>去生成线索</Button>}<Button type='link' onClick={() => openLogs(r)}>日志</Button></Space> }];
  const extra = <Space>
    {role === 'SUPER_ADMIN' && <Radio.Group size='small' value={adminView} onChange={event => { setAdminView(event.target.value); setData([]); setSelectedRowKeys([]); }} options={[{ label: '上传任务', value: 'media' }, { label: '运营任务', value: 'operator' }]} />}
    <span>{isMedia ? `文件级任务，3秒自动刷新｜进行中 ${activeCount} 个` : `运营任务，3秒自动刷新｜进行中 ${activeCount} 个`}</span>
    <Popconfirm title={`确认永久删除选中的 ${selectedRowKeys.length} 个任务？会同步删除已绑定的 MinIO 对象、资产记录和任务日志。进行中任务不可删除。`} disabled={!selectedRowKeys.length} onConfirm={batchDeleteTasks}>
      <Button danger disabled={!selectedRowKeys.length}>批量删除</Button>
    </Popconfirm>
  </Space>;

  return <>
    <PageHeader title={isMedia ? '任务中心｜文件级上传任务' : '任务中心｜线索生成任务'} extra={extra} />
    <input ref={fileInputRef} type='file' style={{ display: 'none' }} onChange={handleResumeFileSelected} />
    <DataTable
      loading={loading}
      rowKey='id'
      columns={isMedia ? mediaColumns : operatorColumns}
      dataSource={data}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        preserveSelectedRowKeys: true,
        getCheckboxProps: record => ({ disabled: !canDeleteTask(record), title: canDeleteTask(record) ? '可删除' : '进行中任务不可删除' })
      }}
      scroll={{ x: 1850 }}
    />
    <Drawer open={Boolean(logTask)} onClose={() => { setLogTask(undefined); setLogs([]); }} title={`任务日志：${logTask?.id || ''}`} width={760}>
      <Typography.Paragraph type='secondary'>每个任务独立日志文件：task-{logTask?.id}.log，3 秒自动刷新。</Typography.Paragraph>
      <pre style={{ background: '#0b1220', color: '#d7e2ff', padding: 16, borderRadius: 12, minHeight: 420, whiteSpace: 'pre-wrap' }}>{logs.length ? logs.join('\n') : '暂无日志'}</pre>
    </Drawer>
  </>;
}
