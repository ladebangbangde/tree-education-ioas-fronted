import { useEffect, useState } from 'react';
import { uploadManager, type GlobalUploadItem } from '@/services/uploadManager';

export function useUploadManager() {
  const [items, setItems] = useState<GlobalUploadItem[]>(uploadManager.snapshot());

  useEffect(() => uploadManager.subscribe(setItems), []);

  return { items, uploadManager };
}
