import { Avatar, Button, Descriptions, Divider, List, Popconfirm, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, FileTextOutlined, PictureOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { DetailDrawer } from '@/components';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const fileTypeMeta: Record<AssetFileType, { label: string; icon: React.ReactNode; color: string }> = {
  script: { label: '脚本文案', icon: <FileTextOutlined />, color: 'purple' },
  video: { label: '视频文件', icon: <PlayCircleOutlined />, color: 'blue' },
  image: { label: '图片文件', icon: <PictureOutlined />, color: 'green' }
};

const formatSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${(size / 1024).toFixed(1)}KB`;

const packageStatusText: Record<string, string> = { pending_upload: '待上传素材', uploading: '上传中', partial_completed: '部分完成', completed: '已完成', deleted: '已删除' };

export default function ContentPackageDetailDrawer({ open, onClose, item, files, extraActions, canDeleteFile, onDeleteFile }: { open: boolean; onClose: () => void; item?: ContentPackage; files: AssetFile[]; extraActions?: React.ReactNode; canDeleteFile?: boolean; onDeleteFile?: (file: AssetFile) => void }) {
  if (!item) return null;
  const fullPath = `${item.folderPath.operatorName} / ${item.folderPath.year} / ${String(item.folderPath.month).padStart(2, '0')} / ${String(item.folderPath.day).padStart(2, '0')} / ${item.topicName}`;
  return <DetailDrawer open={open} onClose={onClose} title='主题包详情' width={720}>
    <Space align='start' size={16} className='package-detail-head'>
      <Avatar shape='square' size={112} src={item.coverUrl} />
      <div>
        <Typography.Title level={4}>{item.topicName}</Typography.Title>
        <Typography.Text type='secondary'>{fullPath}</Typography.Text>
      </div>
    </Space>
    {extraActions && <Space className='mt12'>{extraActions}</Space>}
    <Descriptions column={2} bordered size='small' className='mt12' items={[
      { key: 'operatorName', label: '绑定运营', children: item.operatorName },
      { key: 'createdBy', label: '上传媒体', children: item.createdBy },
      { key: 'createdAt', label: '创建时间', children: item.createdAt },
      { key: 'status', label: '主题包状态', children: packageStatusText[item.uploadStatus] || item.uploadStatus },
      { key: 'scriptCount', label: '脚本文案', children: `${item.scriptCount} 个` },
      { key: 'videoCount', label: '视频文件', children: `${item.videoCount} 个` },
      { key: 'imageCount', label: '图片文件', children: `${item.imageCount} 个` }
    ]} />
    <Divider>虚拟素材目录</Divider>
    {(['script', 'video', 'image'] as AssetFileType[]).map(type => {
      const group = files.filter(file => file.fileType === type).sort((a, b) => a.sortOrder - b.sortOrder);
      const meta = fileTypeMeta[type];
      return <div key={type} className='asset-group'>
        <Typography.Title level={5}><Space>{meta.icon}{fullPath} / {meta.label.replace('文件', '').replace('文案', '')}</Space></Typography.Title>
        <List
          size='small'
          dataSource={group}
          locale={{ emptyText: '暂无文件' }}
          renderItem={file => <List.Item actions={[canDeleteFile && <Popconfirm title='删除后文件将移入回收站，并在 7 天后自动永久删除。7 天内可恢复。' onConfirm={() => onDeleteFile?.(file)}><Button type='link' danger icon={<DeleteOutlined />}>删除文件</Button></Popconfirm>, <Tag color={file.uploadStatus === 'success' ? 'green' : 'red'}>{file.uploadStatus}</Tag>]}> 
            <List.Item.Meta
              avatar={<Avatar shape='square' src={file.thumbnailUrl} icon={meta.icon} />}
              title={<Space><Tag color={meta.color}>{meta.label}</Tag>{file.fileName}</Space>}
              description={<span>{file.mimeType} · {formatSize(file.fileSize)} {file.previewUrl && type === 'script' ? `· ${file.previewUrl}` : ''}</span>}
            />
          </List.Item>}
        />
      </div>;
    })}
  </DetailDrawer>;
}
