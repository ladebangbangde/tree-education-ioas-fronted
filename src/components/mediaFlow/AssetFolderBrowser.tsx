import { Button, Card, Col, Empty, List, Popconfirm, Row, Space, Tag, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { DeleteOutlined, DownloadOutlined, EditOutlined, FileImageOutlined, FileTextOutlined, FolderFilled, PlayCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const typeLabel: Record<AssetFileType, string> = { script: '脚本', video: '视频', image: '图片' };
const typeIcon: Record<AssetFileType, React.ReactNode> = { script: <FileTextOutlined />, video: <PlayCircleOutlined />, image: <FileImageOutlined /> };

export interface ResourceActionPermissions {
  canPreview: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canGenerateLead: boolean;
  canUpload: boolean;
}

export default function AssetFolderBrowser({ packages, files, permissions, onView, onPreview, onDownload, onEdit, onDelete, onUpload, onGenerateLead }: { packages: ContentPackage[]; files: AssetFile[]; permissions: ResourceActionPermissions; onView: (pkg: ContentPackage) => void; onPreview?: (file: AssetFile) => void; onDownload?: (file: AssetFile) => void; onEdit?: (pkg: ContentPackage) => void; onDelete?: (pkg: ContentPackage) => void; onUpload?: (pkg: ContentPackage) => void; onGenerateLead?: (pkg: ContentPackage) => void }) {
  const [selectedTreeKey, setSelectedTreeKey] = useState<string>();
  const [selectedPackageId, setSelectedPackageId] = useState<string>();
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
  const currentFiles = current ? files.filter(file => file.packageId === current.id) : [];
  const packageActions = current ? <Space className='folder-action-bar' size={10}>
    <Button onClick={() => onView(current)}>查看详情</Button>
    {permissions.canEdit && <Button icon={<EditOutlined />} onClick={() => onEdit?.(current)}>编辑</Button>}
    {permissions.canUpload && <Button type='primary' icon={<UploadOutlined />} onClick={() => onUpload?.(current)}>上传文件</Button>}
    {permissions.canDelete && <Popconfirm title='确认删除该主题包？' onConfirm={() => onDelete?.(current)}><Button danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>}
    {permissions.canGenerateLead && <Button type='primary' onClick={() => onGenerateLead?.(current)}>基于素材生成线索</Button>}
  </Space> : null;
  return <Row gutter={[16, 16]}>
    <Col span={7}>
      <Card title='素材目录树' className='folder-panel'>
        <Tree showIcon defaultExpandAll treeData={treeData} selectedKeys={selectedTreeKey ? [selectedTreeKey] : []} onSelect={keys => {
          const key = String(keys[0] || '');
          setSelectedTreeKey(key || undefined);
          if (!key) { setSelectedPackageId(undefined); return; }
          const packageId = key.includes('-') ? key.split('-').slice(0, -1).join('-') : key;
          setSelectedPackageId(packages.some(pkg => pkg.id === packageId) ? packageId : undefined);
        }} />
      </Card>
    </Col>
    <Col span={17}>
      {!current ? <Empty description='请选择一个主题包查看素材，选择运营上级目录时会取消当前主题包焦点' /> : <Card title={<Space><FolderFilled className='folder-icon' />{current.operatorName} / {current.folderPath.year} / {String(current.folderPath.month).padStart(2, '0')} / {String(current.folderPath.day).padStart(2, '0')} / {current.topicName}</Space>} extra={packageActions}>
        <Row gutter={[12, 12]} className='mb12'>
          {(['script','video','image'] as AssetFileType[]).map(type => <Col span={8} key={type}>
            <Card size='small' className='folder-card'><Space><FolderFilled className='folder-icon' /><div><b>{typeLabel[type]}</b><br/><Typography.Text type='secondary'>{currentFiles.filter(file => file.fileType === type).length} 个文件</Typography.Text></div></Space></Card>
          </Col>)}
        </Row>
        <List
          bordered
          dataSource={currentFiles}
          renderItem={file => {
            const actions = [<Tag color={file.uploadStatus === 'success' ? 'green' : 'red'}>{file.uploadStatus}</Tag>];
            if (permissions.canPreview) actions.unshift(<Button type='link' onClick={() => onPreview?.(file)}>{file.fileType === 'script' ? '预览脚本' : file.fileType === 'image' ? '预览图片' : '播放视频'}</Button>);
            if (permissions.canDownload) actions.unshift(<Button type='link' icon={<DownloadOutlined />} onClick={() => onDownload?.(file)}>下载</Button>);
            return <List.Item actions={actions}>
              <List.Item.Meta avatar={typeIcon[file.fileType]} title={file.fileName} description={`${typeLabel[file.fileType]} · ${file.mimeType}`} />
            </List.Item>;
          }}
        />
      </Card>}
    </Col>
  </Row>;
}
