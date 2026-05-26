import { Button, Descriptions, Drawer, Popconfirm, Progress, Radio, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import { DataTable, PageHeader } from '@/components';
import { removeRecoverableUploadSession } from '@/services/uploadSessionGuard';
import { useAuthStore } from '@/store/auth';
import type { Task } from '@/types/mediaFlow';
import { adaptTask } from '@/utils/adapters/mediaFlow';

const mediaStatus: Record<string, { text: string; color: string; status?: 'success' | 'exception' | 'active' | 'normal' }> = {
  created: { text: '已创建', color: 'default', status: 'normal' },
  processing: { text: '处理中', color: 'processing', status: 'active' },
  uploading: { text: '上传中', color: 'processing', status: 'active' },
  interrupted: { text: '上传中断', color: 'orange', status: 'exception' },
  success: { text: '成功', color: 'green', status: 'success' },
  failed: { text: '失败', color: 'red', status: 'exception' },
  cancelled: { text: '已取消', color: 'default', status: 'exception' },
  partial_success: { text: '部分成功', color: 'gold', status: 'active' },
  pending_supplement: { text: '待补充素材', color: 'orange', status: 'normal' },
  PENDING: { text: '待审批', color: 'orange', status: 'active' },
  APPROVED: { text: '已通过', color: 'green', status: 'success' },
  REJECTED: { text: '已拒绝', color: 'red', status: 'exception' }
};
const operatorStatus: Record<string, { text: string; color: string; status?: 'success' | 'exception' | 'active' | 'normal' }> = { pending: { text: '待处理', color: 'orange' }, processing: { text: '处理中', color: 'processing' }, completed: { text: '已完成', color: 'green', status: 'success' }, overdue: { text: '已逾期', color: 'red', status: 'exception' }, rejected: { text: '已驳回', color: 'volcano', status: 'exception' } };
const taskTypeMeta: Record<string, { text: string; color: string }> = {
  package_create: { text: '主题任务创建', color: 'blue' },
  media_upload: { text: '素材上传任务', color: 'purple' },
  operator_lead_generate: { text: '线索生成任务', color: 'cyan' },
  consultant_qr_upload: { text: '二维码上传任务', color: 'green' },
  consultant_region_change: { text: '地区变更申请', color: 'gold' }
};

const formatDateTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
const isTerminal = (status: string) => ['success', 'failed', 'cancelled', 'completed', 'rejected', 'APPROVED', 'REJECTED'].includes(status);
const canDeleteTask = (task: Task) => isTerminal(task.status);
const formatBytes = (value?: number) => {
  const size = Number(value || 0);
  if (!size) return '-';
  if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};
const formatSpeed = (value?: number) => value ? `${formatBytes(value)}/s` : '-';
type TaskView = 'media' | 'operator' | 'consultant';

export default function TaskCenterPage(){
  const role = useAuthStore(s => s.role);
  const userId = useAuthStore(s => s.id);
  const [adminView, setAdminView] = useState<TaskView>('media');
  const view: TaskView = role === 'OPERATOR' ? 'operator' : role === 'CONSULTANT' ? 'consultant' : role === 'SUPER_ADMIN' ? adminView : 'media';
  const isMedia = view === 'media';
  const isOperator = view === 'operator';
  const isConsultant = view === 'consultant';
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [logTask, setLogTask] = useState<Task>();
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const listLoadingRef = useRef(false);
  const logsLoadingRef = useRef(false);

  const loadData = useCallback(async (quiet = false) => {
    if (listLoadingRef.current) return;
    listLoadingRef.current = true;
    if (!quiet) setLoading(true);
    try {
      const taskRows = isConsultant ? await tasksApi.consultant({ quiet }) : isMedia ? await tasksApi.media({ quiet }) : await tasksApi.operator({ quiet });
      const rows = (taskRows || []).map(row => adaptTask(row, view === 'operator' ? 'operator' : 'media'));
      const visibleRows = role === 'SUPER_ADMIN' ? rows : rows.filter(row => !userId || !row.assigneeId || row.assigneeId === userId);
      setData(visibleRows);
      setSelectedRowKeys(prev => prev.filter(key => visibleRows.some(row => String(row.id) === String(key) && canDeleteTask(row))));
    } finally {
      listLoadingRef.current = false;
      if (!quiet) setLoading(false);
    }
  }, [isConsultant, isMedia, role, userId, view]);

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
    removeRecoverableUploadSession(task.id);
    message.success('任务已取消');
    loadData();
  };
  const batchDeleteTasks = async () => {
    const deletableIds = selectedRowKeys.filter(key => data.some(row => String(row.id) === String(key) && canDeleteTask(row)));
    if (!deletableIds.length) {
      message.warning('请先选择已完成、失败或已取消的任务');
      return;
    }
    const result = await tasksApi.batchDelete(deletableIds, true);
    deletableIds.forEach(id => removeRecoverableUploadSession(String(id)));
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

  const renderTaskTypeTag = (task: Task) => {
    const meta = taskTypeMeta[task.taskType] || { text: task.taskType || '任务', color: 'default' };
    return <Tag color={meta.color}>{meta.text}</Tag>;
  };

  const statusMap = isOperator ? operatorStatus : mediaStatus;
  const renderStatus = (v: string) => <Tag color={statusMap[v]?.color || 'default'}>{statusMap[v]?.text || v}</Tag>;

  const renderProgress = (value: number, task: Task) => {
    const statusMeta = statusMap[task.status] || { text: task.status, color: 'default', status: 'normal' as const };
    return <Progress percent={value || 0} size='small' status={statusMeta.status} />;
  };

  const common = [
    { title: '任务ID', dataIndex: 'id', width: 90 },
    { title: '任务标签', width: 150, render: (_: unknown, r: Task) => renderTaskTypeTag(r) },
    { title: isConsultant ? '关联对象' : '主题名称', width: 220, render: (_: unknown, r: Task) => isConsultant ? r.fileName || r.topicName || '-' : r.topicName || `主题包 #${r.relatedPackageId || '-'}` },
    { title: '任务名称', width: 300, render: (_: unknown, r: Task) => r.title || '-' },
    { title: isMedia ? '绑定运营' : '负责人', width: 140, render: (_: unknown, r: Task) => isMedia ? r.operatorName || '-' : r.assigneeName || '-' },
    { title: '状态', dataIndex: 'status', width: 110, render: renderStatus },
    { title: '进度', dataIndex: 'progress', width: 180, render: (v: number, r: Task) => renderProgress(v, r) },
    { title: '文件大小', width: 120, render: (_: unknown, r: Task) => formatBytes(r.fileSize) },
    { title: '对象路径', width: 360, render: (_: unknown, r: Task) => r.uploadObjectKey || '-' },
    { title: '开始时间', dataIndex: 'createdAt', width: 170, render: formatDateTime },
    { title: '完成时间', dataIndex: 'completedAt', width: 170, render: formatDateTime },
    { title: '失败原因', dataIndex: 'errorMessage', width: 240, render: (v?: string) => v || '-' }
  ];

  const columns = [
    ...common,
    { title: '操作', fixed: 'right' as const, width: isOperator ? 180 : 120, render: (_: unknown, r: Task) => <Space>
      {isOperator && r.status !== 'completed' && <Button type='link' onClick={() => patchTask(r, 'process')}>去生成线索</Button>}
      <Button type='link' onClick={() => openLogs(r)}>日志</Button>
      {!isTerminal(r.status) && !isConsultant && <Popconfirm title='取消后该任务会进入已取消状态，是否继续？' onConfirm={() => cancelTask(r)}><Button type='link' danger>取消</Button></Popconfirm>}
    </Space> }
  ];

  const extra = <Space>
    {role === 'SUPER_ADMIN' && <Radio.Group size='small' value={adminView} onChange={event => { setAdminView(event.target.value); setData([]); setSelectedRowKeys([]); }} options={[{ label: '媒体任务', value: 'media' }, { label: '运营任务', value: 'operator' }, { label: '顾问任务', value: 'consultant' }]} />}
    <span>{isConsultant ? `二维码上传 / 地区变更任务，3秒自动刷新｜进行中 ${activeCount} 个` : isMedia ? `主题创建 / 素材上传任务，3秒自动刷新｜进行中 ${activeCount} 个` : `运营任务，3秒自动刷新｜进行中 ${activeCount} 个`}</span>
    <Popconfirm title={`确认永久删除选中的 ${selectedRowKeys.length} 个任务？会同步删除已绑定的 MinIO 对象、资产记录和任务日志。进行中任务不可删除。`} disabled={!selectedRowKeys.length} onConfirm={batchDeleteTasks}>
      <Button danger disabled={!selectedRowKeys.length}>批量删除</Button>
    </Popconfirm>
  </Space>;

  return <>
    <PageHeader title={isConsultant ? '任务中心｜顾问任务' : isMedia ? '任务中心｜媒体任务' : '任务中心｜线索生成任务'} extra={extra} />
    <DataTable
      loading={loading}
      rowKey='id'
      columns={columns as any}
      dataSource={data}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        preserveSelectedRowKeys: true,
        getCheckboxProps: record => ({ disabled: !canDeleteTask(record), title: canDeleteTask(record) ? '可删除' : '进行中任务不可删除' })
      }}
      scroll={{ x: 2100 }}
    />
    <Drawer open={Boolean(logTask)} onClose={() => { setLogTask(undefined); setLogs([]); }} title={`任务日志：${logTask?.id || ''}`} width={760}>
      <Typography.Paragraph type='secondary'>每个任务独立日志文件：task-{logTask?.id}.log，3 秒自动刷新。</Typography.Paragraph>
      <Descriptions column={1} size='small' bordered style={{ marginBottom: 12 }}>
        <Descriptions.Item label='任务'>{logTask?.title || '-'}</Descriptions.Item>
        <Descriptions.Item label='文件对象'>{logTask?.uploadObjectKey || '-'}</Descriptions.Item>
        <Descriptions.Item label='公开地址'>{logTask?.uploadPublicUrl || '-'}</Descriptions.Item>
      </Descriptions>
      <pre style={{ background: '#0b1220', color: '#d7e2ff', padding: 16, borderRadius: 12, minHeight: 420, whiteSpace: 'pre-wrap' }}>{logs.length ? logs.join('\n') : '暂无日志'}</pre>
    </Drawer>
  </>;
}