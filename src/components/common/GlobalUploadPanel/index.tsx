import { ClearOutlined, CloseOutlined, PauseCircleOutlined, PlayCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Card, Progress, Space, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadManager } from '@/hooks/useUploadManager';
import type { GlobalUploadItem, GlobalUploadStatus, RecoverableUploadSession } from '@/services/uploadManager';

const statusMeta: Record<GlobalUploadStatus, { text: string; color: string; progress?: 'success' | 'exception' | 'active' | 'normal' }> = {
  queued: { text: '排队中', color: 'default', progress: 'normal' },
  uploading: { text: '上传中', color: 'processing', progress: 'active' },
  processing: { text: '处理中', color: 'processing', progress: 'active' },
  success: { text: '已完成', color: 'green', progress: 'success' },
  failed: { text: '失败', color: 'red', progress: 'exception' },
  cancelled: { text: '已取消', color: 'default', progress: 'exception' },
  interrupted: { text: '已中断', color: 'orange', progress: 'exception' },
  paused: { text: '已暂停', color: 'gold', progress: 'normal' }
};

const formatBytes = (value?: number) => {
  const size = Number(value || 0);
  if (!size) return '-';
  if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};
const formatSpeed = (value?: number) => value ? `${formatBytes(value)}/s` : '-';
const isTerminal = (item: GlobalUploadItem) => ['success', 'failed', 'cancelled'].includes(item.status);

export default function GlobalUploadPanel() {
  const nav = useNavigate();
  const { items, uploadManager } = useUploadManager();
  const [collapsed, setCollapsed] = useState(false);
  const [recoverable, setRecoverable] = useState<RecoverableUploadSession[]>([]);
  const activeCount = useMemo(() => items.filter(item => ['queued', 'uploading', 'processing'].includes(item.status)).length, [items]);

  useEffect(() => {
    const load = () => setRecoverable(uploadManager.listRecoverableSessions());
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [uploadManager]);

  if (!items.length && !recoverable.length) return null;

  return <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000, width: collapsed ? 190 : 440 }}>
    <Card
      size='small'
      title={<Space><Badge count={activeCount} showZero={false} />全局上传中心</Space>}
      extra={<Space>
        <Button size='small' type='text' onClick={() => nav('/tasks')}>任务中心</Button>
        <Button size='small' type='text' onClick={() => setCollapsed(!collapsed)}>{collapsed ? '展开' : '收起'}</Button>
        <Tooltip title='清空已完成/失败/取消'><Button size='small' type='text' icon={<ClearOutlined />} onClick={() => uploadManager.clearTerminal()} /></Tooltip>
      </Space>}
      styles={{ body: { padding: collapsed ? 0 : 12 } }}
    >
      {!collapsed && <Space direction='vertical' style={{ width: '100%', maxHeight: 460, overflowY: 'auto' }} size={12}>
        {recoverable.length > 0 && <Alert
          type='warning'
          showIcon
          message={`检测到 ${recoverable.length} 个可恢复上传任务`}
          description='浏览器刷新/关闭后，本地文件句柄已丢失。请进入任务中心点击“继续上传”，重新选择原文件恢复。'
          action={<Button size='small' type='primary' onClick={() => nav('/tasks')}>去恢复</Button>}
        />}
        {items.map(item => {
          const meta = statusMeta[item.status];
          return <div key={item.id} style={{ border: '1px solid #edf0f5', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <Typography.Text ellipsis style={{ maxWidth: 270 }} title={item.fileName}>{item.fileName}</Typography.Text>
              <Tag color={meta.color}>{meta.text}</Tag>
            </div>
            <Progress percent={item.progress || 0} size='small' status={meta.progress} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
              <span>{formatBytes(item.loaded)} / {formatBytes(item.total || item.fileSize)}</span>
              <span>{formatSpeed(item.speed)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginTop: 4, gap: 8 }}>
              <span>{item.partCount ? `分片 ${item.completedPartCount || 0}/${item.partCount}` : `任务 ${item.taskId || '-'}`}</span>
              <Typography.Text type='secondary' ellipsis style={{ maxWidth: 240 }}>{item.errorMessage || ''}</Typography.Text>
            </div>
            <Space size={8} style={{ marginTop: 8 }} wrap>
              {item.taskId && <Button size='small' icon={<ProfileOutlined />} onClick={() => nav('/tasks')}>查看任务</Button>}
              {['queued', 'uploading', 'processing'].includes(item.status) && <Button size='small' icon={<PauseCircleOutlined />} onClick={() => uploadManager.pause(item.id)}>暂停</Button>}
              {['paused', 'interrupted', 'failed'].includes(item.status) && <Button size='small' type='primary' icon={<PlayCircleOutlined />} onClick={() => uploadManager.resume(item.id)}>继续</Button>}
              {!isTerminal(item) && <Button size='small' danger icon={<CloseOutlined />} onClick={() => uploadManager.cancel(item.id)}>取消</Button>}
              {isTerminal(item) && <Button size='small' onClick={() => uploadManager.remove(item.id)}>移除</Button>}
            </Space>
          </div>;
        })}
      </Space>}
    </Card>
  </div>;
}
