import { Button, Progress, Space, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import { DataTable, PageHeader } from '@/components';
import { useAuthStore } from '@/store/auth';
import type { Task } from '@/types/mediaFlow';
import { adaptTask } from '@/utils/adapters/mediaFlow';

const mediaStatus: Record<string, { text: string; color: string }> = {
  created: { text: '已创建', color: 'default' },
  processing: { text: '处理中', color: 'processing' },
  uploading: { text: '上传中', color: 'processing' },
  success: { text: '上传成功', color: 'green' },
  failed: { text: '上传失败', color: 'red' },
  partial_success: { text: '部分成功', color: 'gold' },
  pending_supplement: { text: '待补充素材', color: 'orange' }
};
const operatorStatus: Record<string, { text: string; color: string }> = { pending: { text: '待处理', color: 'orange' }, processing: { text: '处理中', color: 'processing' }, completed: { text: '已完成', color: 'green' }, overdue: { text: '已逾期', color: 'red' }, rejected: { text: '已驳回', color: 'volcano' } };

const formatDateTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
const displayCount = (value?: number) => value === undefined || value === null ? '-' : value;

export default function TaskCenterPage(){
  const role = useAuthStore(s => s.role);
  const userId = useAuthStore(s => s.id);
  const isMedia = role === 'MEDIA';
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const taskRows = isMedia ? await tasksApi.media() : await tasksApi.operator();
      const rows = (taskRows || []).map(row => adaptTask(row, isMedia ? 'media' : 'operator'));
      const visibleRows = role === 'SUPER_ADMIN' ? rows : rows.filter(row => !userId || !row.assigneeId || row.assigneeId === userId);
      setData(visibleRows);
    } finally { setLoading(false); }
  }, [isMedia, role, userId]);
  useEffect(() => { loadData().catch(() => undefined); }, [loadData]);

  const patchTask = async (task: Task, action: string) => {
    await tasksApi.update(task.id, { action });
    message.success('任务已更新');
    loadData();
  };

  const common = [
    { title: '主题名称', render: (_: unknown, r: Task) => r.topicName || r.title || `主题包 #${r.relatedPackageId || '-'}` },
    { title: isMedia ? '绑定运营' : '负责人', render: (_: unknown, r: Task) => isMedia ? r.operatorName || r.assigneeName || '-' : r.assigneeName || '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => { const map = isMedia ? mediaStatus : operatorStatus; return <Tag color={map[v]?.color}>{map[v]?.text || v}</Tag>; } },
    { title: '进度', dataIndex: 'progress', width: 180, render: (v: number) => <Progress percent={v || 0} size='small' /> },
    { title: '开始时间', dataIndex: 'createdAt', render: formatDateTime },
    { title: '完成时间', dataIndex: 'completedAt', render: formatDateTime }
  ];
  const mediaColumns = [
    ...common.slice(0, 2),
    { title: '文件总数', render: (_: unknown, r: Task) => displayCount(r.fileTotal) },
    { title: '成功数', render: (_: unknown, r: Task) => displayCount(r.successCount) },
    { title: '失败数', render: (_: unknown, r: Task) => displayCount(r.failedCount) },
    ...common.slice(2),
    { title: '失败原因', dataIndex: 'errorMessage', render: (v?: string) => v || '-' },
    { title: '操作', render: (_: unknown, r: Task) => r.status === 'failed' || r.status === 'partial_success' || r.status === 'pending_supplement' ? <Button type='link' onClick={() => patchTask(r, 'retry')}>重试</Button> : '-' }
  ];
  const operatorColumns = [...common, { title: '任务类型', render: () => '基于素材生成线索' }, { title: '关联线索', dataIndex: 'relatedLeadId', render: (v?: string) => v || '-' }, { title: '操作', render: (_: unknown, r: Task) => <Space>{r.status !== 'completed' && <Button type='link' onClick={() => patchTask(r, 'process')}>去生成线索</Button>}<Button type='link' onClick={() => message.info('请到媒体资源中心查看素材详情')}>查看素材</Button></Space> }];
  return <>
    <PageHeader title={isMedia ? '任务中心｜上传任务' : '任务中心｜线索生成任务'} extra={<span>{isMedia ? '媒体只负责上传入库结果' : '素材入库后自动生成运营待处理任务'}</span>} />
    <DataTable loading={loading} rowKey='id' columns={isMedia ? mediaColumns : operatorColumns} dataSource={data} />
  </>;
}
