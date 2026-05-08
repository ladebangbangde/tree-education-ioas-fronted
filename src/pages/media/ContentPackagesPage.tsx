import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Tag, Upload, message } from 'antd';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { DataTable, PageHeader } from '@/components';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { assetFiles, contentPackages, operatorProfiles } from '@/mock/mediaFlow';
import type { ContentPackage } from '@/types/mediaFlow';

const statusColor: Record<string, string> = { uploading: 'processing', success: 'green', failed: 'red', partial_success: 'gold', pending_supplement: 'orange' };
const statusText: Record<string, string> = { uploading: '上传中', success: '上传成功', failed: '上传失败', partial_success: '部分成功', pending_supplement: '待补充素材' };

export default function ContentPackagesPage(){
  const [packages, setPackages] = useState(contentPackages);
  const [detail, setDetail] = useState<ContentPackage>();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const currentFiles = useMemo(() => assetFiles.filter(file => file.packageId === detail?.id), [detail]);
  const columns = [
    { title: '封面', dataIndex: 'coverUrl', width: 110, render: (url: string) => <img src={url} className='cover-thumb' /> },
    { title: '主题名称', dataIndex: 'topicName' },
    { title: '绑定运营', dataIndex: 'operatorName' },
    { title: '结构化目录', render: (_: unknown, r: ContentPackage) => `${r.folderPath.operatorName} / ${r.folderPath.year} / ${String(r.folderPath.month).padStart(2, '0')} / ${String(r.folderPath.day).padStart(2, '0')} / ${r.topicName}` },
    { title: '脚本/视频/图片', render: (_: unknown, r: ContentPackage) => `${r.scriptCount}/${r.videoCount}/${r.imageCount}` },
    { title: '状态', dataIndex: 'uploadStatus', render: (v: string) => <Tag color={statusColor[v]}>{statusText[v]}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '操作', fixed: 'right' as const, render: (_: unknown, r: ContentPackage) => <Space><Button type='link' onClick={() => setDetail(r)}>详情</Button><Button type='link' danger onClick={() => setPackages(prev => prev.filter(item => item.id !== r.id))}>删除</Button></Space> }
  ];
  return <>
    <PageHeader title='内容管理｜内容主题包' extra={<Button type='primary' icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建主题包</Button>} />
    <Row gutter={[16,16]} className='mb12'>
      <Col span={8}><Card><b>媒体作为起点</b><p>上传脚本、视频、图片并绑定运营后，系统生成上传任务与标准素材目录。</p></Card></Col>
      <Col span={8}><Card><b>结构化目录</b><p>顶级目录为运营人员名称，同时保留 operatorId、日期、主题等结构化字段。</p></Card></Col>
      <Col span={8}><Card><b>后续流转</b><p>素材入库后，运营在媒体资源中心消费素材并生成线索任务。</p></Card></Col>
    </Row>
    <DataTable rowKey='id' columns={columns} dataSource={packages} />
    <ContentPackageDetailDrawer open={Boolean(detail)} onClose={() => setDetail(undefined)} item={detail} files={currentFiles} />
    <Modal open={open} title='上传内容主题包并绑定运营' onCancel={() => setOpen(false)} onOk={() => form.validateFields().then(values => {
      const op = operatorProfiles.find(item => item.id === values.operatorId)!;
      const now = new Date('2026-05-08T10:00:00Z');
      const next: ContentPackage = { id: `PKG${Date.now()}`, topicName: values.topicName, operatorId: op.id, operatorName: op.name, folderPath: { operatorId: op.id, operatorName: op.name, year: now.getUTCFullYear(), month: now.getUTCMonth()+1, day: now.getUTCDate(), topicName: values.topicName }, coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=480&q=80', scriptCount: values.scripts?.fileList?.length || 0, videoCount: values.videos?.fileList?.length || 0, imageCount: values.images?.fileList?.length || 0, uploadStatus: 'uploading', createdBy: '媒体账号-王悦', createdAt: '2026-05-08 10:00' };
      setPackages(prev => [next, ...prev]); setOpen(false); form.resetFields(); message.success('已生成主题包、上传任务和虚拟素材目录');
    })} width={760}>
      <Form form={form} layout='vertical'>
        <Form.Item name='topicName' label='主题名称' rules={[{ required: true }]}><Input placeholder='例如：英国硕士申请季短视频主题包' /></Form.Item>
        <Form.Item name='operatorId' label='选择对应运营人员' rules={[{ required: true }]}><Select options={operatorProfiles.map(op => ({ value: op.id, label: op.name }))} /></Form.Item>
        <Form.Item name='scripts' label='上传脚本文案文件（word / txt / pdf）'><Upload.Dragger beforeUpload={() => false} multiple accept='.doc,.docx,.txt,.pdf'><p><InboxOutlined /></p><p>点击或拖拽上传脚本文案</p></Upload.Dragger></Form.Item>
        <Form.Item name='videos' label='上传视频文件'><Upload.Dragger beforeUpload={() => false} multiple accept='video/*'><p><InboxOutlined /></p><p>点击或拖拽上传视频</p></Upload.Dragger></Form.Item>
        <Form.Item name='images' label='上传图片文件'><Upload.Dragger beforeUpload={() => false} multiple accept='image/*'><p><InboxOutlined /></p><p>点击或拖拽上传图片，系统生成封面缩略图</p></Upload.Dragger></Form.Item>
      </Form>
    </Modal>
  </>;
}
