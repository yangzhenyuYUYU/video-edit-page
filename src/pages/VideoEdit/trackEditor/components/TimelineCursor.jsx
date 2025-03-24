import React, { useRef, useEffect } from 'react';

const TimelineCursor = ({
  currentTime,
  duration,
  zoom,
  trackHeaderWidth = 36,
  onTimeChange,
  isPlaying
}) => {
  const cursorRef = useRef(null);
  const isDraggingRef = useRef(false);
  const initialMouseXRef = useRef(0);
  const initialTimeRef = useRef(0);

  // 计算游标位置
  const calculateCursorPosition = (time) => {
    const baseWidthPerSecond = 100;
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    return trackHeaderWidth + (time * scaledWidthPerSecond);
  };

  // 处理游标拖拽开始
  const handleCursorMouseDown = (e) => {
    if (isPlaying) return;
    e.preventDefault();
    e.stopPropagation();
    
    isDraggingRef.current = true;
    initialMouseXRef.current = e.clientX;
    initialTimeRef.current = currentTime;
    
    document.addEventListener('mousemove', handleCursorDrag);
    document.addEventListener('mouseup', handleCursorDragEnd);
    
    // 添加拖拽样式
    document.body.style.cursor = 'col-resize';
    if (cursorRef.current) {
      cursorRef.current.classList.add('dragging');
    }
  };

  // 处理游标拖拽
  const handleCursorDrag = (e) => {
    if (!isDraggingRef.current) return;
    
    const timelineElement = document.querySelector('.timeline');
    if (!timelineElement) return;
    
    const tracksContainer = timelineElement.querySelector('.tracks-container');
    const timelineRect = timelineElement.getBoundingClientRect();
    const scrollLeft = tracksContainer.scrollLeft;
    const baseWidthPerSecond = 100;
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    
    // 计算鼠标移动的距离（考虑滚动位置）
    const mouseDeltaX = e.clientX - initialMouseXRef.current;
    const timeDelta = (mouseDeltaX + scrollLeft) / scaledWidthPerSecond;
    
    // 计算新的时间点，并确保精确到0.1秒
    let newTime = Math.round((initialTimeRef.current + timeDelta) * 10) / 10;
    
    // 确保时间在有效范围内
    newTime = Math.max(0, Math.min(newTime, duration));
    
    // 触发时间变化
    onTimeChange(newTime);

    // 自动滚动处理
    const cursorPosition = calculateCursorPosition(newTime);
    const containerWidth = tracksContainer.clientWidth;
    const scrollRight = scrollLeft + containerWidth;

    if (cursorPosition < scrollLeft + trackHeaderWidth) {
      tracksContainer.scrollLeft = Math.max(0, cursorPosition - trackHeaderWidth);
    } else if (cursorPosition > scrollRight) {
      tracksContainer.scrollLeft = cursorPosition - containerWidth + trackHeaderWidth;
    }
  };

  // 处理游标拖拽结束
  const handleCursorDragEnd = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleCursorDrag);
    document.removeEventListener('mouseup', handleCursorDragEnd);
    
    // 移除拖拽样式
    document.body.style.cursor = '';
    if (cursorRef.current) {
      cursorRef.current.classList.remove('dragging');
    }
  };

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleCursorDrag);
      document.removeEventListener('mouseup', handleCursorDragEnd);
    };
  }, []);

  const cursorPosition = calculateCursorPosition(currentTime);

  return (
    <>
      <div
        className="cursor-indicator"
        style={{ 
          left: `${cursorPosition}px`,
          position: 'absolute',
          top: 0,
          width: '10px',
          height: '10px',
          backgroundColor: '#000',
          borderRadius: '50%',
          transform: 'translate(-50%, 0)',
          cursor: 'pointer',
          zIndex: 10,
          marginTop: '1px',
          border: '1.5px solid #000',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8)',
          opacity: 0.85
        }}
        onMouseDown={handleCursorMouseDown}
        ref={cursorRef}
      />
      <div
        className="cursor-line"
        style={{ 
          left: `${cursorPosition}px`,
          position: 'absolute',
          top: '11px',
          bottom: 0,
          width: '1px',
          backgroundColor: '#000',
          transform: 'translateX(-50%)',
          cursor: 'col-resize',
          zIndex: 9,
          transition: 'width 0.15s ease',
          ':hover': {
            width: '2px'
          }
        }}
        onMouseDown={handleCursorMouseDown}
      />
      <style>
        {`
          .cursor-line:hover {
            width: 2px !important;
          }
        `}
      </style>
    </>
  );
};

export default TimelineCursor; 