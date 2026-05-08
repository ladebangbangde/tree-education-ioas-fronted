import { Button, Form, Input, Modal, Select, message } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components';
import AssetFolderBrowser from '@/components/mediaFlow/AssetFolderBrowser';
import ContentPackageDetailDrawer from '@/components/mediaFlow/ContentPackageDetailDrawer';
import { assetFiles, contentPackages } from '@/mock/mediaFlow';
import type { ContentPackage } from '@/types/mediaFlow';

export default function MediaAssetsPage(){
  const [detail, setDetail] = useState<ContentPackage>();
  const [leadPackage, setLeadPackage] = useState<ContentPackage>();
  const [form] = Form.useForm();
  const detailFiles = useMemo(() => assetFiles.filter(file => file.packageId === detail?.id), [detail]);
  return <>
    <PageHeader title='媒体资源中心' extra={<span>素材消费中心：运营查看素材、预览文件并生成线索</span>} />
    <AssetFolderBrowser packages={contentPackages} files={assetFiles} onView={setDetail} onGenerateLead={setLeadPackage} />
    <ContentPackageDetailDrawer open={Boolean(detail)} onClose={() => setDetail(undefined)} item={detail} files={detailFiles} />
    <Modal open={Boolean(leadPackage)} title={`基于素材生成线索：${leadPackage?.topicName || ''}`} onCancel={() => setLeadPackage(undefined)} onOk={() => form.validateFields().then(() => { message.success('线索已创建，对应运营线索生成任务更新为已完成'); setLeadPackage(undefined); form.resetFields(); })}>
      <Form form={form} layout='vertical'>
        <Form.Item name='studentName' label='姓名' rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name='phone' label='手机' rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name='wechat' label='微信'><Input /></Form.Item>
        <Form.Item name='sourceChannel' label='来源渠道'><Select options={['小红书','视频号','官网表单','抖音','朋友圈'].map(v => ({ value: v, label: v }))} /></Form.Item>
        <Form.Item name='targetCountry' label='意向国家'><Input /></Form.Item>
        <Form.Item name='targetMajor' label='意向专业'><Input /></Form.Item>
        <Form.Item name='budget' label='预算区间'><Input placeholder='例如：40-60万' /></Form.Item>
        <Form.Item name='degreeLevel' label='学历阶段'><Input placeholder='例如：本科升硕士' /></Form.Item>
        <Form.Item name='remark' label='备注'><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  </>;
}
