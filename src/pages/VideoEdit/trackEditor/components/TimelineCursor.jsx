import React, { useRef, useEffect, useState, useCallback } from 'react';
import './TimelineCursor.scss';

const TimelineCursor = ({
  currentTime,
  duration,
  actualVideoDuration,
  zoom,
  trackHeaderWidth = 36,
  onTimeChange,
  isPlaying
}) => {
  const cursorRef = useRef(null);
  const isDraggingRef = useRef(false);
  const initialMouseXRef = useRef(0);
  const initialTimeRef = useRef(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // 计算游标位置 - 使用useCallback缓存函数
  const calculateCursorPosition = useCallback((time) => {
    // 严格限制：先按照视频实际时长限制，确保不超过视频片段
    const realVideoDuration = actualVideoDuration || duration;
    const boundedTime = Math.min(Math.max(0, time), realVideoDuration - 0.01);
    const baseWidthPerSecond = 100;
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    // 计算像素位置
    return trackHeaderWidth + (boundedTime * scaledWidthPerSecond);
  }, [actualVideoDuration, duration, zoom, trackHeaderWidth]);
  
  // 从像素位置反推时间 - 使用useCallback缓存函数
  const pixelToTime = useCallback((pixelPos) => {
    const baseWidthPerSecond = 100;
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    // 计算相对于轨道头部的像素
    const relativePixel = pixelPos - trackHeaderWidth;
    // 转换为时间
    return relativePixel / scaledWidthPerSecond;
  }, [zoom, trackHeaderWidth]);

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
    
    // 创建全屏覆盖层以捕获所有鼠标事件
    const overlay = document.createElement('div');
    overlay.className = 'cursor-drag-overlay';
    overlay.id = 'cursor-drag-overlay';
    document.body.appendChild(overlay);
  };

  // 处理游标拖拽
  const handleCursorDrag = (e) => {
    if (!isDraggingRef.current) return;
    
    const timelineElement = document.querySelector('.timeline');
    if (!timelineElement) return;
    
    // 获取时间轴的滚动位置与几何信息
    const rect = timelineElement.getBoundingClientRect();
    const scrollLeft = timelineElement.scrollLeft;
    
    // 计算鼠标在时间轴上的相对位置（考虑滚动）
    const mouseXInTimeline = e.clientX - rect.left + scrollLeft;
    
    // 基于鼠标位置计算时间
    let newTime = pixelToTime(mouseXInTimeline);
    // 对时间进行舍入处理（0.1秒精度）
    newTime = Math.round(newTime * 10) / 10;
    
    // 获取实际视频时长
    const realVideoDuration = actualVideoDuration || duration;
    
    // 关键检查：确保不超过视频实际时长
    if (newTime >= realVideoDuration) {
      console.log('游标拖拽超出视频实际时长，限制到最大值');
      newTime = Math.max(0, realVideoDuration - 0.1);
    } else if (newTime < 0) {
      // 限制为最小0
      newTime = 0;
    }
    
    // 更新时间
    onTimeChange(newTime);

    // 自动滚动处理
    const cursorPosition = calculateCursorPosition(newTime);
    const visibleWidth = rect.width;
    const leftEdge = scrollLeft + trackHeaderWidth + 20; // 左边界，加一点缓冲区
    const rightEdge = scrollLeft + visibleWidth - 20; // 右边界，减一点缓冲区

    // 如果游标接近或超出可视区域，自动滚动
    if (cursorPosition < leftEdge) {
      timelineElement.scrollLeft = Math.max(0, cursorPosition - trackHeaderWidth - 20);
    } else if (cursorPosition > rightEdge) {
      timelineElement.scrollLeft = cursorPosition - visibleWidth + 40;
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
    
    // 移除覆盖层
    const overlay = document.getElementById('cursor-drag-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  };

  // 更新光标位置 - 优化渲染性能
  useEffect(() => {
    // 计算光标位置
    const newPosition = calculateCursorPosition(currentTime);
    
    // 如果是重置到起点(currentTime=0)，特殊处理以确保立即更新而不是动画过渡
    if (currentTime === 0) {
      setCursorPosition(newPosition);
      // 移除播放状态样式
      if (cursorRef.current) {
        cursorRef.current.classList.remove('playing');
        const cursorLine = cursorRef.current.nextElementSibling;
        if (cursorLine) {
          cursorLine.classList.remove('playing');
        }
      }
    } else {
      // 播放状态下使用平滑过渡
      if (isPlaying) {
        const cursorElement = cursorRef.current;
        if (cursorElement) {
          cursorElement.classList.add('playing');
          const cursorLine = cursorElement.nextElementSibling;
          if (cursorLine) {
            cursorLine.classList.add('playing');
          }
        }
      } else {
        // 非播放状态下移除播放样式
        const cursorElement = cursorRef.current;
        if (cursorElement) {
          cursorElement.classList.remove('playing');
          const cursorLine = cursorElement.nextElementSibling;
          if (cursorLine) {
            cursorLine.classList.remove('playing');
          }
        }
      }
      setCursorPosition(newPosition);
    }
  }, [currentTime, calculateCursorPosition, isPlaying]);

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleCursorDrag);
      document.removeEventListener('mouseup', handleCursorDragEnd);
      
      // 移除覆盖层
      const overlay = document.getElementById('cursor-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };
  }, []);

  // 强制验证游标时间 - 确保不会超出视频时长范围
  useEffect(() => {
    const realVideoDuration = actualVideoDuration || duration;
    // 当currentTime大于视频时长时重置到起点
    if (currentTime >= realVideoDuration) {
      console.log(`时间超出视频实际范围：当前=${currentTime}，视频时长=${realVideoDuration}，重置到0`);
      onTimeChange(0);
    }
  }, [currentTime, duration, actualVideoDuration, onTimeChange]);

  return (
    <div className={`timeline-cursor ${isPlaying ? 'playing' : ''}`}>
      <div
        className={`timeline-cursor-indicator ${isPlaying ? 'playing' : ''} ${isDraggingRef.current ? 'dragging' : ''}`}
        style={{ 
          left: `${cursorPosition}px`,
          transform: 'translateZ(0) translateX(-50%)',
          willChange: 'left'
        }}
        onMouseDown={handleCursorMouseDown}
        ref={cursorRef}
        title={`当前时间: ${currentTime.toFixed(1)}秒`}  // 添加提示以增强用户体验
      />
      <div
        className={`timeline-cursor-line ${isPlaying ? 'playing' : ''}`}
        style={{ 
          left: `${cursorPosition}px`,
          transform: 'translateZ(0) translateX(-50%)',
          willChange: 'left'
        }}
        onMouseDown={handleCursorMouseDown}
      />
    </div>
  );
};

export default TimelineCursor;