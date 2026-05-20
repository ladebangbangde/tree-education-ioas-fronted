import { FileImageOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { assetsApi } from '@/api/assets';
import type { AssetFile } from '@/types/mediaFlow';

interface Props {
  file: AssetFile;
  className?: string;
}

function captureVideoFrame(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = videoUrl;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      try {
        video.currentTime = Math.min(0.3, Math.max(0, (video.duration || 1) / 10));
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas context unavailable');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('video thumbnail load failed'));
    };
  });
}

export default function AssetPreviewThumb({ file, className }: Props) {
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | undefined;

    async function loadThumb() {
      setFailed(false);
      setSrc(undefined);
      if (file.fileType === 'script') return;

      try {
        const res = await assetsApi.download(file.id);
        objectUrl = URL.createObjectURL(res.data);
        if (file.fileType === 'image') {
          if (alive) setSrc(objectUrl);
          return;
        }
        if (file.fileType === 'video') {
          const frame = await captureVideoFrame(objectUrl);
          if (alive) setSrc(frame);
        }
      } catch {
        if (alive) setFailed(true);
      }
    }

    loadThumb();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.fileType]);

  if (src) return <img className={className} src={src} alt={file.fileName} />;
  if (file.fileType === 'video') return <div className={className}>{failed ? <PlayCircleOutlined /> : <span>正在生成视频截图...</span>}<PlayCircleOutlined className='video-play-mark' /></div>;
  if (file.fileType === 'image') return <div className={className}>{failed ? <FileImageOutlined /> : <span>正在加载图片...</span>}</div>;
  return <div className={className}><FileImageOutlined /></div>;
}
