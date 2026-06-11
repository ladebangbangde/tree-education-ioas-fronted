import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, DatePicker, Drawer, Form, Modal, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { exportDataOpsExcelReport, getDataOpsExcelReportLogs, getDataOpsExcelReportPreview, getDataOpsExcelReportTop5, type DataOpsExcelReportLog, type DataOpsExcelReportPreview, type DataOpsExcelReportTop5Response } from '@/api/dataOpsReport';

export default function ExcelReportPage() {
  const [form] = Form.useForm();
  const [preview, setPreview] = useState<DataOpsExcelReportPreview>();
  const [logs, setLogs] = useState<DataOpsExcelReportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerData, setDrawerData] = useState<DataOpsExcelReportTop5Response>();

  const loadLogs = async () => {
    try { setLogs(await getDataOpsExcelReportLogs()); } catch { setLogs([]); }
  };

  const loadPreview = async () => {
    const values = form.getFieldsValue();
    setLoading(true);
    try {
      const data = await getDataOpsExcelReportPreview({
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        platform: values.platform || 'ALL',
        onlyConfirmed: values.onlyConfirmed ?? true
      });
      setPreview(data);
    } finally { setLoading(false); }
  };

  const openTop5Drawer = async (record: DataOpsExcelReportLog) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const data = await getDataOpsExcelReportTop5(record.id);
      setDrawerData(data);
    } finally {
      setDrawerLoading(false);
    }
  };

  const onExport = async () => {
    const values = form.getFieldsValue();
    Modal.confirm({
      title: '确认生成 Excel 报表',
      content: `日期：${values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}；平台：${values.platform || 'ALL'}。`,
      onOk: async () => {
        setExporting(true);
        try {
          const result = await exportDataOpsExcelReport({
            date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            platform: values.platform || 'ALL',
            onlyConfirmed: values.onlyConfirmed ?? true
          });
          message.success(`报表已下载：${result.fileName}`);
          await loadLogs();
          await loadPreview();
        } finally { setExporting(false); }
      }
    });
  };

  useEffect(() => {
    form.setFieldsValue({ date: dayjs(), platform: 'ALL', onlyConfirmed: true });
    loadPreview();
    loadLogs();
  }, []);

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      <Card title='Excel 报表导出'>
        <Form form={form} layout='inline'>
          <Form.Item name='date' label='日期'><DatePicker /></Form.Item>
          <Form.Item name='platform' label='平台'>
            <Select style={{ width: 160 }} options={[{ label: '全部', value: 'ALL' }, { label: '抖音', value: 'DOUYIN' }, { label: '小红书', value: 'XIAOHONGSHU' }, { label: '视频号', value: 'WECHAT_CHANNEL' }]} />
          </Form.Item>
          <Form.Item name='onlyConfirmed' valuePropName='checked'><Checkbox>只导出已确认数据</Checkbox></Form.Item>
          <Form.Item><Space><Button onClick={loadPreview} loading={loading}>刷新预览</Button><Button type='primary' onClick={onExport} loading={exporting}>生成 Excel 报表</Button></Space></Form.Item>
        </Form>
        <div style={{ marginTop: 12 }}>
          <Typography.Text type='secondary'>当前命中表：{preview?.tableName || '-'}</Typography.Text>
          <Typography.Text type='secondary' style={{ marginLeft: 16 }}>取数模式：{preview?.sourceMode || '-'}</Typography.Text>
        </div>
      </Card>

      <Space size={16} wrap>
        <Card><Statistic title='今日内容数量' value={preview?.totalContentCount || 0} loading={loading} /></Card>
        <Card><Statistic title='已确认' value={preview?.confirmedCount || 0} loading={loading} /></Card>
        <Card><Statistic title='未确认' value={preview?.unconfirmedCount || 0} loading={loading} /></Card>
        <Card><Statistic title='人工修正' value={preview?.manualCorrectedCount || 0} loading={loading} /></Card>
      </Space>

      <Card title='导出记录'>
        <Table rowKey='id' pagination={false} dataSource={logs} columns={[
          { title: '导出时间', dataIndex: 'exported_at' },
          { title: '报表日期', dataIndex: 'report_date' },
          { title: '平台', dataIndex: 'platform' },
          { title: '内容数量', dataIndex: 'total_content_count' },
          { title: '导出人', dataIndex: 'exported_by_name' },
          { title: '文件名', dataIndex: 'file_name' },
          { title: '操作', key: 'action', render: (_, record: DataOpsExcelReportLog) => <Button type='link' onClick={() => openTop5Drawer(record)}>查看前5条</Button> }
        ]} />
      </Card>

      <Drawer width={860} title='Excel 报表前5条数据预览' open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Space direction='vertical' size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>文件：</Typography.Text>
            <Typography.Text>{drawerData?.fileName || '-'}</Typography.Text>
            <Tag style={{ marginLeft: 12 }}>{drawerData?.platform || '-'}</Tag>
            <Tag>{drawerData?.reportDate || '-'}</Tag>
          </div>
          <div>
            <Typography.Text type='secondary'>命中表：{drawerData?.tableName || '-'}</Typography.Text>
            <Typography.Text type='secondary' style={{ marginLeft: 16 }}>取数模式：{drawerData?.sourceMode || '-'}</Typography.Text>
          </div>
          <Table
            rowKey={(_, index) => String(index)}
            loading={drawerLoading}
            pagination={false}
            scroll={{ x: 1200 }}
            dataSource={drawerData?.rows || []}
            columns={[
              { title: '主题包', dataIndex: 'packageName', width: 140 },
              { title: '平台', dataIndex: 'platform', width: 100 },
              { title: '账号', dataIndex: 'account', width: 120 },
              { title: '标题', dataIndex: 'title', width: 220 },
              { title: '子主题', dataIndex: 'subTopic', width: 140 },
              { title: '内容类型', dataIndex: 'contentType', width: 100 },
              { title: '播放', dataIndex: 'page1Views', width: 100 },
              { title: '点赞', dataIndex: 'page1Likes', width: 100 },
              { title: '评论', dataIndex: 'page1Comments', width: 100 },
              { title: '收藏', dataIndex: 'page1Favorites', width: 100 },
              { title: '转发', dataIndex: 'page1Shares', width: 100 },
              { title: '曝光', dataIndex: 'page2Exposure', width: 100 },
              { title: '主页访问', dataIndex: 'page2ProfileViews', width: 120 },
              { title: '涨粉', dataIndex: 'page2Followers', width: 100 },
              { title: '完播率', dataIndex: 'page3CompletionRate', width: 100 },
              { title: '互动率', dataIndex: 'page3EngagementRate', width: 100 },
              { title: '人工修正', dataIndex: 'corrected', width: 100, render: (v: boolean) => v ? '是' : '否' }
            ]}
          />
        </Space>
      </Drawer>
    </Space>
  );
}
