import { Avatar, Descriptions, Divider, List, Space, Tag, Typography } from 'antd';
import { FileTextOutlined, PictureOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { DetailDrawer } from '@/components';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const fileTypeMeta: Record<AssetFileType, { label: string; icon: React.ReactNode; color: string }> = {
  script: { label: '脚本文案', icon: <FileTextOutlined />, color: 'purple' },
  video: { label: '视频文件', icon: <PlayCircleOutlined />, color: 'blue' },
  image: { label: '图片文件', icon: <PictureOutlined />, color: 'green' }
};

const formatSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${(size / 1024).toFixed(1)}KB`;

export default function ContentPackageDetailDrawer({ open, onClose, item, files, extraActions }: { open: boolean; onClose: () => void; item?: ContentPackage; files: AssetFile[]; extraActions?: React.ReactNode }) {
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
      { key: 'status', label: '入库状态', children: item.uploadStatus },
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
          renderItem={file => <List.Item actions={[<Tag color={file.uploadStatus === 'success' ? 'green' : 'red'}>{file.uploadStatus}</Tag>]}> 
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
