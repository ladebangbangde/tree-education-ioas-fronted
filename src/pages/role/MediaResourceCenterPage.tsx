import { Button, Form, Input, Modal, Select, Space, Upload, message } from 'antd';
import { DownloadOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import AssetFolderBrowser from '@/components/mediaFlow/AssetFolderBrowser';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { assetFiles, contentPackages, operatorProfiles } from '@/mock/mediaFlow';
import { useAuthStore } from '@/store/auth';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const fileMeta: Record<AssetFileType, { mimeType: string; defaultName: string }> = {
  script: { mimeType: 'application/octet-stream', defaultName: '新脚本文案.docx' },
  video: { mimeType: 'video/mp4', defaultName: '新视频素材.mp4' },
  image: { mimeType: 'image/jpeg', defaultName: '新图片素材.jpg' }
};

export default function MediaResourceCenterPage(){
  const role = useAuthStore(s => s.role);
  const [packages, setPackages] = useState(contentPackages);
  const [files, setFiles] = useState<AssetFile[]>(assetFiles);
  const [detail, setDetail] = useState<ContentPackage>();
  const [leadPackage, setLeadPackage] = useState<ContentPackage>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [operatorId, setOperatorId] = useState<string>();
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const detailFiles = useMemo(() => files.filter(file => file.packageId === detail?.id), [detail, files]);
  const filteredPackages = packages.filter(pkg => (!query || pkg.topicName.includes(query) || pkg.operatorName.includes(query)) && (!operatorId || pkg.operatorId === operatorId));
  const permissions = {
    canPreview: canUseButton(role, 'preview'),
    canDownload: canUseButton(role, 'download'),
    canEdit: canUseButton(role, 'editOwnContent'),
    canDelete: canUseButton(role, 'deleteOwnContent'),
    canGenerateLead: canUseButton(role, 'generateLead'),
    canUpload: canUseButton(role, 'upload')
  };
  const openUpload = (pkg?: ContentPackage) => { uploadForm.resetFields(); if (pkg) uploadForm.setFieldsValue({ packageId: pkg.id }); setUploadOpen(true); };
  const handleDownload = (file: AssetFile) => message.success(`已开始下载：${file.fileName}`);
  const handlePreview = (file: AssetFile) => message.info(`${file.fileType === 'video' ? '播放' : '预览'}：${file.fileName}`);
  const createPackage = (values: { operatorId: string; topicName: string }) => {
    const op = operatorProfiles.find(item => item.id === values.operatorId)!;
    const next: ContentPackage = { id: `PKG${Date.now()}`, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { operatorId: op.id, operatorName: op.name, year: 2026, month: 5, day: 8, topicName: values.topicName }, coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=480&q=80', scriptCount: 0, videoCount: 0, imageCount: 0, uploadStatus: 'pending_upload', createdBy: '媒体账号-王悦', createdAt: '2026-05-08 10:00' };
    setPackages(prev => [next, ...prev]); setCreateOpen(false); createForm.resetFields(); message.success(`已创建主题包：${next.folderPath.operatorName} / 2026 / 05 / 08 / ${next.topicName}`);
  };
  const buildFiles = (packageId: string, values: any) => (['script', 'video', 'image'] as AssetFileType[]).flatMap(type => (values[type]?.fileList || []).map((file: any, index: number) => ({ id: `AST${Date.now()}${type}${index}`, packageId, fileName: file.name || fileMeta[type].defaultName, fileType: type, mimeType: file.type || fileMeta[type].mimeType, fileSize: file.size || 0, uploadStatus: 'success' as const, sortOrder: files.filter(item => item.packageId === packageId && item.fileType === type).length + index + 1 })));
  const uploadFilesToPackage = (values: any) => {
    const packageId = values.packageId as string;
    const nextFiles = buildFiles(packageId, values);
    if (!nextFiles.length) { message.warning('请至少上传一类素材文件'); return; }
    const addCount = (type: AssetFileType) => nextFiles.filter(file => file.fileType === type).length;
    setFiles(prev => [...nextFiles, ...prev]);
    setPackages(prev => prev.map(pkg => pkg.id === packageId ? { ...pkg, scriptCount: pkg.scriptCount + addCount('script'), videoCount: pkg.videoCount + addCount('video'), imageCount: pkg.imageCount + addCount('image'), uploadStatus: 'completed' } : pkg));
    setUploadOpen(false); uploadForm.resetFields(); message.success('文件已上传到所选主题包，并按脚本/视频/图片自动归档');
  };
  return <>
    <PageHeader title='媒体资源中心' extra={<Space>
      <Input.Search allowClear placeholder='搜索主题 / 运营' onSearch={setQuery} style={{ width: 240 }} />
      <Select allowClear placeholder='筛选运营' value={operatorId} onChange={setOperatorId} style={{ width: 180 }} options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} />
      {canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload()}>上传文件</Button>}
      {canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建主题包</Button>}
    </Space>} />
    <AssetFolderBrowser
      packages={filteredPackages}
      files={files}
      permissions={permissions}
      onView={setDetail}
      onPreview={handlePreview}
      onDownload={handleDownload}
      onEdit={pkg => { setEditPackage(pkg); editForm.setFieldsValue({ topicName: pkg.topicName, operatorId: pkg.operatorId }); }}
      onUpload={openUpload}
      onDelete={pkg => { setPackages(prev => prev.filter(item => item.id !== pkg.id)); message.success('已删除主题包'); }}
      onGenerateLead={setLeadPackage}
    />
    <ContentPackageDetailDrawer open={Boolean(detail)} onClose={() => setDetail(undefined)} item={detail} files={detailFiles} extraActions={detail && <>
      {canUseButton(role, 'download') && <Button icon={<DownloadOutlined />} onClick={() => message.success(`已打包下载：${detail.topicName}`)}>下载素材包</Button>}
      {canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload(detail)}>上传文件</Button>}
      {canUseButton(role, 'editOwnContent') && <Button onClick={() => { setEditPackage(detail); editForm.setFieldsValue({ topicName: detail.topicName, operatorId: detail.operatorId }); }}>编辑主题</Button>}
      {canUseButton(role, 'generateLead') && <Button type='primary' onClick={() => setLeadPackage(detail)}>基于素材生成线索</Button>}
    </>} />
    <Modal open={createOpen} title='新建主题包' onCancel={() => setCreateOpen(false)} onOk={() => createForm.validateFields().then(createPackage)}>
      <Form form={createForm} layout='vertical'>
        <Form.Item name='operatorId' label='运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item>
      </Form>
    </Modal>
    <Modal open={uploadOpen} title='上传文件到主题包' onCancel={() => setUploadOpen(false)} onOk={() => uploadForm.validateFields().then(uploadFilesToPackage)} width={760}>
      <Form form={uploadForm} layout='vertical'>
        <Form.Item name='packageId' label='选择主题包' rules={[{ required: true, message: '请先选择已有主题包' }]}><Select showSearch optionFilterProp='label' options={packages.map(pkg => ({ value: pkg.id, label: `${pkg.operatorName} / ${pkg.folderPath.year} / ${String(pkg.folderPath.month).padStart(2, '0')} / ${String(pkg.folderPath.day).padStart(2, '0')} / ${pkg.topicName}` }))} /></Form.Item>
        <Form.Item name='script' label='上传脚本'><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>脚本文件将归入 / 脚本</p></Upload.Dragger></Form.Item>
        <Form.Item name='video' label='上传视频'><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>视频文件将归入 / 视频</p></Upload.Dragger></Form.Item>
        <Form.Item name='image' label='上传图片'><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>图片文件将归入 / 图片</p></Upload.Dragger></Form.Item>
      </Form>
    </Modal>
    <Modal open={Boolean(editPackage)} title='编辑主题信息' onCancel={() => setEditPackage(undefined)} onOk={() => editForm.validateFields().then(values => {
      const op = operatorProfiles.find(item => item.id === values.operatorId)!;
      setPackages(prev => prev.map(pkg => pkg.id === editPackage?.id ? { ...pkg, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { ...pkg.folderPath, operatorId: op.id, operatorName: op.name, topicName: values.topicName } } : pkg));
      setEditPackage(undefined); message.success('主题信息已更新，自动路径已同步刷新');
    })}>
      <Form form={editForm} layout='vertical'>
        <Form.Item name='operatorId' label='绑定运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item>
      </Form>
    </Modal>
    <Modal open={Boolean(leadPackage)} title={`基于素材生成线索：${leadPackage?.topicName || ''}`} onCancel={() => setLeadPackage(undefined)} onOk={() => { message.success('线索已创建，对应运营任务更新为已完成'); setLeadPackage(undefined); }}>
      <Form layout='vertical'>
        <Form.Item label='姓名' required><Input /></Form.Item>
        <Form.Item label='手机' required><Input /></Form.Item>
        <Form.Item label='微信'><Input /></Form.Item>
        <Form.Item label='来源渠道'><Select options={['小红书','视频号','官网表单','抖音','朋友圈'].map(v => ({ value: v, label: v }))} /></Form.Item>
        <Form.Item label='意向国家'><Input /></Form.Item>
        <Form.Item label='意向专业'><Input /></Form.Item>
      </Form>
    </Modal>
  </>;
}
