import { Empty, Image, Spin } from 'antd';
import { useEffect, useState } from 'react';
import client from '@/api/client';

interface AuthenticatedAssetImageProps {
  assetId?: number | string;
  height?: number;
  width?: number | string;
  style?: React.CSSProperties;
}

export function AuthenticatedAssetImage({ assetId, height = 130, width = '100%', style }: AuthenticatedAssetImageProps) {
  const [src, setSrc] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setSrc(undefined);
    setFailed(false);
    if (!assetId) return;
    setLoading(true);
    client.get(`/data-ops/assets/${assetId}/file`, { responseType: 'blob', silent: true })
      .then(response => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId]);

  if (!assetId) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传" />;
  if (loading) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
  if (failed || !src) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="图片加载失败" />;
  return <Image src={src} width={width} height={height} style={{ objectFit: 'cover', borderRadius: 6, ...style }} />;
}
