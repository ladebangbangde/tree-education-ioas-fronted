import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Tabs, Tag, Upload, message } from 'antd';
import { InboxOutlined, PlusOutlined, RollbackOutlined, UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { DataTable, PageHeader } from '@/components';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { assetFiles, contentPackages, operatorProfiles } from '@/mock/mediaFlow';
import { useAuthStore } from '@/store/auth';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const statusColor: Record<string, string> = { pending_upload: 'default', uploading: 'processing', partial_completed: 'gold', completed: 'green', deleted: 'red' };
const statusText: Record<string, string> = { pending_upload: '待上传素材', uploading: '上传中', partial_completed: '部分完成', completed: '已完成', deleted: '已删除' };
const draftPackages: ContentPackage[] = [{ ...contentPackages[2], id: 'DRAFT20260508001', topicName: '香港传媒申请故事草稿', uploadStatus: 'pending_upload', createdAt: '2026-05-08 12:00' }];
const recyclePackages: ContentPackage[] = [{ ...contentPackages[1], id: 'RECYCLE20260507001', topicName: '已删除-澳洲护理专业就业解读素材', uploadStatus: 'deleted' }];

const fileMeta: Record<AssetFileType, { mimeType: string; defaultName: string }> = {
  script: { mimeType: 'application/octet-stream', defaultName: '新脚本文案.docx' },
  video: { mimeType: 'video/mp4', defaultName: '新视频素材.mp4' },
  image: { mimeType: 'image/jpeg', defaultName: '新图片素材.jpg' }
};

export default function ContentPackagesPage(){
  const role = useAuthStore(s => s.role);
  const [packages, setPackages] = useState(contentPackages);
  const [files, setFiles] = useState<AssetFile[]>(assetFiles);
  const [recycle, setRecycle] = useState(recyclePackages);
  const [detail, setDetail] = useState<ContentPackage>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const currentFiles = useMemo(() => files.filter(file => file.packageId === detail?.id), [detail, files]);
  const openUpload = (pkg?: ContentPackage) => { uploadForm.resetFields(); if (pkg) uploadForm.setFieldsValue({ packageId: pkg.id }); setUploadOpen(true); };
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
  const baseColumns = [
    { title: '封面', dataIndex: 'coverUrl', width: 110, render: (url: string) => <img src={url} className='cover-thumb' /> },
    { title: '主题名称', dataIndex: 'topicName' },
    { title: '绑定运营', dataIndex: 'operatorName' },
    { title: '自动路径', render: (_: unknown, r: ContentPackage) => `${r.folderPath.operatorName} / ${r.folderPath.year} / ${String(r.folderPath.month).padStart(2, '0')} / ${String(r.folderPath.day).padStart(2, '0')} / ${r.topicName}` },
    { title: '脚本/视频/图片', render: (_: unknown, r: ContentPackage) => `${r.scriptCount}/${r.videoCount}/${r.imageCount}` },
    { title: '状态', dataIndex: 'uploadStatus', render: (v: string) => <Tag color={statusColor[v]}>{statusText[v]}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt' }
  ];
  const activeColumns = [...baseColumns, { title: '操作', fixed: 'right' as const, render: (_: unknown, r: ContentPackage) => <Space>
    <Button type='link' onClick={() => setDetail(r)}>详情</Button>
    {canUseButton(role, 'editOwnContent') && <Button type='link' onClick={() => { setEditPackage(r); editForm.setFieldsValue({ topicName: r.topicName, operatorId: r.operatorId }); }}>编辑主题信息</Button>}
    {canUseButton(role, 'upload') && <Button type='link' onClick={() => openUpload(r)}>上传文件</Button>}
    {canUseButton(role, 'deleteOwnContent') && <Popconfirm title='确认删除并移入回收站？' onConfirm={() => { setPackages(prev => prev.filter(item => item.id !== r.id)); setRecycle(prev => [{ ...r, uploadStatus: 'deleted' }, ...prev]); }}><Button type='link' danger>删除</Button></Popconfirm>}
  </Space> }];
  const recycleColumns = [...baseColumns, { title: '操作', render: (_: unknown, r: ContentPackage) => <Space><Button type='link' onClick={() => setDetail(r)}>详情</Button>{canUseButton(role, 'restore') && <Button type='link' icon={<RollbackOutlined />} onClick={() => { setRecycle(prev => prev.filter(item => item.id !== r.id)); setPackages(prev => [{ ...r, uploadStatus: 'pending_upload' }, ...prev]); }}>恢复</Button>}</Space> }];
  return <>
    <PageHeader title='内容管理｜我的上传工作台' extra={<Space>{canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建主题包</Button>}{canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload()}>上传文件</Button>}</Space>} />
    <Row gutter={[16,16]} className='mb12'>
      <Col span={8}><Card><b>先建主题包</b><p>新建主题包只创建目录容器，填写运营人员和主题名称，路径由系统自动拼接。</p></Card></Col>
      <Col span={8}><Card><b>再上传文件</b><p>上传文件必须选择已有主题包，脚本、视频、图片会自动归入对应子目录。</p></Card></Col>
      <Col span={8}><Card><b>素材流转</b><p>主题包入库后进入公共媒体资源中心，运营只能消费素材生成线索。</p></Card></Col>
    </Row>
    <Tabs items={[
      { key: 'mine', label: `我的上传(${packages.length})`, children: <DataTable rowKey='id' columns={activeColumns} dataSource={packages} /> },
      { key: 'drafts', label: `草稿箱(${draftPackages.length})`, children: <DataTable rowKey='id' columns={activeColumns} dataSource={draftPackages} /> },
      { key: 'records', label: `上传记录(${packages.length + draftPackages.length})`, children: <DataTable rowKey='id' columns={baseColumns} dataSource={[...packages, ...draftPackages]} /> },
      { key: 'recycle', label: `回收站(${recycle.length})`, children: <DataTable rowKey='id' columns={recycleColumns} dataSource={recycle} /> }
    ]} />
    <ContentPackageDetailDrawer open={Boolean(detail)} onClose={() => setDetail(undefined)} item={detail} files={currentFiles} extraActions={detail && canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload(detail)}>上传文件</Button>} />
    <Modal open={createOpen} title='新建主题包' onCancel={() => setCreateOpen(false)} onOk={() => createForm.validateFields().then(createPackage)}>
      <Form form={createForm} layout='vertical'>
        <Form.Item name='operatorId' label='运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input placeholder='例如：英国硕士申请季短视频主题包' /></Form.Item>
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
  </>;
}
