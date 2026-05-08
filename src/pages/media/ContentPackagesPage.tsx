import { Button, Card, Col, DatePicker, Descriptions, Form, Input, Modal, Popconfirm, Row, Select, Space, Tabs, Tag, Upload, message } from 'antd';
import { InboxOutlined, PlusOutlined, RollbackOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { DataTable, PageHeader } from '@/components';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { assetFiles, contentPackages, operatorProfiles } from '@/mock/mediaFlow';
import { useAuthStore } from '@/store/auth';
import type { AssetFile, AssetFileType, ContentPackage } from '@/types/mediaFlow';

const { RangePicker } = DatePicker;
const now = dayjs('2026-05-08 10:00');
const statusColor: Record<string, string> = { pending_upload: 'default', uploading: 'processing', partial_completed: 'gold', completed: 'green', deleted: 'red' };
const statusText: Record<string, string> = { pending_upload: '待上传素材', uploading: '上传中', partial_completed: '部分完成', completed: '已完成', deleted: '已删除' };
const fileTypeText: Record<AssetFileType, string> = { script: '脚本', video: '视频', image: '图片' };
const draftPackages: ContentPackage[] = [{ ...contentPackages[2], id: 'DRAFT20260508001', topicName: '香港传媒申请故事草稿', uploadStatus: 'pending_upload', createdAt: '2026-05-08 12:00' }];
const recyclePackages: ContentPackage[] = [{ ...contentPackages[1], id: 'RECYCLE20260507001', topicName: '已删除-澳洲护理专业就业解读素材', uploadStatus: 'deleted' }];
const fileMeta: Record<AssetFileType, { mimeType: string; defaultName: string }> = {
  script: { mimeType: 'application/octet-stream', defaultName: '新脚本文案.docx' },
  video: { mimeType: 'video/mp4', defaultName: '新视频素材.mp4' },
  image: { mimeType: 'image/jpeg', defaultName: '新图片素材.jpg' }
};

const pathOf = (pkg: ContentPackage, type?: AssetFileType) => `${pkg.folderPath.operatorName} / ${pkg.folderPath.year} / ${String(pkg.folderPath.month).padStart(2, '0')} / ${String(pkg.folderPath.day).padStart(2, '0')} / ${pkg.topicName}${type ? ` / ${fileTypeText[type]}` : ''}`;
const remainingHoursOf = (file: AssetFile) => Math.max(0, dayjs(file.purgeAt).diff(now, 'hour'));
const remainingText = (file: AssetFile) => {
  const hours = remainingHoursOf(file);
  if (hours <= 0) return '即将清理';
  if (hours < 24) return `${hours}小时`;
  return `${Math.floor(hours / 24)}天${hours % 24}小时`;
};
const remainingColor = (file: AssetFile) => {
  const hours = remainingHoursOf(file);
  if (hours <= 24) return 'red';
  if (hours <= 72) return 'orange';
  return 'default';
};

export default function ContentPackagesPage(){
  const { role, userName } = useAuthStore();
  const [packages, setPackages] = useState(contentPackages);
  const [files, setFiles] = useState<AssetFile[]>(assetFiles);
  const [fileRecycle, setFileRecycle] = useState<AssetFile[]>([]);
  const [selectedRecycleIds, setSelectedRecycleIds] = useState<React.Key[]>([]);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);
  const [recycle, setRecycle] = useState(recyclePackages);
  const [detail, setDetail] = useState<ContentPackage>();
  const [fileDetail, setFileDetail] = useState<AssetFile>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileKeyword, setFileKeyword] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<AssetFileType>();
  const [deletedByFilter, setDeletedByFilter] = useState<string>();
  const [deleteRange, setDeleteRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [packageFilter, setPackageFilter] = useState<string>();
  const [operatorFilter, setOperatorFilter] = useState<string>();
  const [retentionFilter, setRetentionFilter] = useState<string>();
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const detailPackage = useMemo(() => packages.find(pkg => pkg.id === detail?.id) || recycle.find(pkg => pkg.id === detail?.id), [detail, packages, recycle]);
  const currentFiles = useMemo(() => files.filter(file => file.packageId === detailPackage?.id), [detailPackage, files]);
  const canPermanentDelete = role === 'SUPER_ADMIN';
  const soonCleanCount = fileRecycle.filter(file => remainingHoursOf(file) <= 24).length;
  const logOperation = (action: string, fileName: string) => setOperationLogs(prev => [`${now.format('YYYY-MM-DD HH:mm')} ${userName} ${action}：${fileName}`, ...prev].slice(0, 20));
  const openUpload = (pkg?: ContentPackage) => { uploadForm.resetFields(); if (pkg) uploadForm.setFieldsValue({ packageId: pkg.id }); setUploadOpen(true); };
  const createPackage = (values: { operatorId: string; topicName: string }) => {
    const op = operatorProfiles.find(item => item.id === values.operatorId)!;
    const next: ContentPackage = { id: `PKG${Date.now()}`, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { operatorId: op.id, operatorName: op.name, year: 2026, month: 5, day: 8, topicName: values.topicName }, coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=480&q=80', scriptCount: 0, videoCount: 0, imageCount: 0, uploadStatus: 'pending_upload', createdBy: '媒体账号-王悦', createdAt: '2026-05-08 10:00' };
    setPackages(prev => [next, ...prev]); setCreateOpen(false); createForm.resetFields(); message.success(`已创建主题包：${pathOf(next)}`);
  };
  const buildFiles = (packageId: string, values: any) => (['script', 'video', 'image'] as AssetFileType[]).flatMap(type => (values[type]?.fileList || []).map((file: any, index: number) => ({ id: `AST${Date.now()}${type}${index}`, packageId, fileName: file.name || fileMeta[type].defaultName, fileType: type, mimeType: file.type || fileMeta[type].mimeType, fileSize: file.size || 0, uploadStatus: 'success' as const, sortOrder: files.filter(item => item.packageId === packageId && item.fileType === type).length + index + 1 })));
  const syncPackageCounts = (packageId: string, nextFiles: AssetFile[]) => {
    const packageFiles = nextFiles.filter(file => file.packageId === packageId);
    setPackages(prev => prev.map(pkg => pkg.id === packageId ? { ...pkg, scriptCount: packageFiles.filter(file => file.fileType === 'script').length, videoCount: packageFiles.filter(file => file.fileType === 'video').length, imageCount: packageFiles.filter(file => file.fileType === 'image').length, uploadStatus: packageFiles.length ? 'completed' : 'pending_upload' } : pkg));
  };
  const moveFileToRecycle = (file: AssetFile) => {
    const pkg = packages.find(item => item.id === file.packageId);
    const deletedAt = now.format('YYYY-MM-DD HH:mm');
    const recycled: AssetFile = { ...file, isDeleted: true, deletedAt, deletedBy: userName, purgeAt: now.add(7, 'day').format('YYYY-MM-DD HH:mm'), originalPath: pkg ? pathOf(pkg, file.fileType) : file.originalPath, referenceStatus: '未被线索引用' };
    const nextFiles = files.filter(item => item.id !== file.id);
    setFiles(nextFiles); setFileRecycle(prev => [recycled, ...prev]); syncPackageCounts(file.packageId, nextFiles); logOperation('移入文件回收站', file.fileName);
    message.success('文件已移入回收站，7 天内可恢复，7 天后服务器定时永久删除');
  };
  const restoreFiles = (ids: React.Key[]) => {
    const restoring = fileRecycle.filter(file => ids.includes(file.id));
    if (!restoring.length) return;
    const restored = restoring.map(file => ({ ...file, isDeleted: false, deletedAt: null, deletedBy: null, purgeAt: null }));
    const nextFiles = [...restored, ...files];
    setFiles(nextFiles); setFileRecycle(prev => prev.filter(file => !ids.includes(file.id))); restoring.forEach(file => { syncPackageCounts(file.packageId, nextFiles); logOperation('恢复文件', file.fileName); });
    setSelectedRecycleIds([]); message.success('已恢复文件到原主题包，文件数量已同步更新');
  };
  const purgeFiles = (ids: React.Key[]) => {
    const purging = fileRecycle.filter(file => ids.includes(file.id));
    setFileRecycle(prev => prev.filter(file => !ids.includes(file.id))); purging.forEach(file => logOperation('永久删除文件', file.fileName)); setSelectedRecycleIds([]); message.success('已永久删除文件，并记录操作日志');
  };
  const deletePackageWithFiles = (pkg: ContentPackage) => {
    setPackages(prev => prev.filter(item => item.id !== pkg.id)); setFiles(prev => prev.filter(file => file.packageId !== pkg.id)); setRecycle(prev => [{ ...pkg, scriptCount: 0, videoCount: 0, imageCount: 0, uploadStatus: 'deleted' }, ...prev]); if (detail?.id === pkg.id) setDetail(undefined); message.success('已删除主题包及其全部文件');
  };
  const uploadFilesToPackage = (values: any) => {
    const packageId = values.packageId as string;
    const nextFiles = buildFiles(packageId, values);
    if (!nextFiles.length) { message.warning('请至少上传一类素材文件'); return; }
    const nextAllFiles = [...nextFiles, ...files]; setFiles(nextAllFiles); syncPackageCounts(packageId, nextAllFiles); setUploadOpen(false); uploadForm.resetFields(); message.success('文件已上传到所选主题包，并按脚本/视频/图片自动归档');
  };
  const filteredRecycleFiles = fileRecycle.filter(file => {
    const pkg = packages.find(item => item.id === file.packageId) || contentPackages.find(item => item.id === file.packageId);
    const hours = remainingHoursOf(file);
    const matchRetention = !retentionFilter || (retentionFilter === 'over3' ? hours > 72 : retentionFilter === 'within3' ? hours <= 72 && hours > 24 : hours <= 24);
    const deletedAt = dayjs(file.deletedAt);
    return (!fileKeyword || file.fileName.includes(fileKeyword)) && (!fileTypeFilter || file.fileType === fileTypeFilter) && (!deletedByFilter || file.deletedBy === deletedByFilter) && (!deleteRange || (deletedAt.isAfter(deleteRange[0]) && deletedAt.isBefore(deleteRange[1]))) && (!packageFilter || file.packageId === packageFilter) && (!operatorFilter || pkg?.operatorId === operatorFilter) && matchRetention;
  });
  const baseColumns = [
    { title: '封面', dataIndex: 'coverUrl', width: 110, render: (url: string) => <img src={url} className='cover-thumb' /> },
    { title: '主题名称', dataIndex: 'topicName' },
    { title: '绑定运营', dataIndex: 'operatorName' },
    { title: '自动路径', render: (_: unknown, r: ContentPackage) => pathOf(r) },
    { title: '脚本/视频/图片', render: (_: unknown, r: ContentPackage) => `${r.scriptCount}/${r.videoCount}/${r.imageCount}` },
    { title: '状态', dataIndex: 'uploadStatus', render: (v: string) => <Tag color={statusColor[v]}>{statusText[v]}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt' }
  ];
  const activeColumns = [...baseColumns, { title: '操作', fixed: 'right' as const, render: (_: unknown, r: ContentPackage) => <Space><Button type='link' onClick={() => setDetail(r)}>详情</Button>{canUseButton(role, 'editOwnContent') && <Button type='link' onClick={() => { setEditPackage(r); editForm.setFieldsValue({ topicName: r.topicName, operatorId: r.operatorId }); }}>编辑主题信息</Button>}{canUseButton(role, 'upload') && <Button type='link' onClick={() => openUpload(r)}>上传文件</Button>}{canUseButton(role, 'deleteOwnContent') && <Popconfirm title='删除主题包后，将同时移除该主题包下全部脚本、视频和图片文件，是否继续？' onConfirm={() => deletePackageWithFiles(r)}><Button type='link' danger>删除主题包</Button></Popconfirm>}</Space> }];
  const recycleColumns = [...baseColumns, { title: '操作', render: (_: unknown, r: ContentPackage) => <Space><Button type='link' onClick={() => setDetail(r)}>详情</Button>{canUseButton(role, 'restore') && <Button type='link' icon={<RollbackOutlined />} onClick={() => { setRecycle(prev => prev.filter(item => item.id !== r.id)); setPackages(prev => [{ ...r, uploadStatus: 'pending_upload' }, ...prev]); }}>恢复</Button>}</Space> }];
  const fileRecycleColumns = [
    { title: '文件名', dataIndex: 'fileName' },
    { title: '文件类型', dataIndex: 'fileType', render: (v: AssetFileType) => fileTypeText[v] },
    { title: '所属主题包', render: (_: unknown, r: AssetFile) => (packages.find(pkg => pkg.id === r.packageId) || contentPackages.find(pkg => pkg.id === r.packageId))?.topicName || '-' },
    { title: '绑定运营', render: (_: unknown, r: AssetFile) => (packages.find(pkg => pkg.id === r.packageId) || contentPackages.find(pkg => pkg.id === r.packageId))?.operatorName || '-' },
    { title: '原始路径', dataIndex: 'originalPath' },
    { title: '文件大小', dataIndex: 'fileSize', render: (v: number) => v > 1024 * 1024 ? `${(v / 1024 / 1024).toFixed(1)}MB` : `${(v / 1024).toFixed(1)}KB` },
    { title: '删除人', dataIndex: 'deletedBy' },
    { title: '删除时间', dataIndex: 'deletedAt' },
    { title: '计划清理时间', dataIndex: 'purgeAt' },
    { title: '剩余保留时间', render: (_: unknown, r: AssetFile) => <Tag color={remainingColor(r)}>{remainingText(r)}</Tag> },
    { title: '引用状态', dataIndex: 'referenceStatus' },
    { title: '操作', fixed: 'right' as const, render: (_: unknown, r: AssetFile) => <Space><Button type='link' onClick={() => setFileDetail(r)}>查看详情</Button><Button type='link' onClick={() => restoreFiles([r.id])}>恢复</Button>{canPermanentDelete && <Popconfirm title='确定立即永久删除该文件吗？此操作不可恢复，并将从服务器存储中彻底移除。' onConfirm={() => purgeFiles([r.id])}><Button type='link' danger>永久删除</Button></Popconfirm>}</Space> }
  ];
  return <>
    <PageHeader title='内容管理｜我的上传工作台' extra={<Space className='resource-toolbar' size={12}>{canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建主题包</Button>}{canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload()}>上传文件</Button>}</Space>} />
    <Row gutter={[16,16]} className='mb12'>
      <Col span={8}><Card><b>文件软删除</b><p>删除文件后进入文件回收站，7 天内可恢复，服务器定时清理到期文件。</p></Card></Col>
      <Col span={8}><Card><b>即将清理提醒</b><p>{soonCleanCount ? `${soonCleanCount} 个文件将在 24 小时内清理` : '暂无 24 小时内即将清理文件'}</p></Card></Col>
      <Col span={8}><Card><b>操作日志</b><p>{operationLogs[0] || '删除、恢复、永久删除会写入操作日志'}</p></Card></Col>
    </Row>
    <Tabs items={[
      { key: 'mine', label: `我的主题包(${packages.length})`, children: <DataTable rowKey='id' columns={activeColumns} dataSource={packages} /> },
      { key: 'drafts', label: `草稿箱(${draftPackages.length})`, children: <DataTable rowKey='id' columns={activeColumns} dataSource={draftPackages} /> },
      { key: 'records', label: `上传记录(${packages.length + draftPackages.length})`, children: <DataTable rowKey='id' columns={baseColumns} dataSource={[...packages, ...draftPackages]} /> },
      { key: 'file-recycle', label: `文件回收站(${fileRecycle.length})`, children: <>
        <Card className='filter-bar'><Space wrap><Input.Search placeholder='搜索文件名' onSearch={setFileKeyword} style={{ width: 180 }} /><Select allowClear placeholder='文件类型' style={{ width: 140 }} onChange={setFileTypeFilter} options={(['script','video','image'] as AssetFileType[]).map(type => ({ value: type, label: fileTypeText[type] }))} /><Select allowClear placeholder='删除人' style={{ width: 150 }} onChange={setDeletedByFilter} options={[...new Set(fileRecycle.map(file => file.deletedBy).filter(Boolean))].map(name => ({ value: name!, label: name! }))} /><RangePicker showTime onChange={value => setDeleteRange(value as [Dayjs, Dayjs] | null)} /><Select allowClear placeholder='所属主题包' style={{ width: 220 }} onChange={setPackageFilter} options={packages.map(pkg => ({ value: pkg.id, label: pkg.topicName }))} /><Select allowClear placeholder='绑定运营' style={{ width: 160 }} onChange={setOperatorFilter} options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /><Select allowClear placeholder='剩余保留时间' style={{ width: 160 }} onChange={setRetentionFilter} options={[{ value: 'over3', label: '> 3天' }, { value: 'within3', label: '<= 3天' }, { value: 'within24', label: '<= 24小时' }]} /></Space></Card>
        <Space className='mb12'><Button disabled={!selectedRecycleIds.length} onClick={() => restoreFiles(selectedRecycleIds)}>批量恢复</Button>{canPermanentDelete && <Popconfirm title='确定立即永久删除所选文件吗？此操作不可恢复，并将从服务器存储中彻底移除。' onConfirm={() => purgeFiles(selectedRecycleIds)}><Button danger disabled={!selectedRecycleIds.length}>批量永久删除</Button></Popconfirm>}<Tag>服务器定时任务：每小时扫描 purgeAt 到期且 isDeleted=true 的文件并物理删除</Tag></Space>
        <DataTable rowKey='id' rowSelection={{ selectedRowKeys: selectedRecycleIds, onChange: setSelectedRecycleIds }} columns={fileRecycleColumns} dataSource={filteredRecycleFiles} />
      </> },
      { key: 'package-recycle', label: `主题包回收站(${recycle.length})`, children: <DataTable rowKey='id' columns={recycleColumns} dataSource={recycle} /> }
    ]} />
    <ContentPackageDetailDrawer open={Boolean(detailPackage)} onClose={() => setDetail(undefined)} item={detailPackage} files={currentFiles} extraActions={detailPackage && canUseButton(role, 'upload') && <Button icon={<UploadOutlined />} onClick={() => openUpload(detailPackage)}>上传文件</Button>} canDeleteFile={canUseButton(role, 'deleteOwnContent')} onDeleteFile={moveFileToRecycle} />
    <Modal open={Boolean(fileDetail)} title='回收站文件详情' onCancel={() => setFileDetail(undefined)} footer={null} width={760}>{fileDetail && <Descriptions column={1} bordered items={[{ key: 'fileName', label: '文件名', children: fileDetail.fileName }, { key: 'deletedAt', label: '删除时间', children: fileDetail.deletedAt }, { key: 'purgeAt', label: '计划清理时间', children: fileDetail.purgeAt }, { key: 'remaining', label: '剩余时间', children: <Tag color={remainingColor(fileDetail)}>{remainingText(fileDetail)}</Tag> }, { key: 'path', label: '原始路径', children: fileDetail.originalPath }, { key: 'referenceStatus', label: '引用关系', children: fileDetail.referenceStatus }, { key: 'logs', label: '最近操作记录', children: operationLogs.filter(log => log.includes(fileDetail.fileName)).join('；') || '-' }]} />}</Modal>
    <Modal open={createOpen} title='新建主题包' onCancel={() => setCreateOpen(false)} onOk={() => createForm.validateFields().then(createPackage)}><Form form={createForm} layout='vertical'><Form.Item name='operatorId' label='运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item><Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input placeholder='例如：英国硕士申请季短视频主题包' /></Form.Item></Form></Modal>
    <Modal open={uploadOpen} title='上传文件到主题包' onCancel={() => setUploadOpen(false)} onOk={() => uploadForm.validateFields().then(uploadFilesToPackage)} width={760}><Form form={uploadForm} layout='vertical'><Form.Item name='packageId' label='选择主题包' rules={[{ required: true, message: '请先选择已有主题包' }]}><Select showSearch optionFilterProp='label' options={packages.map(pkg => ({ value: pkg.id, label: pathOf(pkg) }))} /></Form.Item><Form.Item name='script' label='上传脚本'><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>脚本文件将归入 / 脚本</p></Upload.Dragger></Form.Item><Form.Item name='video' label='上传视频'><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>视频文件将归入 / 视频</p></Upload.Dragger></Form.Item><Form.Item name='image' label='上传图片'><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>图片文件将归入 / 图片</p></Upload.Dragger></Form.Item></Form></Modal>
    <Modal open={Boolean(editPackage)} title='编辑主题信息' onCancel={() => setEditPackage(undefined)} onOk={() => editForm.validateFields().then(values => { const op = operatorProfiles.find(item => item.id === values.operatorId)!; setPackages(prev => prev.map(pkg => pkg.id === editPackage?.id ? { ...pkg, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { ...pkg.folderPath, operatorId: op.id, operatorName: op.name, topicName: values.topicName } } : pkg)); setEditPackage(undefined); message.success('主题信息已更新，自动路径已同步刷新'); })}><Form form={editForm} layout='vertical'><Form.Item name='operatorId' label='绑定运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item><Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
  </>;
}
