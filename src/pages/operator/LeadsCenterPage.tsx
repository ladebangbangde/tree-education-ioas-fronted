import { Button, Descriptions, Drawer, Form, Input, Select, Space, Tabs, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { contentPackagesApi } from '@/api/contentPackages';
import { leadsApi, type LeadTab } from '@/api/leads';
import { operatorsApi } from '@/api/operators';
import { DataTable, PageHeader } from '@/components';
import type { ContentPackage, Lead, OperatorProfile } from '@/types/mediaFlow';
import { adaptContentPackage, adaptLead, adaptOperator } from '@/utils/adapters/mediaFlow';

type DisplayTab = LeadTab | 'converted';

const statusMap: Record<string, { text: string; color: string }> = {
  unassigned: { text: '未分配', color: 'orange' },
  assigned: { text: '已分配', color: 'blue' },
  following: { text: '跟进中', color: 'processing' },
  confirmed: { text: '已确认', color: 'cyan' },
  converted: { text: '已生成客户档案', color: 'purple' },
  completed: { text: '已完成', color: 'green' },
  invalid: { text: '无效', color: 'red' },
  closed: { text: '已关闭', color: 'default' }
};

const leadRoleMap: Record<string, { text: string; color: string }> = {
  student: { text: '学生客资', color: 'blue' },
  worker: { text: '劳工客资', color: 'orange' }
};

export default function LeadsCenterPage(){
  const [activeTab, setActiveTab] = useState<DisplayTab>('unassigned');
  const [data, setData] = useState<Lead[]>([]);
  const [detail, setDetail] = useState<Lead>();
  const [packages, setPackages] = useState<ContentPackage[]>([]);
  const [operators, setOperators] = useState<OperatorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [relatedPackageId, setRelatedPackageId] = useState<string>();
  const [operatorId, setOperatorId] = useState<string>();
  const [form] = Form.useForm();

  const loadMeta = useCallback(async () => {
    const [pkgPage, ops] = await Promise.all([contentPackagesApi.list({ tab: 'record', pageNum: 1, pageSize: 200 }), operatorsApi.options()]);
    setPackages(pkgPage.records.map(adaptContentPackage)); setOperators((ops || []).map(adaptOperator));
  }, []);
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const apiTab = activeTab === 'converted' ? undefined : activeTab;
      const page = await leadsApi.list({ tab: apiTab as LeadTab | undefined, keyword: keyword || undefined, relatedPackageId, operatorId, pageNum: 1, pageSize: 500 });
      const rows = page.records.map(adaptLead);
      setData(activeTab === 'converted' ? rows.filter((item: Lead) => item.status === 'converted' || item.archived) : rows);
    } finally { setLoading(false); }
  }, [activeTab, keyword, operatorId, relatedPackageId]);
  useEffect(() => { loadMeta().catch(() => undefined); }, [loadMeta]);
  useEffect(() => { loadLeads().catch(() => undefined); }, [loadLeads]);

  const openDetail = async (row: Lead) => {
    setDetail(row);
    try { setDetail(adaptLead(await leadsApi.detail(row.id))); } catch { setDetail(undefined); }
  };
  const renderRole = (v: string) => <Tag color={leadRoleMap[v]?.color}>{leadRoleMap[v]?.text || v}</Tag>;
  const columns = [
    { title: '线索编号', dataIndex: 'leadNo' }, { title: '姓名', dataIndex: 'studentName' },
    { title: '客资类型', dataIndex: 'leadRole', render: renderRole },
    { title: '手机', dataIndex: 'phone' }, { title: '微信', dataIndex: 'wechat' },
    { title: '来源渠道', dataIndex: 'sourceChannel' }, { title: '意向国家', dataIndex: 'targetCountry' }, { title: '意向专业', dataIndex: 'targetMajor' },
    { title: '预算区间', dataIndex: 'budget' }, { title: '学历阶段', dataIndex: 'degreeLevel' },
    { title: '当前状态', dataIndex: 'status', render: (v: string) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '跟进人', dataIndex: 'assignedToName' },
    { title: '关联素材主题', render: (_: unknown, r: Lead) => packages.find(pkg => pkg.id === r.relatedPackageId)?.topicName || '-' },
    { title: '创建时间', dataIndex: 'createdAt' }, { title: '最近跟进时间', dataIndex: 'updatedAt' },
    { title: '操作', fixed: 'right' as const, render: (_: unknown, r: Lead) => <Space><Button type='link' onClick={() => openDetail(r)}>详情</Button>{r.archived ? <Tag color='purple'>只读</Tag> : null}</Space> }
  ];
  const table = <DataTable loading={loading} rowKey='id' columns={columns} dataSource={data} />;
  return <>
    <PageHeader title='线索中心' extra={<Space><Input.Search allowClear placeholder='搜索姓名/手机/编号' onSearch={setKeyword} style={{ width: 220 }} /><Select allowClear placeholder='素材主题' value={relatedPackageId} onChange={setRelatedPackageId} style={{ width: 180 }} options={packages.map(pkg => ({ value: pkg.id, label: pkg.topicName }))} /><Select allowClear placeholder='运营人员' value={operatorId} onChange={setOperatorId} style={{ width: 160 }} options={operators.map(op => ({ value: op.id, label: op.name }))} /></Space>} />
    <Tabs activeKey={activeTab} onChange={key => setActiveTab(key as DisplayTab)} items={[{ key: 'unassigned', label: '未分配', children: table }, { key: 'assigned', label: '已分配/跟进中', children: table }, { key: 'converted', label: '已生成客户档案', children: table }, { key: 'mine', label: '我的线索', children: table }]} />
    <Drawer open={Boolean(detail)} onClose={() => setDetail(undefined)} title='线索详情' width={680} destroyOnClose>
      {detail && <Descriptions column={1} bordered items={[{ key: 'leadNo', label: '线索编号', children: detail.leadNo }, { key: 'leadRole', label: '客资类型', children: renderRole(detail.leadRole) }, { key: 'archiveStatus', label: '归档状态', children: detail.archived ? <Tag color='purple'>已生成客户档案，只读</Tag> : <Tag color='green'>可跟进</Tag> }, { key: 'studentName', label: '姓名', children: detail.studentName }, { key: 'phone', label: '手机', children: detail.phone }, { key: 'wechat', label: '微信', children: detail.wechat }, { key: 'sourceChannel', label: '来源渠道', children: detail.sourceChannel }, { key: 'target', label: '意向国家/专业', children: <Space>{detail.targetCountry}{detail.targetMajor}</Space> }, { key: 'budget', label: '预算区间', children: detail.budget }, { key: 'degreeLevel', label: '学历阶段', children: detail.degreeLevel }, { key: 'status', label: '当前状态', children: <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text || detail.status}</Tag> }, { key: 'assignedToName', label: '跟进人', children: detail.assignedToName }, { key: 'package', label: '关联素材主题', children: packages.find(pkg => pkg.id === detail.relatedPackageId)?.topicName || '-' }, { key: 'createdAt', label: '创建时间', children: detail.createdAt }, { key: 'updatedAt', label: '最近跟进时间', children: detail.updatedAt }, { key: 'remark', label: '备注', children: detail.remark }]} />}
    </Drawer>
  </>;
}
