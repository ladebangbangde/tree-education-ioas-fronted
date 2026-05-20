import { Button, Form, Input, Modal, Select, Space, Upload, message } from 'antd';
import { DownloadOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { assetsApi } from '@/api/assets';
import { contentPackagesApi } from '@/api/contentPackages';
import { leadsApi } from '@/api/leads';
import { operatorsApi } from '@/api/operators';
import { resourcesApi } from '@/api/resources';
import { inferUploadTaskFileType, uploadTasksApi, type UploadTaskFileType } from '@/api/uploadTasks';
import { PageHeader } from '@/components';
import AssetFolderBrowser from '@/components/mediaFlow/AssetFolderBrowser';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';
import type { AssetFile, ContentPackage, OperatorProfile } from '@/types/mediaFlow';
import { adaptAssetFile, adaptContentPackage, adaptOperator } from '@/utils/adapters/mediaFlow';

const normalizeUploadFileList = (event: UploadFile[] | { fileList?: UploadFile[] }) => Array.isArray(event) ? event : event?.fileList || [];
const collectUploadFiles = (value: UploadFile[] | { fileList?: UploadFile[] } | undefined, fallbackType: UploadTaskFileType) => normalizeUploadFileList(value || [])
  .map(file => file.originFileObj as File | undefined)
  .filter((file): file is File => Boolean(file))
  .map(file => ({ file, fileType: inferUploadTaskFileType(file, fallbackType) }));

export default function MediaResourceCenterPage(){
  const navigate = useNavigate();
  const role = useAuthStore(s => s.role);
  const [packages, setPackages] = useState<ContentPackage[]>([]);
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [operators, setOperators] = useState<OperatorProfile[]>([]);
  const [detail, setDetail] = useState<ContentPackage>();
  const [leadPackage, setLeadPackage] = useState<ContentPackage>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [operatorId, setOperatorId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [leadForm] = Form.useForm();

  const loadOperators = useCallback(async () => {
    const data = await operatorsApi.options();
    setOperators((data || []).map(adaptOperator));
  }, []);
  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      await resourcesApi.tree().catch(() => []);
      const page = await resourcesApi.packages({ keyword: query || undefined, operatorId, pageNum: 1, pageSize: 200 });
      const nextPackages = page.records.map(adaptContentPackage);
      setPackages(nextPackages);
      const assetsPage = await assetsApi.list({ fileType: 'all', pageNum: 1, pageSize: 1000 });
      setFiles(assetsPage.records.map(adaptAssetFile));
    } finally { setLoading(false); }
  }, [operatorId, query]);
  useEffect(() => { loadOperators().catch(() => undefined); }, [loadOperators]);
  useEffect(() => { loadResources().catch(() => undefined); }, [loadResources]);

  const detailPackage = useMemo(() => packages.find(pkg => pkg.id === detail?.id) || detail, [detail, packages]);
  const detailFiles = useMemo(() => files.filter(file => file.packageId === detailPackage?.id), [detailPackage, files]);
  const permissions = { canPreview: canUseButton(role, 'preview'), canDownload: canUseButton(role, 'download'), canEdit: canUseButton(role, 'editOwnContent'), canDelete: canUseButton(role, 'deleteOwnContent'), canGenerateLead: canUseButton(role, 'generateLead'), canUpload: canUseButton(role, 'upload') };
  const openUpload = (pkg?: ContentPackage) => { uploadForm.resetFields(); if (pkg) uploadForm.setFieldsValue({ packageId: pkg.id }); setUploadOpen(true); };

  const openDetail = async (pkg: ContentPackage) => {
    setDetail(pkg);
    try {
      const dto = await contentPackagesApi.detail(pkg.id);
      setDetail(adaptContentPackage(dto));
      const page = await assetsApi.list({ packageId: pkg.id, fileType: 'all', pageNum: 1, pageSize: 500 });
      setFiles(prev => [...prev.filter(file => file.packageId !== pkg.id), ...page.records.map(adaptAssetFile)]);
    } catch { message.error('主题包详情加载失败'); setDetail(undefined); }
  };

  const handleDownload = async (file: AssetFile) => {
    const res = await assetsApi.download(file.id);
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = file.fileName || `asset-${file.id}`; link.click(); window.URL.revokeObjectURL(url);
  };
  const handlePreview = async (file: AssetFile) => {
    if (file.fileType === 'image' || file.fileType === 'video') {
      const res = await assetsApi.download(file.id);
      const blob = new Blob([res.data], { type: file.mimeType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      return;
    }
    const data = await assetsApi.preview(file.id);
    const url = typeof data === 'string' ? data : data?.url || data?.previewUrl || file.previewUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer'); else message.info('后端未返回可预览地址');
  };

  const createPackage = async (values: { operatorId: string; topicName: string }) => {
    setSubmitLoading(true); try { await contentPackagesApi.create(values); message.success('主题包已创建'); setCreateOpen(false); createForm.resetFields(); loadResources(); } finally { setSubmitLoading(false); }
  };
  const updatePackage = async (values: { operatorId: string; topicName: string }) => {
    if (!editPackage) return; setSubmitLoading(true); try { await contentPackagesApi.update(editPackage.id, values); message.success('主题信息已更新'); setEditPackage(undefined); loadResources(); } finally { setSubmitLoading(false); }
  };
  const deletePackageWithFiles = async (pkg: ContentPackage) => { await contentPackagesApi.remove(pkg.id); message.success('已删除主题包及其全部文件'); if (detail?.id === pkg.id) setDetail(undefined); loadResources(); };
  const deleteFileFromPackage = async (file: AssetFile) => { await assetsApi.remove(file.id); message.success('文件已删除'); loadResources(); if (detailPackage) openDetail(detailPackage); };

  const uploadOneInBackground = async (packageId: string, file: File, fileType: UploadTaskFileType) => {
    const task = await uploadTasksApi.create({ packageId, fileName: file.name, fileSize: file.size, mimeType: file.type || 'application/octet-stream', fileType });
    try {
      await uploadTasksApi.uploadFile(task.taskId, file, fileType);
    } catch (error: any) {
      await uploadTasksApi.fail(task.taskId, error?.message || '上传失败').catch(() => undefined);
    }
  };

  const uploadFilesToPackage = async (values: any) => {
    const packageId = String(values.packageId || '');
    const uploadItems = [
      ...collectUploadFiles(values.script, 'script'),
      ...collectUploadFiles(values.video, 'video'),
      ...collectUploadFiles(values.image, 'image')
    ];
    if (!packageId) { message.warning('请先选择主题包'); return; }
    if (uploadItems.length === 0) { message.warning('请至少上传一类素材文件'); return; }

    setUploadOpen(false);
    uploadForm.resetFields();
    message.success(`已创建 ${uploadItems.length} 个上传任务，请到任务中心跟踪进度`);
    navigate('/tasks');
    uploadItems.forEach(item => {
      uploadOneInBackground(packageId, item.file, item.fileType).finally(() => loadResources().catch(() => undefined));
    });
  };

  const createLead = async (values: any) => {
    if (!leadPackage) return;
    setSubmitLoading(true);
    try {
      await leadsApi.create({ ...values, sourceType: 'content_package', relatedPackageId: leadPackage.id, operatorId: leadPackage.operatorId });
      message.success('线索已创建'); setLeadPackage(undefined); leadForm.resetFields(); loadResources();
    } finally { setSubmitLoading(false); }
  };

  return <>
    <PageHeader title='媒体资源中心' extra={<Space className='resource-toolbar' size={12}><Input.Search allowClear placeholder='搜索主题 / 运营' onSearch={setQuery} style={{ width: 240 }} /><Select allowClear placeholder='筛选运营' value={operatorId} onChange={setOperatorId} style={{ width: 180 }} options={operators.map(op => ({ value: op.id, label: op.name }))} />{canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload()}>上传文件</Button>}{canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建主题包</Button>}</Space>} />
    <div aria-busy={loading}><AssetFolderBrowser packages={packages} files={files} permissions={permissions} onView={openDetail} onPreview={handlePreview} onDownload={handleDownload} onEdit={pkg => { setEditPackage(pkg); editForm.setFieldsValue({ topicName: pkg.topicName, operatorId: pkg.operatorId }); }} onUpload={openUpload} onDelete={deletePackageWithFiles} onDeleteFile={deleteFileFromPackage} onGenerateLead={setLeadPackage} /></div>
    <ContentPackageDetailDrawer open={Boolean(detailPackage)} onClose={() => setDetail(undefined)} item={detailPackage} files={detailFiles} extraActions={detailPackage && <>{canUseButton(role, 'download') && detailFiles[0] && <Button icon={<DownloadOutlined />} onClick={() => handleDownload(detailFiles[0])}>下载首个素材</Button>}{canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload(detailPackage)}>上传文件</Button>}{canUseButton(role, 'editOwnContent') && <Button onClick={() => { setEditPackage(detailPackage); editForm.setFieldsValue({ topicName: detailPackage.topicName, operatorId: detailPackage.operatorId }); }}>编辑主题</Button>}{canUseButton(role, 'generateLead') && <Button type='primary' onClick={() => setLeadPackage(detailPackage)}>基于素材生成线索</Button>}</>} canDeleteFile={canUseButton(role, 'deleteOwnContent')} onDeleteFile={deleteFileFromPackage} />
    <Modal open={createOpen} title='新建主题包' onCancel={() => setCreateOpen(false)} onOk={() => createForm.validateFields().then(createPackage)} confirmLoading={submitLoading}><Form form={createForm} layout='vertical'><Form.Item name='operatorId' label='运营人员' rules={[{ required: true }]}><Select options={operators.map(op => ({ value: op.id, label: op.name }))} /></Form.Item><Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
    <Modal open={uploadOpen} title='提交异步上传任务' onCancel={() => setUploadOpen(false)} onOk={() => uploadForm.validateFields().then(uploadFilesToPackage)} width={760}><Form form={uploadForm} layout='vertical'><Form.Item name='packageId' label='选择主题包' rules={[{ required: true, message: '请先选择已有主题包' }]}><Select showSearch optionFilterProp='label' options={packages.map(pkg => ({ value: pkg.id, label: `${pkg.operatorName} / ${pkg.folderPath.year} / ${String(pkg.folderPath.month).padStart(2, '0')} / ${String(pkg.folderPath.day).padStart(2, '0')} / ${pkg.topicName}` }))} /></Form.Item><Form.Item name='script' label='上传脚本' valuePropName='fileList' getValueFromEvent={normalizeUploadFileList}><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>提交后进入任务中心跟踪 / 脚本</p></Upload.Dragger></Form.Item><Form.Item name='video' label='上传视频' valuePropName='fileList' getValueFromEvent={normalizeUploadFileList}><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>提交后进入任务中心跟踪 / 视频</p></Upload.Dragger></Form.Item><Form.Item name='image' label='上传图片' valuePropName='fileList' getValueFromEvent={normalizeUploadFileList}><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>提交后进入任务中心跟踪 / 图片</p></Upload.Dragger></Form.Item></Form></Modal>
    <Modal open={Boolean(editPackage)} title='编辑主题信息' onCancel={() => setEditPackage(undefined)} onOk={() => editForm.validateFields().then(updatePackage)} confirmLoading={submitLoading}><Form form={editForm} layout='vertical'><Form.Item name='operatorId' label='绑定运营人员' rules={[{ required: true }]}><Select options={operators.map(op => ({ value: op.id, label: op.name }))} /></Form.Item><Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
    <Modal open={Boolean(leadPackage)} title={`基于素材生成线索：${leadPackage?.topicName || ''}`} onCancel={() => setLeadPackage(undefined)} onOk={() => leadForm.validateFields().then(createLead)} confirmLoading={submitLoading}><Form form={leadForm} layout='vertical'><Form.Item name='studentName' label='姓名' rules={[{ required: true }]}><Input /></Form.Item><Form.Item name='phone' label='手机' rules={[{ required: true }]}><Input /></Form.Item><Form.Item name='wechat' label='微信'><Input /></Form.Item><Form.Item name='sourceChannel' label='来源渠道'><Select options={['小红书','视频号','官网表单','抖音','朋友圈'].map(v => ({ value: v, label: v }))} /></Form.Item><Form.Item name='targetCountry' label='意向国家'><Input /></Form.Item><Form.Item name='targetMajor' label='意向专业'><Input /></Form.Item></Form></Modal>
  </>;
}
