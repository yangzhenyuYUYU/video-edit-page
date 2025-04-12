import React, { useRef, useEffect, useCallback } from 'react';
import { PlayCircleOutlined, CustomerServiceOutlined, AudioOutlined, FontSizeOutlined, SoundOutlined } from '@ant-design/icons';
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
  isCollapsed,
  isBeyondDuration
}) => {
  const itemRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originalStart: 0,
    mouseOffsetX: 0,
    currentTrackId: null,
    targetTrackId: null
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
    return parseFloat((pixels / (baseWidthPerSecond * zoom)).toFixed(1));
  }, [zoom]);

  // 将时间吸附到最近的0.1秒
  const snapToGrid = useCallback((time) => {
    return parseFloat((Math.round(time * 10) / 10).toFixed(1));
  }, []);

  // 检查轨道类型是否匹配
  const isTrackTypeMatching = useCallback((targetTrack) => {
    return targetTrack.getAttribute('data-track-type') === track.type;
  }, [track.type]);

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
      mouseOffsetX: e.clientX - rect.left,
      currentTrackId: track.id
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    // 添加拖拽时的样式
    document.body.style.cursor = 'grabbing';
    itemRef.current.classList.add('dragging');
    
    onDragStart?.(item.id);
  };

  // 处理拖拽中
  const handleDrag = (e) => {
    if (!dragRef.current.isDragging) return;
    
    const timelineElement = document.querySelector('.timeline');
    if (!timelineElement) return;
    
    const scrollLeft = timelineElement.scrollLeft;
    const rect = timelineElement.getBoundingClientRect();
    
    // 获取鼠标所在的轨道
    const tracks = document.querySelectorAll('.track');
    const mouseY = e.clientY;
    let targetTrack = null;
    let targetTrackId = dragRef.current.currentTrackId;
    
    // 创建克隆元素作为拖拽视觉效果（如果还没有创建）
    let dragClone = document.querySelector('.track-item-drag-clone');
    if (!dragClone && itemRef.current) {
      // 创建一个全新的div作为拖拽克隆元素，而不是克隆现有元素
      dragClone = document.createElement('div');
      dragClone.className = 'track-item-drag-clone';
      if (isSelected) {
        dragClone.classList.add('selected');
      }
      
      // 设置轨道类型样式类
      dragClone.classList.add(`type-${track.type}`);
      
      // 创建简化版内容容器
      const contentContainer = document.createElement('div');
      contentContainer.className = 'media-container';
      
      if (track.type === TRACK_TYPES.TEXT) {
        // 为文本类型添加特殊样式
        contentContainer.className += ' text-container';
        contentContainer.style.background = 'linear-gradient(135deg, #fff7e6, #ffe7ba)';
        
        // 只添加图标容器
        const iconContainer = document.createElement('div');
        iconContainer.className = 'text-icon';
        iconContainer.style.backgroundColor = '#fffffff2';
        iconContainer.style.width = '28px';
        iconContainer.style.height = '28px';
        iconContainer.style.borderRadius = '50%';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.color = '#fa8c16';
        iconContainer.style.boxShadow = '0 2px 6px rgba(250, 140, 22, 0.15)';
        
        // 使用简化的图标表示
        iconContainer.innerHTML = '<i style="font-size: 16px;" class="anticon anticon-font-size"></i>';
        contentContainer.appendChild(iconContainer);
      } else if (track.type === TRACK_TYPES.VIDEO || track.type === TRACK_TYPES.IMAGE || track.type === TRACK_TYPES.BACKGROUND) {
        try {
          // 尝试获取原始元素的背景图像
          const originalElement = itemRef.current.querySelector('.video-frames-container');
          if (originalElement) {
            const bgImage = window.getComputedStyle(originalElement).backgroundImage;
            contentContainer.style.backgroundImage = bgImage;
            contentContainer.style.backgroundSize = 'auto 100%';
            contentContainer.style.backgroundRepeat = 'repeat-x';
            contentContainer.style.backgroundPosition = 'center';
          } else {
            // 如果找不到原始元素，使用简单颜色
            contentContainer.style.backgroundColor = track.type === TRACK_TYPES.BACKGROUND ? 
              'rgba(111, 66, 193, 0.2)' : 'rgba(24, 144, 255, 0.2)';
          }
        } catch (e) {
          // 出错时使用简单颜色
          contentContainer.style.backgroundColor = track.type === TRACK_TYPES.BACKGROUND ? 
            'rgba(111, 66, 193, 0.2)' : 'rgba(24, 144, 255, 0.2)';
        }
        contentContainer.style.width = '100%';
        contentContainer.style.height = '100%';
        contentContainer.style.borderRadius = '4px';
      } else if (track.type === TRACK_TYPES.AUDIO || track.type === TRACK_TYPES.VOICE) {
        // 为音频添加渐变背景
        contentContainer.style.background = 'linear-gradient(90deg, #1890ff, #69c0ff)';
        contentContainer.style.borderLeft = '3px solid #1890ff';
        contentContainer.style.borderRadius = '4px';
        
        // 添加波形效果
        const waveformContainer = document.createElement('div');
        waveformContainer.className = 'audio-waveform';
        waveformContainer.style.position = 'absolute';
        waveformContainer.style.top = '0';
        waveformContainer.style.left = '0';
        waveformContainer.style.right = '0';
        waveformContainer.style.bottom = '0';
        waveformContainer.style.display = 'flex';
        waveformContainer.style.alignItems = 'center';
        waveformContainer.style.justifyContent = 'space-evenly';
        
        // 添加5个波形线
        for (let i = 0; i < 5; i++) {
          const line = document.createElement('div');
          line.className = 'waveform-line';
          line.style.width = '2px';
          line.style.height = ['40%', '60%', '80%', '60%', '40%'][i];
          line.style.backgroundColor = '#ffffff';
          line.style.opacity = '0.7';
          waveformContainer.appendChild(line);
        }
        
        contentContainer.appendChild(waveformContainer);
      }
      
      dragClone.appendChild(contentContainer);
      
      // 添加调整大小的手柄
      const leftHandle = document.createElement('div');
      leftHandle.className = 'resize-handle left';
      leftHandle.style.position = 'absolute';
      leftHandle.style.width = '6px';
      leftHandle.style.height = '100%';
      leftHandle.style.top = '0';
      leftHandle.style.left = '-2px';
      leftHandle.style.cursor = 'col-resize';
      leftHandle.style.backgroundColor = '#1890ff';
      leftHandle.style.opacity = '0';
      leftHandle.style.borderRadius = '3px 0 0 3px';
      
      const rightHandle = document.createElement('div');
      rightHandle.className = 'resize-handle right';
      rightHandle.style.position = 'absolute';
      rightHandle.style.width = '6px';
      rightHandle.style.height = '100%';
      rightHandle.style.top = '0';
      rightHandle.style.right = '-2px';
      rightHandle.style.cursor = 'col-resize';
      rightHandle.style.backgroundColor = '#1890ff';
      rightHandle.style.opacity = '0';
      rightHandle.style.borderRadius = '0 3px 3px 0';
      
      dragClone.appendChild(leftHandle);
      dragClone.appendChild(rightHandle);
      
      // 设置克隆元素的样式
      dragClone.style.position = 'absolute';
      dragClone.style.zIndex = '9999';
      dragClone.style.pointerEvents = 'none';
      dragClone.style.opacity = '0.85';
      dragClone.style.width = `${itemRef.current.offsetWidth}px`;
      dragClone.style.height = `${itemRef.current.offsetHeight}px`;
      dragClone.style.backgroundColor = '#ffffff';
      dragClone.style.border = isSelected ? '2px solid #1890ff' : '1px solid rgba(0, 0, 0, 0.1)';
      dragClone.style.borderRadius = '4px';
      dragClone.style.boxShadow = isSelected ? 
        '0 0 0 4px rgba(24, 144, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)' : 
        '0 4px 12px rgba(0, 0, 0, 0.15)';
      dragClone.style.overflow = 'hidden';
      
      document.body.appendChild(dragClone);
    }
    
    // 遍历所有轨道，检查鼠标是否在某个轨道内
    tracks.forEach(trackElement => {
      const trackRect = trackElement.getBoundingClientRect();
      if (mouseY >= trackRect.top && mouseY <= trackRect.bottom) {
        if (isTrackTypeMatching(trackElement)) {
          targetTrack = trackElement;
          targetTrackId = trackElement.getAttribute('data-track-id');
          // 可视化显示当前目标轨道
          trackElement.classList.add('drag-target');
        } else {
          // 可视化显示无效轨道
          trackElement.classList.add('drag-target-invalid');
        }
      } else {
        // 移除非当前轨道的样式
        trackElement.classList.remove('drag-target');
        trackElement.classList.remove('drag-target-invalid');
      }
    });
    
    // 计算新的开始时间
    const mouseX = e.clientX - rect.left + scrollLeft;
    const offsetX = mouseX - dragRef.current.mouseOffsetX - trackHeaderWidth;
    const newStartTime = snapToGrid(pixelsToTime(offsetX));
    
    // 确保元素不会超出视频时长
    const maxStart = Math.max(0, duration - item.duration);
    
    // 如果尝试拖到超出视频时长的位置，直接固定在视频时长边界
    const clampedStart = Math.max(0, Math.min(newStartTime, maxStart));
    
    // 更新克隆元素位置
    if (dragClone) {
      const newLeft = rect.left + timeToPixels(clampedStart) + trackHeaderWidth - scrollLeft;
      dragClone.style.left = `${newLeft}px`;
      
      if (targetTrack) {
        const targetRect = targetTrack.getBoundingClientRect();
        dragClone.style.top = `${targetRect.top + targetRect.height / 2 - dragClone.offsetHeight / 2}px`;
      }
    }
    
    // 只在拖动过程中更新位置，但保留在原轨道，直到释放鼠标
    // 注意：此处不调用onDrag来实际移动项目，而是仅作为视觉预览
    if (targetTrackId !== dragRef.current.currentTrackId) {
      // 只是保存目标轨道ID，但不实际移动
      dragRef.current.targetTrackId = targetTrackId;
    } else {
      // 在原轨道内拖动时，可以更新位置
      onDrag?.(item.id, clampedStart, targetTrackId);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    // 移除所有轨道的拖拽相关样式
    document.querySelectorAll('.track').forEach(track => {
      track.classList.remove('drag-target');
      track.classList.remove('drag-target-invalid');
    });
    
    // 计算最终位置
    const timelineElement = document.querySelector('.timeline');
    if (timelineElement && dragRef.current.isDragging) {
      // 如果有目标轨道且不是当前轨道，则执行轨道切换
      if (dragRef.current.targetTrackId && dragRef.current.targetTrackId !== dragRef.current.currentTrackId) {
        // 获取鼠标位置
        const scrollLeft = timelineElement.scrollLeft;
        const rect = timelineElement.getBoundingClientRect();
        const dragClone = document.querySelector('.track-item-drag-clone');
        
        if (dragClone) {
          // 根据克隆元素位置计算最终时间
          const offsetX = dragClone.offsetLeft - rect.left + scrollLeft - trackHeaderWidth;
          const finalTime = snapToGrid(pixelsToTime(offsetX));
          const maxStart = Math.max(0, duration - item.duration);
          const clampedStart = Math.max(0, Math.min(finalTime, maxStart));
          
          // 只有在松开鼠标时才实际执行轨道切换操作
          onDrag?.(item.id, clampedStart, dragRef.current.targetTrackId);
        }
      }
    }
    
    // 移除克隆元素
    const dragClone = document.querySelector('.track-item-drag-clone');
    if (dragClone) {
      dragClone.parentNode.removeChild(dragClone);
    }
    
    dragRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    document.body.style.cursor = '';
    if (itemRef.current) {
      itemRef.current.classList.remove('dragging');
    }
    
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
      // 确保不会调整到小于0的位置
      const maxStart = resizeRef.current.originalStart + resizeRef.current.originalDuration - 0.1;
      newStart = parseFloat(Math.max(0, Math.min(potentialNewStart, maxStart)).toFixed(1));
      newDuration = parseFloat((resizeRef.current.originalDuration - (newStart - resizeRef.current.originalStart)).toFixed(1));
    } else {
      const potentialNewDuration = snapToGrid(resizeRef.current.originalDuration + deltaTime);
      // 确保元素不会延伸超过视频总时长
      const maxDuration = duration - newStart;
      newDuration = parseFloat(Math.max(0.1, Math.min(potentialNewDuration, maxDuration)).toFixed(1));
      
      // 额外检查：确保结束位置不会超过视频时长
      if (newStart + newDuration > duration) {
        newDuration = parseFloat((duration - newStart).toFixed(1));
      }
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
      case TRACK_TYPES.BACKGROUND:
        return (
          <div className={`media-container ${track.type === TRACK_TYPES.BACKGROUND ? 'bg-media-container' : ''}`}>
            <div 
              className={`video-frames-container ${track.type === TRACK_TYPES.BACKGROUND ? 'bg-frames-container' : ''}`}
              style={{
                backgroundImage: `url(${item.cover || item.src || 'https://picsum.photos/300/200'})`,
                backgroundSize: 'auto 100%',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'center',
                ...(track.type === TRACK_TYPES.BACKGROUND ? {
                  borderLeft: '3px solid #6f42c1', // 背景轨道项目添加紫色边框标识
                  opacity: 0.85 // 略微降低背景不透明度以区分
                } : {})
              }}
            >
              {track.type === TRACK_TYPES.BACKGROUND && (
                <div style={{ 
                  position: 'absolute', 
                  top: '2px', 
                  left: '4px', 
                  padding: '1px 4px',
                  fontSize: '9px',
                  color: '#6f42c1',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '2px'
                }}>
                  背景
                </div>
              )}
            </div>
          </div>
        );
      
      case TRACK_TYPES.VOICE:
        return (
          <div className="media-container audio-container">
            <div className="audio-icon">
              <CustomerServiceOutlined />
            </div>
            <div className="audio-info">
              <div className="audio-name">{item.content}</div>
              <div className="audio-duration">{item.duration.toFixed(1)}s</div>
            </div>
          </div>
        );

      case TRACK_TYPES.AUDIO:
        return (
          <div className="media-container audio-container">
            <div className="audio-icon">
              <CustomerServiceOutlined />
            </div>
            <div className="audio-info">
              <div className="audio-name">{item.content}</div>
              <div className="audio-duration">{item.duration.toFixed(1)}s</div>
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

  // 处理点击选择
  const handleSelect = (e) => {
    e.stopPropagation();
    
    console.log('轨道项目被点击选择:', item);
    
    // 传递完整的item对象，包含trackId和type信息
    const enhancedItem = {
      ...item,
      trackId: track.id,
      type: track.type
    };
    onSelect?.(enhancedItem);
  };

  return (
    <div
      ref={itemRef}
      className={`track-item ${track.type} ${isSelected ? 'selected' : ''} ${isBeyondDuration ? 'beyond-duration' : ''} ${item.isHuman ? 'human' : ''} type-${track.type} ${dragRef.current.isDragging ? 'dragging' : ''} ${resizeRef.current.isResizing ? 'resizing' : ''} ${track.type === TRACK_TYPES.BACKGROUND ? 'bg-track-item' : ''}`}
      style={{
        left: `${timeToPixels(item.start)}px`,
        width: `${timeToPixels(item.duration)}px`
      }}
      data-item-id={item.id}
      onClick={handleSelect}
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