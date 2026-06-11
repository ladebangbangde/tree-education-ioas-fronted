import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, DatePicker, Form, Modal, Select, Space, Statistic, Table, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { exportDataOpsExcelReport, getDataOpsExcelReportLogs, getDataOpsExcelReportPreview, type DataOpsExcelReportLog, type DataOpsExcelReportPreview } from '@/api/dataOpsReport';

export default function ExcelReportPage() {
  const [form] = Form.useForm();
  const [preview, setPreview] = useState<DataOpsExcelReportPreview>();
  const [logs, setLogs] = useState<DataOpsExcelReportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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
          { title: '文件名', dataIndex: 'file_name' }
        ]} />
      </Card>
    </Space>
  );
}
