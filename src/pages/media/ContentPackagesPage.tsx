import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Tabs, Tag, Upload, message } from 'antd';
import { InboxOutlined, PlusOutlined, RollbackOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { DataTable, PageHeader } from '@/components';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { canUseButton } from '@/constants/permissions';
import { assetFiles, contentPackages, operatorProfiles } from '@/mock/mediaFlow';
import { useAuthStore } from '@/store/auth';
import type { ContentPackage } from '@/types/mediaFlow';

const statusColor: Record<string, string> = { uploading: 'processing', success: 'green', failed: 'red', partial_success: 'gold', pending_supplement: 'orange' };
const statusText: Record<string, string> = { uploading: '上传中', success: '上传成功', failed: '上传失败', partial_success: '部分成功', pending_supplement: '待补充素材' };
const draftPackages: ContentPackage[] = [{ ...contentPackages[2], id: 'DRAFT20260508001', topicName: '香港传媒申请故事草稿', uploadStatus: 'pending_supplement', createdAt: '2026-05-08 12:00' }];
const recyclePackages: ContentPackage[] = [{ ...contentPackages[1], id: 'RECYCLE20260507001', topicName: '已删除-澳洲护理专业就业解读素材' }];

export default function ContentPackagesPage(){
  const role = useAuthStore(s => s.role);
  const [packages, setPackages] = useState(contentPackages);
  const [recycle, setRecycle] = useState(recyclePackages);
  const [detail, setDetail] = useState<ContentPackage>();
  const [editPackage, setEditPackage] = useState<ContentPackage>();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const currentFiles = useMemo(() => assetFiles.filter(file => file.packageId === detail?.id), [detail]);
  const createPackage = (values: any) => {
    const op = operatorProfiles.find(item => item.id === values.operatorId)!;
    const next: ContentPackage = { id: `PKG${Date.now()}`, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { operatorId: op.id, operatorName: op.name, year: 2026, month: 5, day: 8, topicName: values.topicName }, coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=480&q=80', scriptCount: values.scripts?.fileList?.length || 0, videoCount: values.videos?.fileList?.length || 0, imageCount: values.images?.fileList?.length || 0, uploadStatus: 'uploading', createdBy: '媒体账号-王悦', createdAt: '2026-05-08 10:00' };
    setPackages(prev => [next, ...prev]); setOpen(false); form.resetFields(); message.success('已生成主题包、上传任务和虚拟素材目录');
  };
  const baseColumns = [
    { title: '封面', dataIndex: 'coverUrl', width: 110, render: (url: string) => <img src={url} className='cover-thumb' /> },
    { title: '主题名称', dataIndex: 'topicName' },
    { title: '绑定运营', dataIndex: 'operatorName' },
    { title: '结构化目录', render: (_: unknown, r: ContentPackage) => `${r.folderPath.operatorName} / ${r.folderPath.year} / ${String(r.folderPath.month).padStart(2, '0')} / ${String(r.folderPath.day).padStart(2, '0')} / ${r.topicName}` },
    { title: '脚本/视频/图片', render: (_: unknown, r: ContentPackage) => `${r.scriptCount}/${r.videoCount}/${r.imageCount}` },
    { title: '状态', dataIndex: 'uploadStatus', render: (v: string) => <Tag color={statusColor[v]}>{statusText[v]}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt' }
  ];
  const activeColumns = [...baseColumns, { title: '操作', fixed: 'right' as const, render: (_: unknown, r: ContentPackage) => <Space>
    <Button type='link' onClick={() => setDetail(r)}>详情</Button>
    {canUseButton(role, 'editOwnContent') && <Button type='link' onClick={() => { setEditPackage(r); editForm.setFieldsValue({ topicName: r.topicName, operatorId: r.operatorId }); }}>编辑</Button>}
    {canUseButton(role, 'deleteOwnContent') && <Popconfirm title='确认删除并移入回收站？' onConfirm={() => { setPackages(prev => prev.filter(item => item.id !== r.id)); setRecycle(prev => [r, ...prev]); }}><Button type='link' danger>删除</Button></Popconfirm>}
  </Space> }];
  const recycleColumns = [...baseColumns, { title: '操作', render: (_: unknown, r: ContentPackage) => <Space><Button type='link' onClick={() => setDetail(r)}>详情</Button>{canUseButton(role, 'restore') && <Button type='link' icon={<RollbackOutlined />} onClick={() => { setRecycle(prev => prev.filter(item => item.id !== r.id)); setPackages(prev => [r, ...prev]); }}>恢复</Button>}</Space> }];
  return <>
    <PageHeader title='内容管理｜我的上传工作台' extra={canUseButton(role, 'createPackage') && <Button type='primary' icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建内容主题包</Button>} />
    <Row gutter={[16,16]} className='mb12'>
      <Col span={8}><Card><b>我的上传</b><p>媒体作为业务起点，上传脚本、视频、图片并绑定运营。</p></Card></Col>
      <Col span={8}><Card><b>上传任务</b><p>新建主题包后自动生成上传任务，支持失败重试和待补充素材。</p></Card></Col>
      <Col span={8}><Card><b>素材流转</b><p>素材入库后进入公共媒体资源中心，运营只能消费素材生成线索。</p></Card></Col>
    </Row>
    <Tabs items={[
      { key: 'mine', label: `我的上传(${packages.length})`, children: <DataTable rowKey='id' columns={activeColumns} dataSource={packages} /> },
      { key: 'drafts', label: `草稿箱(${draftPackages.length})`, children: <DataTable rowKey='id' columns={activeColumns} dataSource={draftPackages} /> },
      { key: 'records', label: `上传记录(${packages.length + draftPackages.length})`, children: <DataTable rowKey='id' columns={baseColumns} dataSource={[...packages, ...draftPackages]} /> },
      { key: 'recycle', label: `回收站(${recycle.length})`, children: <DataTable rowKey='id' columns={recycleColumns} dataSource={recycle} /> }
    ]} />
    <ContentPackageDetailDrawer open={Boolean(detail)} onClose={() => setDetail(undefined)} item={detail} files={currentFiles} />
    <Modal open={open} title='上传内容主题包并绑定运营' onCancel={() => setOpen(false)} onOk={() => form.validateFields().then(createPackage)} width={760}>
      <Form form={form} layout='vertical'>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input placeholder='例如：英国硕士申请季短视频主题包' /></Form.Item>
        <Form.Item name='operatorId' label='选择对应运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
        <Form.Item name='scripts' label='上传脚本文案文件（word / txt / pdf）'><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>点击或拖拽上传脚本文案</p></Upload.Dragger></Form.Item>
        <Form.Item name='videos' label='上传视频文件'><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>点击或拖拽上传视频</p></Upload.Dragger></Form.Item>
        <Form.Item name='images' label='上传图片文件'><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>点击或拖拽上传图片，系统生成封面缩略图</p></Upload.Dragger></Form.Item>
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
  </>;
}
