import { Button, Card, Col, Empty, List, Row, Space, Tag, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FileImageOutlined, FileTextOutlined, FolderFilled, PlayCircleOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const typeLabel: Record<AssetFileType, string> = { script: '脚本', video: '视频', image: '图片' };
const typeIcon: Record<AssetFileType, React.ReactNode> = { script: <FileTextOutlined />, video: <PlayCircleOutlined />, image: <FileImageOutlined /> };

export default function AssetFolderBrowser({ packages, files, onView, onGenerateLead }: { packages: ContentPackage[]; files: AssetFile[]; onView: (pkg: ContentPackage) => void; onGenerateLead?: (pkg: ContentPackage) => void }) {
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id);
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
  const current = packages.find(pkg => pkg.id === selectedPackageId) || packages[0];
  const currentFiles = current ? files.filter(file => file.packageId === current.id) : [];
  return <Row gutter={[16, 16]}>
    <Col span={7}>
      <Card title='素材目录树' className='folder-panel'>
        <Tree showIcon defaultExpandAll treeData={treeData} selectedKeys={selectedPackageId ? [selectedPackageId] : []} onSelect={keys => {
          const key = String(keys[0] || '');
          const packageId = key.includes('-') ? key.split('-').slice(0, -1).join('-') : key;
          if (packages.some(pkg => pkg.id === packageId)) setSelectedPackageId(packageId);
        }} />
      </Card>
    </Col>
    <Col span={17}>
      {!current ? <Empty description='暂无素材主题' /> : <Card title={<Space><FolderFilled className='folder-icon' />{current.operatorName} / {current.folderPath.year} / {String(current.folderPath.month).padStart(2, '0')} / {String(current.folderPath.day).padStart(2, '0')} / {current.topicName}</Space>} extra={<Space><Button onClick={() => onView(current)}>查看详情</Button>{onGenerateLead && <Button type='primary' onClick={() => onGenerateLead(current)}>基于素材生成线索</Button>}</Space>}>
        <Row gutter={[12, 12]} className='mb12'>
          {(['script','video','image'] as AssetFileType[]).map(type => <Col span={8} key={type}>
            <Card size='small' className='folder-card'><Space><FolderFilled className='folder-icon' /><div><b>{typeLabel[type]}</b><br/><Typography.Text type='secondary'>{currentFiles.filter(file => file.fileType === type).length} 个文件</Typography.Text></div></Space></Card>
          </Col>)}
        </Row>
        <List
          bordered
          dataSource={currentFiles}
          renderItem={file => <List.Item actions={[file.fileType === 'script' ? <Button type='link'>预览脚本</Button> : file.fileType === 'image' ? <Button type='link'>预览图片</Button> : <Button type='link'>播放视频</Button>, <Tag color={file.uploadStatus === 'success' ? 'green' : 'red'}>{file.uploadStatus}</Tag>]}> 
            <List.Item.Meta avatar={typeIcon[file.fileType]} title={file.fileName} description={`${typeLabel[file.fileType]} · ${file.mimeType}`} />
          </List.Item>}
        />
      </Card>}
    </Col>
  </Row>;
}
