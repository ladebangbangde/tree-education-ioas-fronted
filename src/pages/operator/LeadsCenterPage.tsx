import { Button, Descriptions, Drawer, Space, Tabs, Tag } from 'antd';
import { useState } from 'react';
import { DataTable, PageHeader } from '@/components';
import { contentPackages, mediaFlowLeads } from '@/mock/mediaFlow';
import type { Lead } from '@/types/mediaFlow';

const statusMap: Record<string, { text: string; color: string }> = { unassigned: { text: '未分配', color: 'orange' }, assigned: { text: '已分配', color: 'blue' }, following: { text: '跟进中', color: 'processing' }, completed: { text: '已完成', color: 'green' }, invalid: { text: '无效', color: 'red' } };

export default function LeadsCenterPage(){
  const [detail, setDetail] = useState<Lead>();
  const columns = [
    { title: '线索编号', dataIndex: 'leadNo' },
    { title: '姓名', dataIndex: 'studentName' },
    { title: '手机', dataIndex: 'phone' },
    { title: '微信', dataIndex: 'wechat' },
    { title: '来源渠道', dataIndex: 'sourceChannel' },
    { title: '意向国家', dataIndex: 'targetCountry' },
    { title: '意向专业', dataIndex: 'targetMajor' },
    { title: '预算区间', dataIndex: 'budget' },
    { title: '学历阶段', dataIndex: 'degreeLevel' },
    { title: '当前状态', dataIndex: 'status', render: (v: string) => <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> },
    { title: '跟进人', dataIndex: 'assignedToName' },
    { title: '关联素材主题', render: (_: unknown, r: Lead) => contentPackages.find(pkg => pkg.id === r.relatedPackageId)?.topicName || '-' },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '最近跟进时间', dataIndex: 'updatedAt' },
    { title: '操作', fixed: 'right' as const, render: (_: unknown, r: Lead) => <Button type='link' onClick={() => setDetail(r)}>详情</Button> }
  ];
  const table = (data: Lead[]) => <DataTable rowKey='id' columns={columns} dataSource={data} />;
  return <>
    <PageHeader title='线索中心' extra={<span>线索由运营基于媒体素材创建，媒体不承担转化结果</span>} />
    <Tabs items={[
      { key: 'unassigned', label: `未分配(${mediaFlowLeads.filter(l => l.status === 'unassigned').length})`, children: table(mediaFlowLeads.filter(l => l.status === 'unassigned')) },
      { key: 'assigned', label: `已分配(${mediaFlowLeads.filter(l => l.status === 'assigned').length})`, children: table(mediaFlowLeads.filter(l => l.status === 'assigned')) },
      { key: 'mine', label: `我的线索(${mediaFlowLeads.length})`, children: table(mediaFlowLeads) }
    ]} />
    <Drawer open={Boolean(detail)} onClose={() => setDetail(undefined)} title='线索详情' width={680} destroyOnClose>
      {detail && <Descriptions column={1} bordered items={[
        { key: 'leadNo', label: '线索编号', children: detail.leadNo },
        { key: 'studentName', label: '姓名', children: detail.studentName },
        { key: 'phone', label: '手机', children: detail.phone },
        { key: 'wechat', label: '微信', children: detail.wechat },
        { key: 'sourceChannel', label: '来源渠道', children: detail.sourceChannel },
        { key: 'target', label: '意向国家/专业', children: <Space>{detail.targetCountry}{detail.targetMajor}</Space> },
        { key: 'budget', label: '预算区间', children: detail.budget },
        { key: 'degreeLevel', label: '学历阶段', children: detail.degreeLevel },
        { key: 'status', label: '当前状态', children: <Tag color={statusMap[detail.status].color}>{statusMap[detail.status].text}</Tag> },
        { key: 'assignedToName', label: '跟进人', children: detail.assignedToName },
        { key: 'package', label: '关联素材主题', children: contentPackages.find(pkg => pkg.id === detail.relatedPackageId)?.topicName },
        { key: 'createdAt', label: '创建时间', children: detail.createdAt },
        { key: 'updatedAt', label: '最近跟进时间', children: detail.updatedAt },
        { key: 'remark', label: '备注', children: detail.remark }
      ]} />}
    </Drawer>
  </>;
}
