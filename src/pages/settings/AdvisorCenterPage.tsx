import { Avatar, Button, Card, Col, Empty, Row, Space, Spin, Tag, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components';
import { advisorsApi, type AdvisorProfile } from '@/api/advisors';

export default function AdvisorCenterPage() {
  const [rows, setRows] = useState<AdvisorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number>();

  const load = async () => {
    setLoading(true);
    try {
      const data = await advisorsApi.list();
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const beforeUpload = (advisor: AdvisorProfile): UploadProps['beforeUpload'] => async file => {
    setUploadingId(advisor.userId);
    try {
      const data = await advisorsApi.uploadAvatar(advisor.userId, file as File);
      message.success('顾问头像上传成功');
      setRows(prev => prev.map(item => item.userId === advisor.userId ? { ...item, avatarUrl: data.avatarUrl } : item));
    } finally {
      setUploadingId(undefined);
    }
    return Upload.LIST_IGNORE;
  };

  return <>
    <PageHeader title='顾问管理中心' extra={<Space><Button onClick={() => load()}>刷新</Button><Button type='primary'>新增顾问</Button></Space>} />
    <Spin spinning={loading}>
      {rows.length === 0 ? <Card><Empty description='暂无顾问档案' /></Card> : <Row gutter={[16, 16]}>
        {rows.map(item => <Col span={8} key={item.userId}>
          <Card
            title={<Space><Avatar src={item.avatarUrl}>{item.name?.slice(0, 1)}</Avatar><span>{item.name}</span></Space>}
            extra={<Tag color='blue'>{item.regionName || item.regionCode || '全球'}</Tag>}
          >
            <p>负责区域：{item.regionName || '-'}</p>
            <p>顾问头衔：{item.publicTitle || '-'}</p>
            <p style={{ minHeight: 48 }}>简介：{item.publicBio || '-'}</p>
            <Upload showUploadList={false} accept='image/*' beforeUpload={beforeUpload(item)}>
              <Button loading={uploadingId === item.userId}>上传/更换头像</Button>
            </Upload>
          </Card>
        </Col>)}
      </Row>}
    </Spin>
  </>;
}
