import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Tabs, Tag, Upload, message } from 'antd';
import { InboxOutlined, PlusOutlined, RollbackOutlined, UploadOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UploadFile } from 'antd';
import { assetsApi } from '@/api/assets';
import { contentPackagesApi, type ContentPackageTab } from '@/api/contentPackages';
import { operatorsApi } from '@/api/operators';
import { inferUploadTaskFileType, uploadTasksApi, type UploadTaskFileType } from '@/api/uploadTasks';
import { DataTable, PageHeader } from '@/components';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { useAuthStore } from '@/store/auth';
import type { AssetFile, ContentPackage, OperatorProfile } from '@/types/mediaFlow';
import { adaptAssetFile, adaptContentPackage, adaptOperator } from '@/utils/adapters/mediaFlow';

const statusColor: Record<string, string> = { pending_upload: 'default', uploading: 'processing', partial_completed: 'gold', completed: 'green', deleted: 'red' };
const statusText: Record<string, string> = { pending_upload: '待上传素材', uploading: '上传中', partial_completed: '部分完成', completed: '已完成', deleted: '已删除' };
const tabMap: Record<string, ContentPackageTab> = { mine: 'mine', drafts: 'draft', records: 'record', recycle: 'recycle' };

type UploadField = 'script' | 'video' | 'image';

const fieldDefaultFileType: Record<UploadField, UploadTaskFileType> = {
  script: 'script',
  video: 'video',
  image: 'image'
};

const normalizeUploadFileList = (event: UploadFile[] | { fileList?: UploadFile[] }) => {
  if (Array.isArray(event)) return event;
  return event?.fileList || [];
};

const collectUploadFiles = (value?: UploadFile[] | { fileList?: UploadFile[] }, fallbackType?: UploadTaskFileType) => {
  const files = normalizeUploadFileList(value || []);
  return files
    .map(file => file.originFileObj as File | undefined)
    .filter((file): file is File => Boolean(file))
    .map(file => ({ file, fileType: inferUploadTaskFileType(file, fallbackType) }));
};

