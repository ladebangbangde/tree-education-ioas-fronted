import { Button, Form, Input, Modal, Select, Space, Upload, message } from 'antd';
import { DownloadOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import AssetFolderBrowser from '@/components/mediaFlow/AssetFolderBrowser';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { assetFiles, contentPackages, operatorProfiles } from '@/mock/mediaFlow';
import { useAuthStore } from '@/store/auth';
import type { AssetFile, ContentPackage } from '@/types/mediaFlow';

export default function MediaResourceCenterPage(){
  const role = useAuthStore(s => s.role);
  const isMedia = role === 'MEDIA';
  const [packages, setPackages] = useState(contentPackages);
  const [detail, setDetail] = useState<ContentPackage>();
  const [leadPackage, setLeadPackage] = useState<ContentPackage>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [operatorId, setOperatorId] = useState<string>();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const detailFiles = useMemo(() => assetFiles.filter(file => file.packageId === detail?.id), [detail]);
  const filteredPackages = packages.filter(pkg => (!query || pkg.topicName.includes(query) || pkg.operatorName.includes(query)) && (!operatorId || pkg.operatorId === operatorId));
  const permissions = {
    canPreview: canUseButton(role, 'preview'),
    canDownload: canUseButton(role, 'download'),
    canEdit: canUseButton(role, 'editOwnContent'),
    canDelete: canUseButton(role, 'deleteOwnContent'),
    canGenerateLead: canUseButton(role, 'generateLead')
  };
  const handleDownload = (file: AssetFile) => message.success(`已开始下载：${file.fileName}`);
  const handlePreview = (file: AssetFile) => message.info(`${file.fileType === 'video' ? '播放' : '预览'}：${file.fileName}`);
  const handleCreatePackage = (values: any) => {
    const op = operatorProfiles.find(item => item.id === values.operatorId)!;
    const next: ContentPackage = { id: `PKG${Date.now()}`, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { operatorId: op.id, operatorName: op.name, year: 2026, month: 5, day: 8, topicName: values.topicName }, coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=480&q=80', scriptCount: values.scripts?.fileList?.length || 0, videoCount: values.videos?.fileList?.length || 0, imageCount: values.images?.fileList?.length || 0, uploadStatus: 'uploading', createdBy: '媒体账号-王悦', createdAt: '2026-05-08 10:00' };
    setPackages(prev => [next, ...prev]);
    setUploadOpen(false);
    form.resetFields();
    message.success('已创建内容主题包并生成上传任务');
  };
  return <>
    <PageHeader title='媒体资源中心' extra={<Space>
      <Input.Search allowClear placeholder='搜索主题 / 运营' onSearch={setQuery} style={{ width: 240 }} />
      <Select allowClear placeholder='筛选运营' value={operatorId} onChange={setOperatorId} style={{ width: 180 }} options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} />
      {canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>上传文件</Button>}
      {canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>新建主题包</Button>}
    </Space>} />
    <AssetFolderBrowser
      packages={filteredPackages}
      files={assetFiles}
      permissions={permissions}
      onView={setDetail}
      onPreview={handlePreview}
      onDownload={handleDownload}
      onEdit={pkg => { setEditPackage(pkg); editForm.setFieldsValue({ topicName: pkg.topicName, operatorId: pkg.operatorId }); }}
      onDelete={pkg => { setPackages(prev => prev.filter(item => item.id !== pkg.id)); message.success('已删除主题包'); }}
      onGenerateLead={setLeadPackage}
    />
    <ContentPackageDetailDrawer open={Boolean(detail)} onClose={() => setDetail(undefined)} item={detail} files={detailFiles} extraActions={detail && <>
      {canUseButton(role, 'download') && <Button icon={<DownloadOutlined />} onClick={() => message.success(`已打包下载：${detail.topicName}`)}>下载素材包</Button>}
      {canUseButton(role, 'editOwnContent') && <Button onClick={() => { setEditPackage(detail); editForm.setFieldsValue({ topicName: detail.topicName, operatorId: detail.operatorId }); }}>编辑主题</Button>}
      {canUseButton(role, 'generateLead') && <Button type='primary' onClick={() => setLeadPackage(detail)}>基于素材生成线索</Button>}
    </>} />
    <Modal open={uploadOpen} title='上传文件 / 新建内容主题包' onCancel={() => setUploadOpen(false)} onOk={() => form.validateFields().then(handleCreatePackage)} width={760}>
      <Form form={form} layout='vertical'>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name='operatorId' label='绑定运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
        <Form.Item name='scripts' label='脚本文案'><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>上传脚本文案</p></Upload.Dragger></Form.Item>
        <Form.Item name='videos' label='视频文件'><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>上传视频</p></Upload.Dragger></Form.Item>
        <Form.Item name='images' label='图片文件'><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>上传图片</p></Upload.Dragger></Form.Item>
      </Form>
    </Modal>
    <Modal open={Boolean(editPackage)} title='编辑主题信息' onCancel={() => setEditPackage(undefined)} onOk={() => editForm.validateFields().then(values => {
      const op = operatorProfiles.find(item => item.id === values.operatorId)!;
      setPackages(prev => prev.map(pkg => pkg.id === editPackage?.id ? { ...pkg, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { ...pkg.folderPath, operatorId: op.id, operatorName: op.name, topicName: values.topicName } } : pkg));
      setEditPackage(undefined); message.success('主题信息已更新');
    })}>
      <Form form={editForm} layout='vertical'>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name='operatorId' label='绑定运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
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
