import { Button, Card, Col, Empty, List, Popconfirm, Row, Space, Tag, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { DeleteOutlined, DownloadOutlined, EditOutlined, FileImageOutlined, FileTextOutlined, FolderFilled, PlayCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

export type AssetViewType = 'all' | 'script' | 'video' | 'image';

const typeLabel: Record<AssetFileType, string> = { script: '脚本', video: '视频', image: '图片' };
const typeIcon: Record<AssetFileType, React.ReactNode> = { script: <FileTextOutlined />, video: <PlayCircleOutlined />, image: <FileImageOutlined /> };
const viewTabs: Array<{ key: AssetViewType; label: string; icon: React.ReactNode }> = [
  { key: 'all', label: '全部', icon: <FolderFilled /> },
  { key: 'script', label: '脚本', icon: <FileTextOutlined /> },
  { key: 'video', label: '视频', icon: <PlayCircleOutlined /> },
  { key: 'image', label: '图片', icon: <FileImageOutlined /> }
];

export interface ResourceActionPermissions {
  canPreview: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canGenerateLead: boolean;
  canUpload: boolean;
}

interface AssetViewProps {
  files: AssetFile[];
  permissions: ResourceActionPermissions;
  onPreview?: (file: AssetFile) => void;
  onDownload?: (file: AssetFile) => void;
  onDeleteFile?: (file: AssetFile) => void;
}

const formatSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${(size / 1024).toFixed(1)}KB`;
const statusTag = (file: AssetFile) => <Tag color={file.uploadStatus === 'success' ? 'green' : 'red'}>{file.uploadStatus}</Tag>;

function FileActions({ file, permissions, onPreview, onDownload, onDeleteFile }: AssetViewProps & { file: AssetFile }) {
  return <Space split={<span className='asset-action-split' />}>
    {permissions.canDownload && <Button type='link' icon={<DownloadOutlined />} onClick={() => onDownload?.(file)}>下载</Button>}
    {permissions.canPreview && <Button type='link' onClick={() => onPreview?.(file)}>{file.fileType === 'script' ? '预览脚本' : file.fileType === 'image' ? '预览图片' : '播放视频'}</Button>}
    {permissions.canDelete && <Popconfirm title='删除该文件后，主题包仍会保留，相关文件数量将同步更新，是否继续？' onConfirm={() => onDeleteFile?.(file)}><Button type='link' danger icon={<DeleteOutlined />}>删除文件</Button></Popconfirm>}
    {statusTag(file)}
  </Space>;
}

export function ScriptFileList(props: AssetViewProps) {
  const scripts = props.files.filter(file => file.fileType === 'script');
  return <List
    className='script-file-list'
    bordered
    dataSource={scripts}
    locale={{ emptyText: '暂无脚本文件' }}
    renderItem={file => <List.Item actions={[<FileActions key='actions' file={file} {...props} />]}>
      <List.Item.Meta
        avatar={<FileTextOutlined className='asset-list-icon script' />}
        title={file.fileName}
        description={<Space direction='vertical' size={2}><span>文件类型：{file.mimeType} · {formatSize(file.fileSize)}</span><Typography.Text type='secondary'>文案摘要：{file.previewUrl || '暂未提取摘要，上传后可在此展示脚本内容摘要。'}</Typography.Text></Space>}
      />
    </List.Item>}
  />;
}

export function VideoFileList(props: AssetViewProps) {
  const videos = props.files.filter(file => file.fileType === 'video');
  return <Row gutter={[16, 16]}>
    {videos.length ? videos.map(file => <Col span={12} key={file.id}>
      <Card className='video-file-card' cover={<div className='video-thumb'>{file.thumbnailUrl ? <img src={file.thumbnailUrl} /> : <PlayCircleOutlined />}<PlayCircleOutlined className='video-play-mark' /></div>}>
        <Card.Meta title={file.fileName} description={<Space direction='vertical' size={4}>
          <span>{file.mimeType} · {formatSize(file.fileSize)}</span>
          <span>时长：待补充 · 画幅：待识别</span>
          <FileActions file={file} {...props} />
        </Space>} />
      </Card>
    </Col>) : <Col span={24}><Empty description='暂无视频文件' /></Col>}
  </Row>;
}

export function ImageFileGrid(props: AssetViewProps) {
  const images = props.files.filter(file => file.fileType === 'image');
  return <Row gutter={[16, 16]}>
    {images.length ? images.map(file => <Col span={8} key={file.id}>
      <Card className='image-file-card' cover={<div className='image-thumb'>{file.thumbnailUrl || file.previewUrl ? <img src={file.thumbnailUrl || file.previewUrl} /> : <FileImageOutlined />}</div>}>
        <Card.Meta title={file.fileName} description={<Space direction='vertical' size={4}>
          <span>{file.mimeType} · {formatSize(file.fileSize)}</span>
          <span>尺寸：待识别</span>
          <FileActions file={file} {...props} />
        </Space>} />
      </Card>
    </Col>) : <Col span={24}><Empty description='暂无图片文件' /></Col>}
  </Row>;
}

export function AllAssetsGroupedView(props: AssetViewProps) {
  return <Space direction='vertical' size={18} className='all-assets-view'>
    <Card size='small' title={<Space><FileTextOutlined />脚本区块</Space>}><ScriptFileList {...props} /></Card>
    <Card size='small' title={<Space><PlayCircleOutlined />视频区块</Space>}><VideoFileList {...props} /></Card>
    <Card size='small' title={<Space><FileImageOutlined />图片区块</Space>}><ImageFileGrid {...props} /></Card>
  </Space>;
}

export default function AssetFolderBrowser({ packages, files, permissions = { canPreview: false, canDownload: false, canEdit: false, canDelete: false, canGenerateLead: true, canUpload: false }, onView, onPreview, onDownload, onEdit, onDelete, onDeleteFile, onUpload, onGenerateLead }: { packages: ContentPackage[]; files: AssetFile[]; permissions?: ResourceActionPermissions; onView: (pkg: ContentPackage) => void; onPreview?: (file: AssetFile) => void; onDownload?: (file: AssetFile) => void; onEdit?: (pkg: ContentPackage) => void; onDelete?: (pkg: ContentPackage) => void; onDeleteFile?: (file: AssetFile) => void; onUpload?: (pkg: ContentPackage) => void; onGenerateLead?: (pkg: ContentPackage) => void }) {
  const [selectedTreeKey, setSelectedTreeKey] = useState<string>();
  const [selectedPackageId, setSelectedPackageId] = useState<string>();
  const [activeAssetType, setActiveAssetType] = useState<AssetViewType>('all');
  const treeData = useMemo<DataNode[]>(() => {
    const operatorMap = new Map<string, ContentPackage[]>();
    packages.forEach(pkg => operatorMap.set(pkg.operatorName, [...(operatorMap.get(pkg.operatorName) || []), pkg]));
    return Array.from(operatorMap.entries()).map(([operatorName, pkgs]) => ({
      title: operatorName,
      key: operatorName,
      icon: <FolderFilled />,
      children: pkgs.map(pkg => ({
        title: `${pkg.folderPath.year}/${String(pkg.folderPath.month).padStart(2, '0')}/${String(pkg.folderPath.day).padStart(2, '0')}/${pkg.topicName}`,
        key: pkg.id,
        icon: <FolderFilled />,
        children: (['script','video','image'] as AssetFileType[]).map(type => ({ title: typeLabel[type], key: `${pkg.id}-${type}`, icon: <FolderFilled /> }))
      }))
    }));
  }, [packages]);
  const current = packages.find(pkg => pkg.id === selectedPackageId);
  const packageFiles = useMemo(() => current ? files.filter(file => file.packageId === current.id) : [], [current, files]);
  const filteredFiles = useMemo(() => activeAssetType === 'all' ? packageFiles : packageFiles.filter(file => file.fileType === activeAssetType), [activeAssetType, packageFiles]);
  const countByType = (type: AssetViewType) => type === 'all' ? packageFiles.length : packageFiles.filter(file => file.fileType === type).length;
  const packageActions = current ? <Space className='folder-action-bar' size={10}>
    <Button onClick={() => onView(current)}>查看详情</Button>
    {permissions.canEdit && <Button icon={<EditOutlined />} onClick={() => onEdit?.(current)}>编辑</Button>}
    {permissions.canUpload && <Button type='primary' icon={<UploadOutlined />} onClick={() => onUpload?.(current)}>上传文件</Button>}
    {permissions.canDelete && <Popconfirm title='删除主题包后，将同时移除该主题包下全部脚本、视频和图片文件，是否继续？' onConfirm={() => onDelete?.(current)}><Button danger icon={<DeleteOutlined />}>删除主题包</Button></Popconfirm>}
    {permissions.canGenerateLead && <Button type='primary' onClick={() => onGenerateLead?.(current)}>基于素材生成线索</Button>}
  </Space> : null;
  const viewProps = { files: filteredFiles, permissions, onPreview, onDownload, onDeleteFile };
  return <Row gutter={[16, 16]}>
    <Col span={7}>
      <Card title='素材目录树' className='folder-panel'>
        <Tree showIcon defaultExpandAll treeData={treeData} selectedKeys={selectedTreeKey ? [selectedTreeKey] : []} onSelect={keys => {
          const key = String(keys[0] || '');
          setSelectedTreeKey(key || undefined);
          if (!key) { setSelectedPackageId(undefined); setActiveAssetType('all'); return; }
          const maybeType = key.split('-').pop() as AssetFileType;
          const packageId = key.includes('-') ? key.split('-').slice(0, -1).join('-') : key;
          if (packages.some(pkg => pkg.id === packageId)) { setSelectedPackageId(packageId); setActiveAssetType(['script','video','image'].includes(maybeType) ? maybeType : 'all'); }
          else { setSelectedPackageId(undefined); setActiveAssetType('all'); }
        }} />
      </Card>
    </Col>
    <Col span={17}>
      {!current ? <Empty description='请选择一个主题包查看素材，选择运营上级目录时会取消当前主题包焦点' /> : <Card title={<Space><FolderFilled className='folder-icon' />{current.operatorName} / {current.folderPath.year} / {String(current.folderPath.month).padStart(2, '0')} / {String(current.folderPath.day).padStart(2, '0')} / {current.topicName}</Space>} extra={packageActions}>
        <Row gutter={[12, 12]} className='asset-type-switch mb12'>
          {viewTabs.map(tab => <Col span={6} key={tab.key}>
            <Card size='small' className={`asset-type-card ${activeAssetType === tab.key ? 'active' : ''}`} onClick={() => setActiveAssetType(tab.key)}>
              <Space>{tab.icon}<div><b>{tab.label}</b><br/><Typography.Text type='secondary'>{countByType(tab.key)} 个文件</Typography.Text></div></Space>
            </Card>
          </Col>)}
        </Row>
        {activeAssetType === 'all' && <AllAssetsGroupedView {...viewProps} files={packageFiles} />}
        {activeAssetType === 'script' && <ScriptFileList {...viewProps} />}
        {activeAssetType === 'video' && <VideoFileList {...viewProps} />}
        {activeAssetType === 'image' && <ImageFileGrid {...viewProps} />}
      </Card>}
    </Col>
  </Row>;
}
