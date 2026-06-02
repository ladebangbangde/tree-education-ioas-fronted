import { ClearOutlined, CloseOutlined, PauseCircleOutlined, PlayCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Progress, Space, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadManager } from '@/hooks/useUploadManager';
import type { GlobalUploadItem, GlobalUploadStatus } from '@/services/uploadManager';

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

type DragPosition = { x: number; y: number };

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

function defaultPosition(collapsed: boolean): DragPosition {
  if (typeof window === 'undefined') return { x: 24, y: 24 };
  const width = collapsed ? 190 : 440;
  return { x: Math.max(16, window.innerWidth - width - 24), y: Math.max(72, window.innerHeight - 280) };
}

function clampPosition(next: DragPosition, collapsed: boolean): DragPosition {
  if (typeof window === 'undefined') return next;
  const width = collapsed ? 190 : 440;
  return {
    x: Math.min(Math.max(16, next.x), Math.max(16, window.innerWidth - width - 16)),
    y: Math.min(Math.max(72, next.y), Math.max(72, window.innerHeight - 80))
  };
}

export default function GlobalUploadPanel() {
  const nav = useNavigate();
  const { items, uploadManager } = useUploadManager();
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState<DragPosition>(() => {
    const saved = localStorage.getItem('globalUploadCenterPosition');
    if (!saved) return defaultPosition(false);
    try { return clampPosition(JSON.parse(saved), false); } catch { return defaultPosition(false); }
  });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const activeCount = useMemo(() => items.filter(item => ['queued', 'uploading', 'processing'].includes(item.status)).length, [items]);

  useEffect(() => {
    setPosition(current => clampPosition(current, collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('globalUploadCenterPosition', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const onResize = () => setPosition(current => clampPosition(current, collapsed));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [collapsed]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button,a,input,textarea,.ant-btn,.ant-dropdown-trigger')) return;
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: position.x, baseY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPosition(clampPosition({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy }, collapsed));
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { undefined; }
  };

  if (!items.length) return null;

  return <div className='global-upload-center' style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 1000, width: collapsed ? 190 : 440 }}>
    <Card
      size='small'
      title={<div className='global-upload-drag-handle' onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}><Space><Badge count={activeCount} showZero={false} />全局上传中心</Space><Typography.Text type='secondary'>拖动此处移动</Typography.Text></div>}
      extra={<Space>
        <Button size='small' type='text' onClick={() => nav('/tasks')}>任务中心</Button>
        <Button size='small' type='text' onClick={() => setCollapsed(!collapsed)}>{collapsed ? '展开' : '收起'}</Button>
        <Tooltip title='清空已完成/失败/取消'><Button size='small' type='text' icon={<ClearOutlined />} onClick={() => uploadManager.clearTerminal()} /></Tooltip>
      </Space>}
      styles={{ body: { padding: collapsed ? 0 : 12 } }}
    >
      {!collapsed && <Space direction='vertical' style={{ width: '100%', maxHeight: 460, overflowY: 'auto' }} size={12}>
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