export default function ContentPackagesPage(){
  const role = useAuthStore(s => s.role);
  const [activeTab, setActiveTab] = useState('mine');
  const [packages, setPackages] = useState<ContentPackage[]>([]);
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [recycleFiles, setRecycleFiles] = useState<AssetFile[]>([]);
  const [operators, setOperators] = useState<OperatorProfile[]>([]);
  const [detail, setDetail] = useState<ContentPackage>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadOperators = useCallback(async () => {
    const data = await operatorsApi.options();
    setOperators((data || []).map(adaptOperator));
  }, []);

  const loadList = useCallback(async (tab = activeTab) => {
    setLoading(true);
    try {
      if (tab === 'recycle') {
        const page = await assetsApi.recycleBin({ pageNum: 1, pageSize: 200 });
        setRecycleFiles(page.records.map(adaptAssetFile));
        return;
      }
      const page = await contentPackagesApi.list({ tab: tabMap[tab], pageNum: 1, pageSize: 200 });
      const nextPackages = page.records.map(adaptContentPackage);
      setPackages(nextPackages);
      const assetsPage = await assetsApi.list({ fileType: 'all', pageNum: 1, pageSize: 1000 });
      setFiles(assetsPage.records.map(adaptAssetFile));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadOperators().catch(() => undefined); }, [loadOperators]);
  useEffect(() => { loadList(activeTab).catch(() => undefined); }, [activeTab, loadList]);

  const detailPackage = useMemo(() => packages.find(pkg => pkg.id === detail?.id) || detail, [detail, packages]);
  const currentFiles = useMemo(() => files.filter(file => file.packageId === detailPackage?.id), [detailPackage, files]);
  const openUpload = (pkg?: ContentPackage) => { uploadForm.resetFields(); if (pkg) uploadForm.setFieldsValue({ packageId: pkg.id }); setUploadOpen(true); };

  const openDetail = async (pkg: ContentPackage) => {
    setDetail(pkg);
    try {
      const dto = await contentPackagesApi.detail(pkg.id);
      setDetail(adaptContentPackage(dto));
      const page = await assetsApi.list({ packageId: pkg.id, fileType: 'all', pageNum: 1, pageSize: 500 });
      setFiles(prev => [...prev.filter(file => file.packageId !== pkg.id), ...page.records.map(adaptAssetFile)]);
    } catch {
      message.error('主题包详情加载失败');
      setDetail(undefined);
    }
  };

  const createPackage = async (values: { operatorId: string; topicName: string }) => {
    setSubmitLoading(true);
    try {
      await contentPackagesApi.create(values);
      message.success('主题包已创建');
      setCreateOpen(false); createForm.resetFields(); loadList(activeTab);
    } finally { setSubmitLoading(false); }
  };

  const updatePackage = async (values: { operatorId: string; topicName: string }) => {
    if (!editPackage) return;
    setSubmitLoading(true);
    try {
      await contentPackagesApi.update(editPackage.id, values);
      message.success('主题信息已更新');
      setEditPackage(undefined); loadList(activeTab);
    } finally { setSubmitLoading(false); }
  };

  const uploadSingleFileByTask = async (packageId: string, file: File, fileType: UploadTaskFileType) => {
    const task = await uploadTasksApi.create({
      packageId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      fileType
    });
    return uploadTasksApi.uploadFile(task.taskId, file, fileType);
  };

  const uploadFilesToPackage = async (values: any) => {
    const packageId = String(values.packageId || '');
    const uploadItems = [
      ...collectUploadFiles(values.script, fieldDefaultFileType.script),
      ...collectUploadFiles(values.video, fieldDefaultFileType.video),
      ...collectUploadFiles(values.image, fieldDefaultFileType.image)
    ];

    if (!packageId) { message.warning('请先选择主题包'); return; }
    if (uploadItems.length === 0) { message.warning('请至少上传一类素材文件'); return; }

    setSubmitLoading(true);
    const hide = message.loading(`正在创建上传任务并上传 ${uploadItems.length} 个文件...`, 0);
    try {
      for (const item of uploadItems) {
        await uploadSingleFileByTask(packageId, item.file, item.fileType);
      }
      hide();
      message.success('文件上传任务已完成');
      setUploadOpen(false); uploadForm.resetFields(); await loadList(activeTab);
      const currentDetail = detailPackage;
      if (currentDetail && currentDetail.id === values.packageId) openDetail(currentDetail);
    } catch (error) {
      hide();
      message.error('部分文件上传失败，请到任务中心查看失败原因');
      throw error;
    } finally { setSubmitLoading(false); }
  };

  const deleteFileFromPackage = async (file: AssetFile) => {
    await assetsApi.remove(file.id);
    message.success('文件已删除');
    await loadList(activeTab);
    if (detailPackage) openDetail(detailPackage);
  };
  const deletePackageWithFiles = async (pkg: ContentPackage) => {
    await contentPackagesApi.remove(pkg.id);
    message.success('已删除主题包及其全部文件');
    if (detail?.id === pkg.id) setDetail(undefined);
    loadList(activeTab);
  };

  const baseColumns = [
    { title: '封面', dataIndex: 'coverUrl', width: 110, render: (url: string) => url ? <img src={url} className='cover-thumb' /> : '-' },
    { title: '主题名称', dataIndex: 'topicName' },
    { title: '绑定运营', dataIndex: 'operatorName' },
    { title: '自动路径', render: (_: unknown, r: ContentPackage) => `${r.folderPath.operatorName} / ${r.folderPath.year} / ${String(r.folderPath.month).padStart(2, '0')} / ${String(r.folderPath.day).padStart(2, '0')} / ${r.topicName}` },
    { title: '脚本/视频/图片', render: (_: unknown, r: ContentPackage) => `${r.scriptCount}/${r.videoCount}/${r.imageCount}` },
    { title: '状态', dataIndex: 'uploadStatus', render: (v: string) => <Tag color={statusColor[v]}>{statusText[v] || v}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt' }
  ];
  const activeColumns = [...baseColumns, { title: '操作', fixed: 'right' as const, render: (_: unknown, r: ContentPackage) => <Space>
    <Button type='link' onClick={() => openDetail(r)}>详情</Button>
    {canUseButton(role, 'editOwnContent') && <Button type='link' onClick={() => { setEditPackage(r); editForm.setFieldsValue({ topicName: r.topicName, operatorId: r.operatorId }); }}>编辑主题信息</Button>}
    {canUseButton(role, 'upload') && <Button type='link' onClick={() => openUpload(r)}>上传文件</Button>}
    {canUseButton(role, 'deleteOwnContent') && <Popconfirm title='删除主题包后，将同时移除该主题包下全部文件，是否继续？' onConfirm={() => deletePackageWithFiles(r)}><Button type='link' danger>删除主题包</Button></Popconfirm>}
  </Space> }];
  const recycleColumns = [
    { title: '文件名', dataIndex: 'fileName' }, { title: '文件类型', dataIndex: 'fileType' }, { title: '大小', dataIndex: 'fileSize' }, { title: '所属主题包', dataIndex: 'packageId' },
    { title: '操作', render: (_: unknown, r: AssetFile) => <Space>{canUseButton(role, 'restore') && <Button type='link' icon={<RollbackOutlined />} onClick={async () => { await assetsApi.restore(r.id); message.success('文件已恢复'); loadList('recycle'); }}>恢复</Button>}<Popconfirm title='永久删除后不可恢复，是否继续？' onConfirm={async () => { await assetsApi.purge(r.id); message.success('已永久删除'); loadList('recycle'); }}><Button type='link' danger>永久删除</Button></Popconfirm></Space> }
  ];

  return <>
    <PageHeader title='内容管理｜我的上传工作台' extra={<Space className='resource-toolbar' size={12}>{canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建主题包</Button>}{canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload()}>上传文件</Button>}</Space>} />
    <Row gutter={[16,16]} className='mb12'><Col span={8}><Card><b>先建主题包</b><p>路径由系统自动拼接。</p></Card></Col><Col span={8}><Card><b>再上传文件</b><p>脚本、视频、图片归入对应子目录。</p></Card></Col><Col span={8}><Card><b>素材流转</b><p>主题包入库后进入公共媒体资源中心。</p></Card></Col></Row>
    <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
      { key: 'mine', label: '我的上传', children: <DataTable loading={loading} rowKey='id' columns={activeColumns} dataSource={packages} /> },
      { key: 'drafts', label: '草稿箱', children: <DataTable loading={loading} rowKey='id' columns={activeColumns} dataSource={packages} /> },
      { key: 'records', label: '上传记录', children: <DataTable loading={loading} rowKey='id' columns={baseColumns} dataSource={packages} /> },
      { key: 'recycle', label: '回收站', children: <DataTable loading={loading} rowKey='id' columns={recycleColumns} dataSource={recycleFiles} /> }
    ]} />
    <ContentPackageDetailDrawer open={Boolean(detailPackage)} onClose={() => setDetail(undefined)} item={detailPackage} files={currentFiles} extraActions={detailPackage && canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload(detailPackage)}>上传文件</Button>} canDeleteFile={canUseButton(role, 'deleteOwnContent')} onDeleteFile={deleteFileFromPackage} />
    <Modal open={createOpen} title='新建主题包' onCancel={() => setCreateOpen(false)} onOk={() => createForm.validateFields().then(createPackage)} confirmLoading={submitLoading}><Form form={createForm} layout='vertical'><Form.Item name='operatorId' label='运营人员' rules={[{ required: true }]}><Select options={operators.map(op => ({ value: op.id, label: op.name }))} /></Form.Item><Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input placeholder='例如：英国硕士申请季短视频主题包' /></Form.Item></Form></Modal>
    <Modal open={uploadOpen} title='上传文件到主题包' onCancel={() => setUploadOpen(false)} onOk={() => uploadForm.validateFields().then(uploadFilesToPackage)} confirmLoading={submitLoading} width={760}><Form form={uploadForm} layout='vertical'><Form.Item name='packageId' label='选择主题包' rules={[{ required: true, message: '请先选择已有主题包' }]}><Select showSearch optionFilterProp='label' options={packages.map(pkg => ({ value: pkg.id, label: `${pkg.operatorName} / ${pkg.folderPath.year} / ${String(pkg.folderPath.month).padStart(2, '0')} / ${String(pkg.folderPath.day).padStart(2, '0')} / ${pkg.topicName}` }))} /></Form.Item><Form.Item name='script' label='上传脚本' valuePropName='fileList' getValueFromEvent={normalizeUploadFileList}><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>脚本文件将创建上传任务并归入 / 脚本</p></Upload.Dragger></Form.Item><Form.Item name='video' label='上传视频' valuePropName='fileList' getValueFromEvent={normalizeUploadFileList}><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>视频文件将创建上传任务并归入 / 视频</p></Upload.Dragger></Form.Item><Form.Item name='image' label='上传图片' valuePropName='fileList' getValueFromEvent={normalizeUploadFileList}><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>图片文件将创建上传任务并归入 / 图片</p></Upload.Dragger></Form.Item></Form></Modal>
    <Modal open={Boolean(editPackage)} title='编辑主题信息' onCancel={() => setEditPackage(undefined)} onOk={() => editForm.validateFields().then(updatePackage)} confirmLoading={submitLoading}><Form form={editForm} layout='vertical'><Form.Item name='operatorId' label='绑定运营人员' rules={[{ required: true }]}><Select options={operators.map(op => ({ value: op.id, label: op.name }))} /></Form.Item><Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
  </>;
}
