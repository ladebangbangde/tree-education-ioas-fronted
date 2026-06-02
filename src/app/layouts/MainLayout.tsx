import { Layout } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader, AppSider, GlobalUploadPanel } from '@/components';

type DragPosition = { x: number; y: number };

function getDefaultPosition(): DragPosition {
  if (typeof window === 'undefined') return { x: 24, y: 24 };
  return {
    x: Math.max(16, window.innerWidth - 560),
    y: Math.max(88, window.innerHeight - 320)
  };
}

function clampPosition(next: DragPosition): DragPosition {
  if (typeof window === 'undefined') return next;
  return {
    x: Math.min(Math.max(16, next.x), Math.max(16, window.innerWidth - 120)),
    y: Math.min(Math.max(72, next.y), Math.max(72, window.innerHeight - 80))
  };
}

function DraggableTaskPanel({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<DragPosition>(() => {
    const saved = localStorage.getItem('taskPanelPosition');
    if (!saved) return getDefaultPosition();
    try { return clampPosition(JSON.parse(saved)); } catch { return getDefaultPosition(); }
  });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('taskPanelPosition', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const onResize = () => setPosition(current => clampPosition(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: position.x, baseY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPosition(clampPosition({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy }));
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { undefined; }
  };

  return <div className='draggable-task-panel' style={{ left: position.x, top: position.y }}>
    <div className='draggable-task-handle' onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      拖动任务中心
    </div>
    <div className='draggable-task-body'>{children}</div>
  </div>;
}

export default function MainLayout(){
  return <Layout className='main-layout'>
    <AppSider/>
    <Layout className='main-layout-right'>
      <AppHeader/>
      <Layout.Content className='content'>
        <div className='content-inner'>
          <Outlet/>
        </div>
      </Layout.Content>
      <DraggableTaskPanel><GlobalUploadPanel /></DraggableTaskPanel>
    </Layout>
  </Layout>;
}
