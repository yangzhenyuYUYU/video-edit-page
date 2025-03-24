import React, { useRef, useEffect, useCallback } from 'react';
import { PlayCircleOutlined, CustomerServiceOutlined, AudioOutlined, FontSizeOutlined } from '@ant-design/icons';
import { TRACK_TYPES } from '../../constants';

const TrackItem = ({
  item,
  track,
  zoom,
  duration,
  trackHeaderWidth = 36,
  isSelected,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onResize,
  isCollapsed
}) => {
  const itemRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originalStart: 0,
    mouseOffsetX: 0
  });
  const resizeRef = useRef({
    isResizing: false,
    direction: null,
    startX: 0,
    originalStart: 0,
    originalDuration: 0
  });

  // 计算时间到像素的转换
  const timeToPixels = useCallback((time) => {
    const baseWidthPerSecond = 100;
    return time * baseWidthPerSecond * zoom;
  }, [zoom]);

  // 计算像素到时间的转换
  const pixelsToTime = useCallback((pixels) => {
    const baseWidthPerSecond = 100;
    return pixels / (baseWidthPerSecond * zoom);
  }, [zoom]);

  // 将时间吸附到最近的0.1秒
  const snapToGrid = useCallback((time) => {
    return Math.round(time * 10) / 10;
  }, []);

  // 处理拖拽开始
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = itemRef.current.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originalStart: item.start,
      mouseOffsetX: e.clientX - rect.left
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    onDragStart?.(item.id);
  };

  // 处理拖拽中
  const handleDrag = (e) => {
    if (!dragRef.current.isDragging) return;
    
    const timelineElement = document.querySelector('.timeline');
    if (!timelineElement) return;
    
    const scrollLeft = timelineElement.scrollLeft;
    const rect = timelineElement.getBoundingClientRect();
    
    // 计算新的开始时间
    const mouseX = e.clientX - rect.left + scrollLeft;
    const offsetX = mouseX - dragRef.current.mouseOffsetX - trackHeaderWidth;
    const newStartTime = snapToGrid(pixelsToTime(offsetX));
    
    // 确保不会超出时间轴范围
    const clampedStart = Math.max(0, Math.min(newStartTime, duration - item.duration));
    
    onDrag?.(item.id, clampedStart);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    dragRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    onDragEnd?.();
  };

  // 处理调整大小开始
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizeRef.current = {
      isResizing: true,
      direction,
      startX: e.clientX,
      originalStart: item.start,
      originalDuration: item.duration
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // 处理调整大小
  const handleResize = (e) => {
    if (!resizeRef.current.isResizing) return;
    
    const timelineElement = document.querySelector('.timeline');
    if (!timelineElement) return;
    
    const scrollLeft = timelineElement.scrollLeft;
    const rect = timelineElement.getBoundingClientRect();
    const deltaX = e.clientX - resizeRef.current.startX;
    const deltaTime = pixelsToTime(deltaX);
    
    let newStart = resizeRef.current.originalStart;
    let newDuration = resizeRef.current.originalDuration;
    
    if (resizeRef.current.direction === 'left') {
      const potentialNewStart = snapToGrid(resizeRef.current.originalStart + deltaTime);
      const maxStart = resizeRef.current.originalStart + resizeRef.current.originalDuration - 0.1;
      newStart = Math.max(0, Math.min(potentialNewStart, maxStart));
      newDuration = resizeRef.current.originalDuration - (newStart - resizeRef.current.originalStart);
    } else {
      const potentialNewDuration = snapToGrid(resizeRef.current.originalDuration + deltaTime);
      newDuration = Math.max(0.1, Math.min(potentialNewDuration, duration - newStart));
    }
    
    onResize?.(item.id, newStart, newDuration);
  };

  // 处理调整大小结束
  const handleResizeEnd = () => {
    resizeRef.current.isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  // 渲染内容
  const renderContent = () => {
    switch (track.type) {
      case TRACK_TYPES.VIDEO:
      case TRACK_TYPES.IMAGE:
        return (
          <div className="media-container">
            <div 
              className="video-frames-container"
              style={{
                backgroundImage: `url(${item.cover || item.src || 'https://picsum.photos/300/200'})`,
                backgroundSize: 'auto 100%',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'center',
              }}
            />
          </div>
        );
      
      case TRACK_TYPES.BACKGROUND:
      case TRACK_TYPES.VOICE:
        return (
          <div className="media-container audio-container">
            <div className="audio-icon">
              {track.type === TRACK_TYPES.BACKGROUND ? <CustomerServiceOutlined /> : <AudioOutlined />}
            </div>
            <div className="audio-info">
              <div className="audio-name">{item.content}</div>
              <div className="audio-duration">{item.duration}s</div>
            </div>
          </div>
        );
      
      case TRACK_TYPES.TEXT:
        return (
          <div className="media-container text-container">
            <div className="text-icon">
              <FontSizeOutlined />
            </div>
            <div className="text-content">{item.content}</div>
          </div>
        );
      
      default:
        return (
          <div className="media-container">
            <PlayCircleOutlined />
          </div>
        );
    }
  };

  return (
    <div
      ref={itemRef}
      className={`track-item type-${track.type} ${isSelected ? 'selected' : ''} ${dragRef.current.isDragging ? 'dragging' : ''} ${resizeRef.current.isResizing ? 'resizing' : ''}`}
      style={{
        left: `${timeToPixels(item.start)}px`,
        width: `${timeToPixels(item.duration)}px`
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(item.id);
      }}
      onMouseDown={handleDragStart}
    >
      {renderContent()}
      
      {/* 调整大小的手柄 */}
      <div
        className="resize-handle left"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />
      <div
        className="resize-handle right"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
    </div>
  );
};

export default TrackItem; 