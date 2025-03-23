import React, { useState, useRef, useEffect } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, VideoCameraOutlined, AudioOutlined, PictureOutlined, FontSizeOutlined, CustomerServiceOutlined, PlusOutlined, MinusOutlined, UpOutlined, DownOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './index.scss';
import { TRACK_TYPES } from '../constants';

const TrackEditor = ({
  initialTracks,
  onTrackChange,
  onCursorChange,
  onItemSelect,
  videoDuration = 10,
  isCollapsed = false,
  onCollapsedChange,
  selectedVideoId,
  onSelectedVideoIdChange,
  onDeleteItem
}) => {
  // 确保在不同的视频区域拥有各自独立的轨道数据
  const [tracks, setTracks] = useState(() => {
    // 始终使用传入的 initialTracks，因为这应该是父组件为当前区域准备的特定轨道数据
    if (initialTracks && initialTracks.length > 0) {
      // 通过深拷贝确保数据的完全独立，避免引用相同对象
      return JSON.parse(JSON.stringify(initialTracks));
    }
    
    // 如果没有初始轨道数据，创建一个新的空轨道
    return [
      {
        id: `track-${Date.now()}`, // 使用时间戳确保 ID 的唯一性
        type: TRACK_TYPES.VIDEO,
        name: '视频轨道',
        items: []
      }
    ];
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [collisionWarning, setCollisionWarning] = useState([]);
  const [dragGhost, setDragGhost] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [videoFrames, setVideoFrames] = useState({});
  const [audioWaveforms, setAudioWaveforms] = useState({});
  const [dragOffset, setDragOffset] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const timelineRef = useRef(null);
  const cursorRef = useRef(null);
  const dragTrackRef = useRef(null);
  const dragItemRef = useRef(null);
  const isDraggingRef = useRef(false);
  const ghostRef = useRef(null);
  const videoRefs = useRef({});
  const cursorPositionRef = useRef({ time: 0, isDragging: false, pixelPosition: 0 }); // 新增：用于跟踪游标位置和拖拽状态

  // 修改游标拖拽开始处理函数
  const handleCursorMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    cursorPositionRef.current.isDragging = true;
    
    // 立即更新游标位置到鼠标位置
    handleCursorDrag(e);
    
    document.addEventListener('mousemove', handleCursorDrag);
    document.addEventListener('mouseup', handleCursorDragEnd);
  };

  const handleCursorDrag = (e) => {
    if (!timelineRef.current) return;
    if (!isDraggingRef.current && e.type !== 'mousedown') return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const trackHeaderWidth = 36;
    const scrollLeft = timelineRef.current.scrollLeft;
    const rulerWidth = timelineRef.current.querySelector('.timeline-ruler').offsetWidth;
    const effectiveWidth = rulerWidth - trackHeaderWidth;
    
    // 获取鼠标相对于时间轴左边界的位置（考虑滚动）
    const mouseX = e.clientX - timelineRect.left + scrollLeft;
    
    // 计算鼠标相对于有效时间区域的位置
    const relativeX = mouseX - trackHeaderWidth;
    
    // 获取当前总时长
    const duration = getDuration();
    
    // 计算每像素对应的时间（考虑缩放）
    const timePerPixel = duration / effectiveWidth;
    
    // 计算时间点
    const time = relativeX * timePerPixel;
    
    // 确保时间在有效范围内
    const clampedTime = Math.max(0, Math.min(Math.round(time * 10) / 10, duration));
    
    // 更新游标位置
    cursorPositionRef.current = {
      time: clampedTime,
      isDragging: true
    };

    // 触发游标位置变化回调
    onCursorChange?.(clampedTime);
  };

  // 更新游标位置计算方法
  const calculateCursorPosition = (time) => {
    if (!timelineRef.current) return 0;
    
    const trackHeaderWidth = 36;
    const rulerWidth = timelineRef.current.querySelector('.timeline-ruler').offsetWidth;
    const effectiveWidth = rulerWidth - trackHeaderWidth;
    const duration = getDuration();
    
    // 计算像素位置（不考虑缩放）
    return trackHeaderWidth + (time / duration) * effectiveWidth;
  };

  // 渲染游标
  const renderCursor = () => {
    const { time } = cursorPositionRef.current;
    const cursorPosition = calculateCursorPosition(time);

    return (
      <>
        <div
          className="cursor-indicator"
          style={{ left: cursorPosition }}
          onMouseDown={handleCursorMouseDown}
        />
        <div
          className="cursor-line"
          style={{ left: cursorPosition }}
          onMouseDown={handleCursorMouseDown}
        />
      </>
    );
  };

  const handleCursorDragEnd = () => {
    isDraggingRef.current = false;
    cursorPositionRef.current.isDragging = false; // 标记拖拽结束
    document.removeEventListener('mousemove', handleCursorDrag);
    document.removeEventListener('mouseup', handleCursorDragEnd);
    
    // 获取最后的拖拽位置
    const finalTime = cursorPositionRef.current.time;
    const finalPixelPosition = cursorPositionRef.current.pixelPosition;
    
    // 移除临时游标元素
    const tempIndicator = timelineRef.current?.querySelector('.temp-cursor-indicator');
    const tempLine = timelineRef.current?.querySelector('.temp-cursor-line');
    
    if (tempIndicator && tempIndicator.parentNode) {
      tempIndicator.parentNode.removeChild(tempIndicator);
    }
    
    if (tempLine && tempLine.parentNode) {
      tempLine.parentNode.removeChild(tempLine);
    }
    
    // 显示并更新原始游标位置
    const cursorIndicator = timelineRef.current?.querySelector('.cursor-indicator:not(.temp-cursor-indicator)');
    const cursorLine = timelineRef.current?.querySelector('.cursor-line:not(.temp-cursor-line)');
    
    if (cursorIndicator && cursorLine && timelineRef.current) {
      cursorIndicator.classList.remove('dragging');
      cursorLine.classList.remove('dragging');
      
      // 直接使用最后的拖拽位置
      cursorIndicator.style.left = `${finalPixelPosition}px`;
      cursorLine.style.left = `${finalPixelPosition}px`;
      
      // 确保游标线高度覆盖整个时间轴高度
      cursorLine.style.height = `${timelineRef.current.scrollHeight}px`;
    }
    
    // 更新状态
    setCurrentTime(finalTime);
    onCursorChange?.(finalTime);
  };

  // 处理时间轴点击
  const handleTimelineClick = (e) => {
    // 阻止事件冒泡
    e.stopPropagation();
    
    // 如果点击的是轨道项目或其他控制元素，不处理
    if (e.target.closest('.track-item') || 
        e.target.closest('.track-header') ||
        e.target.closest('.resize-handle')) {
      return;
    }
    
    if (!timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const trackHeaderWidth = 36; // 轨道头部宽度
    const scrollLeft = timelineRef.current.scrollLeft;
    const rulerWidth = timelineRef.current.querySelector('.timeline-ruler').offsetWidth;
    
    // 计算有效时间轴区域（不包括轨道头部）的宽度
    const effectiveWidth = rulerWidth - trackHeaderWidth;
    
    // 获取鼠标相对于时间轴左边界的位置（考虑滚动）
    const mouseX = e.clientX - timelineRect.left + scrollLeft;
    
    // 计算鼠标相对于有效时间区域的位置
    const relativeX = mouseX - trackHeaderWidth;
    
    // 如果点击在轨道头部区域，将位置设为0
    if (relativeX < 0) {
      setCurrentTime(0);
      onCursorChange?.(0);
      return;
    }
    
    // 获取当前总时长
    const duration = getDuration();
    
    // 计算每像素对应的时间（考虑缩放）
    const timePerPixel = duration / (effectiveWidth * zoom);
    
    // 计算时间点
    const time = relativeX * timePerPixel;
    
    // 确保时间在有效范围内（0到视频时长）
    const clampedTime = Math.max(0, Math.min(Math.round(time * 10) / 10, duration));
    
    // 反向计算准确的像素位置
    const pixelPosition = (clampedTime / duration) * effectiveWidth * zoom + trackHeaderWidth;
    
    // 获取游标元素
    const cursorIndicator = timelineRef.current.querySelector('.cursor-indicator');
    const cursorLine = timelineRef.current.querySelector('.cursor-line');
    
    if (cursorIndicator && cursorLine) {
      requestAnimationFrame(() => {
        // 立即显示游标
        cursorIndicator.style.display = 'block';
        cursorLine.style.display = 'block';
        
        // 设置游标位置（考虑滚动位置）
        const adjustedPosition = pixelPosition - scrollLeft;
        cursorIndicator.style.left = `${adjustedPosition}px`;
        cursorLine.style.left = `${adjustedPosition}px`;
        cursorLine.style.height = `${timelineRef.current.scrollHeight}px`;
        
        // 确保transform样式正确
        cursorIndicator.style.transform = 'translateX(-50%)';
        cursorLine.style.transform = 'translateX(-50%)';
      });
    }
    
    // 更新保存的游标位置
    cursorPositionRef.current = {
      time: clampedTime,
      isDragging: false,
      pixelPosition: pixelPosition
    };
    
    // 更新状态
    setCurrentTime(clampedTime);
    onCursorChange?.(clampedTime);
  };

  // 处理缩放
  const handleZoomIn = () => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.1, 2);
      // 缩放时保持游标位置
      updateCursorPositionAfterZoom(newZoom);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.1, 0.5);
      // 缩放时保持游标位置
      updateCursorPositionAfterZoom(newZoom);
      return newZoom;
    });
  };

  // 缩放后更新游标位置
  const updateCursorPositionAfterZoom = (newZoom) => {
    // 在下一个渲染周期执行，确保DOM已更新
    requestAnimationFrame(() => {
      if (!timelineRef.current) return;
      
      // 使用当前时间计算新的像素位置
      const pixelPosition = calculateCursorPosition(currentTime);
      
      // 获取游标元素
      const cursorIndicator = timelineRef.current.querySelector('.cursor-indicator');
      const cursorLine = timelineRef.current.querySelector('.cursor-line');
      
      if (cursorIndicator && cursorLine) {
        // 考虑滚动位置
        const scrollLeft = timelineRef.current.scrollLeft;
        const adjustedPosition = pixelPosition;
        
        // 更新游标位置
        cursorIndicator.style.left = `${adjustedPosition}px`;
        cursorLine.style.left = `${adjustedPosition}px`;
        cursorLine.style.height = `${timelineRef.current.scrollHeight}px`;
        
        // 更新保存的像素位置
        cursorPositionRef.current = {
          ...cursorPositionRef.current,
          pixelPosition: pixelPosition
        };
      }
    });
  };

  // 处理轨道拖拽排序
  const handleTrackDragStart = (e, trackId) => {
    dragTrackRef.current = trackId;
    e.currentTarget.classList.add('dragging');
  };

  const handleTrackDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    dragTrackRef.current = null;
    const tracks = document.querySelectorAll('.track');
    tracks.forEach(track => track.classList.remove('drag-over'));
  };

  const handleTrackDragOver = (e) => {
    e.preventDefault();
    const track = e.currentTarget;
    if (!track.classList.contains('drag-over')) {
      track.classList.add('drag-over');
    }
  };

  const handleTrackDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleTrackDrop = (e, targetTrackId) => {
    e.preventDefault();
    if (!dragTrackRef.current || dragTrackRef.current === targetTrackId) return;

    const newTracks = [...tracks];
    const sourceIndex = tracks.findIndex(t => t.id === dragTrackRef.current);
    const targetIndex = tracks.findIndex(t => t.id === targetTrackId);

    const [movedTrack] = newTracks.splice(sourceIndex, 1);
    newTracks.splice(targetIndex, 0, movedTrack);

    setTracks(newTracks);
    onTrackChange?.(newTracks);
  };

  // 检查碰撞
  const checkCollision = (trackId, itemId, newStart, newDuration) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return { hasCollision: false, collidingItemIds: [] };
    
    const newEnd = newStart + newDuration;
    const collidingItemIds = [];
    
    // 检查是否与同一轨道上的其他片段重叠
    const hasCollision = track.items.some(item => {
      // 跳过自己
      if (item.id === itemId) return false;
      
      const itemEnd = item.start + item.duration;
      
      // 检查是否有重叠
      // 两个区间有重叠的条件：一个区间的开始小于另一个区间的结束，且该区间的结束大于另一个区间的开始
      const isColliding = (newStart < itemEnd && newEnd > item.start);
      
      if (isColliding) {
        collidingItemIds.push(item.id);
      }
      
      return isColliding;
    });
    
    return { hasCollision, collidingItemIds };
  };

  // 处理片段拖拽
  const handleItemDragStart = (e, trackId, itemId) => {
    e.stopPropagation();
    e.preventDefault();
    setCollisionWarning([]);
    
    const track = tracks.find(t => t.id === trackId);
    const item = track?.items.find(i => i.id === itemId);
    if (item) {
      const itemElement = e.currentTarget;
      const itemRect = itemElement.getBoundingClientRect();
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const trackHeaderWidth = 36;
      const scrollLeft = timelineRef.current.scrollLeft;
      
      // 计算鼠标点击位置相对于卡片的偏移量
      const mouseOffsetX = e.clientX - itemRect.left;
      const mouseOffsetY = e.clientY - itemRect.top;
      
      // 计算每一像素代表的时间长度(不考虑缩放)
      const effectiveWidth = (timelineRect.width - trackHeaderWidth);
      const duration = getDuration();
      const pixelsPerSecond = effectiveWidth / duration;
      
      // 保存不随缩放变化的时间偏移量
      const timeOffsetX = mouseOffsetX / pixelsPerSecond;
      
      // 保存初始状态
      dragItemRef.current = { 
        trackId, 
        itemId, 
        initialStart: item.start,
        initialTrackId: trackId,
        trackType: track.type,
        initialMouseX: e.clientX,
        initialMouseY: e.clientY,
        initialItemLeft: itemRect.left - timelineRect.left,
        initialItemTop: itemRect.top - timelineRect.top,
        mouseOffsetX, // 保存鼠标相对于卡片的X偏移(像素)
        mouseOffsetY, // 保存鼠标相对于卡片的Y偏移
        timeOffsetX, // 保存时间偏移量(秒)
        mouseY: e.clientY,
        duration: item.duration,
        content: item.content,
        src: item.src,
        trackHeaderWidth,
        scrollLeft,
        originalTrackIndex: tracks.findIndex(t => t.id === trackId) // 记录原始轨道索引
      };
      
      // 添加拖拽样式
      document.body.classList.add('dragging-track-item');
      itemElement.classList.add('dragging');
      
      // 添加拖拽开始时的视觉反馈
      const trackElements = document.querySelectorAll('.track');
      trackElements.forEach(trackElement => {
        const trackId = trackElement.getAttribute('data-track-id');
        const trackData = tracks.find(t => t.id === trackId);
        if (trackData && trackData.type === track.type) {
          trackElement.classList.add('drag-target');
        } else {
          trackElement.classList.add('drag-target-invalid');
        }
      });
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
  // 鼠标移动处理函数
  const handleMouseMove = (e) => {
    if (!dragItemRef.current || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const currentScrollLeft = timelineRef.current.scrollLeft;
    const duration = getDuration();
    
    // 计算鼠标移动的距离
    const mouseDeltaX = e.clientX - dragItemRef.current.initialMouseX;
    const mouseDeltaY = e.clientY - dragItemRef.current.initialMouseY;
    
    // 计算滚动偏移
    const scrollDelta = currentScrollLeft - dragItemRef.current.scrollLeft;
    
    // 设置拖拽偏移，考虑鼠标在卡片上的初始位置
    setDragOffset({
      x: mouseDeltaX + scrollDelta,
      y: mouseDeltaY
    });
    
    // 计算每一像素代表的时间长度 - 不考虑缩放以保持一致性
    const trackHeaderWidth = dragItemRef.current.trackHeaderWidth;
    const effectiveWidth = (timelineRect.width - trackHeaderWidth);
    const pixelsPerSecond = effectiveWidth / duration;
    
    // 计算鼠标移动的时间偏移量
    const timeOffset = (mouseDeltaX + scrollDelta) / pixelsPerSecond;
    
    // 基于原始起始时间和时间偏移计算新的起始时间
    const newStart = dragItemRef.current.initialStart + timeOffset;
    
    // 确保不会超出时间轴范围
    const clampedStart = Math.max(0, Math.min(
      Math.round(newStart * 10) / 10,
      duration - dragItemRef.current.duration
    ));
    
    // 查找鼠标下方的轨道
    let targetTrackId = null;
    let targetTrackIndex = -1;
    const trackElements = document.querySelectorAll('.track');
    
    // 清除所有轨道的高亮状态
    trackElements.forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // 查找鼠标下方的轨道
    for (let i = 0; i < trackElements.length; i++) {
      const trackElement = trackElements[i];
      const trackRect = trackElement.getBoundingClientRect();
      if (
        e.clientY >= trackRect.top &&
        e.clientY <= trackRect.bottom
      ) {
        const trackId = trackElement.getAttribute('data-track-id');
        const trackData = tracks.find(t => t.id === trackId);
        
        if (trackData && trackData.type === dragItemRef.current.trackType) {
          targetTrackId = trackId;
          targetTrackIndex = i;
          trackElement.classList.add('drag-over');
          break;
        }
      }
    }
    
    // 如果没有找到有效的目标轨道，使用原始轨道
    if (!targetTrackId) {
      targetTrackId = dragItemRef.current.initialTrackId;
      targetTrackIndex = dragItemRef.current.originalTrackIndex;
      const originalTrackElement = document.querySelector(`[data-track-id="${targetTrackId}"]`);
      if (originalTrackElement) {
        originalTrackElement.classList.add('drag-over');
      }
    }
    
    // 检查碰撞
    const { hasCollision, collidingItemIds } = checkCollision(
      targetTrackId,
      dragItemRef.current.itemId,
      clampedStart,
      dragItemRef.current.duration
    );
    
    setCollisionWarning(hasCollision ? [...collidingItemIds, dragItemRef.current.itemId] : []);
    
    // 如果有碰撞，不进行操作
    if (hasCollision) {
      return;
    }
    
    // 创建新的轨道数组
    let newTracks = [...tracks];
    
    // 如果目标轨道不是原始轨道，并且轨道索引不同，处理轨道顺序交换
    const sourceTrackIndex = dragItemRef.current.originalTrackIndex;
    
    if (targetTrackIndex !== sourceTrackIndex && 
        targetTrackId !== dragItemRef.current.initialTrackId) {
      // 准备交换轨道位置 - 这影响渲染层级
      // 记录当前两个轨道
      const sourceTrack = newTracks[sourceTrackIndex];
      const targetTrack = newTracks[targetTrackIndex];
      
      // 如果源轨道和目标轨道类型相同，允许交换位置
      if (sourceTrack.type === targetTrack.type) {
        // 移除源轨道
        newTracks.splice(sourceTrackIndex, 1);
        
        // 在目标位置插入源轨道
        newTracks.splice(targetTrackIndex, 0, sourceTrack);
        
        // 更新dragItemRef中的原始轨道索引，以便下次移动时参考
        dragItemRef.current.originalTrackIndex = targetTrackIndex;
      }
    }
    
    // 更新轨道项目位置
    newTracks = newTracks.map(track => {
      // 首先从所有轨道中移除该项目（确保不会有重复）
      const filteredItems = track.items.filter(item => item.id !== dragItemRef.current.itemId);
      
      // 始终移除该项目
      if (track.id === targetTrackId) {
        // 仅在这是目标轨道时添加该项目
        const originalTrack = tracks.find(t => 
          t.items.some(item => item.id === dragItemRef.current.itemId)
        );
        
        if (originalTrack) {
          const originalItem = originalTrack.items.find(item => 
            item.id === dragItemRef.current.itemId
          );
          
          return {
            ...track,
            items: [
              ...filteredItems,
              {
                ...originalItem,
                start: clampedStart
              }
            ]
          };
        }
      }
      
      return {
        ...track,
        items: filteredItems
      };
    });
    
    // 更新轨道状态
    setTracks(newTracks);
    onTrackChange?.(newTracks);
    
    // 记录当前处理过的轨道作为初始轨道，以便下一次移动参考
    dragItemRef.current.initialTrackId = targetTrackId;
  };

  // 处理鼠标释放
  const handleMouseUp = (e) => {
    // 移除事件监听器
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 重置拖拽状态
    setDragOffset(null);
    
    // 调用原来的拖拽结束处理函数
    if (dragItemRef.current) {
      handleItemDragEnd(e);
    }
  };

  const handleItemDragEnd = (e) => {
    if (!dragItemRef.current) return;
    
    document.body.classList.remove('dragging-track-item');
    
    // 清除所有轨道的高亮状态
    const trackElements = document.querySelectorAll('.track');
    trackElements.forEach(el => {
      el.classList.remove('drag-over');
      el.classList.remove('drag-target');
      el.classList.remove('drag-target-invalid');
    });

    // 获取目标轨道和位置
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const currentScrollLeft = timelineRef.current.scrollLeft;
    const duration = getDuration();
    
    // 计算鼠标移动的距离
    const mouseDeltaX = e.clientX - dragItemRef.current.initialMouseX;
    const scrollDelta = currentScrollLeft - dragItemRef.current.scrollLeft;
    
    // 计算每一像素代表的时间长度 - 不考虑缩放以保持一致性
    const trackHeaderWidth = dragItemRef.current.trackHeaderWidth;
    const effectiveWidth = (timelineRect.width - trackHeaderWidth);
    const pixelsPerSecond = effectiveWidth / duration;
    
    // 计算鼠标移动的时间偏移量
    const timeOffset = (mouseDeltaX + scrollDelta) / pixelsPerSecond;
    
    // 基于原始起始时间和时间偏移计算新的起始时间
    const newStart = dragItemRef.current.initialStart + timeOffset;
    
    // 确保不会超出时间轴范围
    const clampedStart = Math.max(0, Math.min(
      Math.round(newStart * 10) / 10,
      duration - dragItemRef.current.duration
    ));

    // 查找鼠标下方的轨道
    let targetTrackId = null;
    for (const trackElement of document.querySelectorAll('.track')) {
      const trackRect = trackElement.getBoundingClientRect();
      if (
        e.clientY >= trackRect.top &&
        e.clientY <= trackRect.bottom
      ) {
        targetTrackId = trackElement.getAttribute('data-track-id');
        const trackData = tracks.find(t => t.id === targetTrackId);
        // 确保目标轨道类型与源轨道类型匹配
        if (trackData && trackData.type === dragItemRef.current.trackType) {
          break;
        } else {
          targetTrackId = null; // 如果类型不匹配，重置为null
        }
      }
    }

    // 如果没有找到有效的目标轨道，使用原始轨道
    if (!targetTrackId) {
      targetTrackId = dragItemRef.current.initialTrackId;
    }

    // 检查是否与目标轨道上的其他片段碰撞
    const { hasCollision } = checkCollision(
      targetTrackId, 
      dragItemRef.current.itemId, 
      clampedStart, 
      dragItemRef.current.duration
    );
    
    // 如果没有碰撞，更新轨道数据
    if (!hasCollision) {
      // 找到原始项目所在的轨道和项目数据
      const originalTrack = tracks.find(track => 
        track.items.some(item => item.id === dragItemRef.current.itemId)
      );
      const originalItem = originalTrack?.items.find(item => 
        item.id === dragItemRef.current.itemId
      );
      
      if (!originalTrack || !originalItem) {
        console.error('原始项目未找到');
        dragItemRef.current = null;
        setDragOffset(null);
        setCollisionWarning([]);
        return;
      }
      
      // 更新轨道，从所有轨道中移除该项目，然后只在目标轨道添加
      const newTracks = tracks.map(track => {
        // 从所有轨道中移除该项目
        const filteredItems = track.items.filter(item => 
          item.id !== dragItemRef.current.itemId
        );
        
        // 只在目标轨道添加该项目
        if (track.id === targetTrackId) {
          return {
            ...track,
            items: [
              ...filteredItems,
              {
                ...originalItem,
                start: clampedStart
              }
            ]
          };
        }
        
        return {
          ...track,
          items: filteredItems
        };
      });
      
      // 移除空轨道，但保留至少一个视频轨道
      const filteredTracks = newTracks.filter(track => {
        // 视频轨道始终保留
        if (track.type === TRACK_TYPES.VIDEO) return true;
        // 其他轨道，如果没有项目就过滤掉
        return track.items.length > 0;
      });
      
      setTracks(filteredTracks);
      onTrackChange?.(filteredTracks);
    } else {
      // 如果有碰撞，恢复到原始位置
      // 从所有轨道中移除该项目，然后在原始轨道添加
      const originalTrack = tracks.find(track => 
        track.items.some(item => item.id === dragItemRef.current.itemId)
      );
      const originalItem = originalTrack?.items.find(item => 
        item.id === dragItemRef.current.itemId
      );
      
      if (originalTrack && originalItem) {
        const newTracks = tracks.map(track => {
          // 从所有轨道中移除该项目
          const filteredItems = track.items.filter(item => 
            item.id !== dragItemRef.current.itemId
          );
          
          // 只在原始轨道添加该项目
          if (track.id === originalTrack.id) {
            return {
              ...track,
              items: [
                ...filteredItems,
                originalItem // 使用原始位置还原项目
              ]
            };
          }
          
          return {
            ...track,
            items: filteredItems
          };
        });
        
        setTracks(newTracks);
        onTrackChange?.(newTracks);
      }
    }
    
    // 处理选中项目
    const selectedTrack = tracks.find(t => t.id === targetTrackId);
    const selectedItem = selectedTrack?.items.find(i => i.id === dragItemRef.current.itemId);
    if (selectedItem) {
      handleItemClick(targetTrackId, dragItemRef.current.itemId);
    }
    
    dragItemRef.current = null;
    setDragOffset(null);
    setCollisionWarning([]);
  };

  // 处理片段缩放
  const handleItemResizeStart = (e, direction, trackId, itemId) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setCollisionWarning([]);
    
    const track = tracks.find(t => t.id === trackId);
    const item = track?.items.find(i => i.id === itemId);
    
    if (item) {
      const itemElement = e.currentTarget.closest('.track-item');
      const itemRect = itemElement.getBoundingClientRect();
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const trackHeaderWidth = 36;
      const scrollLeft = timelineRef.current.scrollLeft;
      
      // 计算时间轴中项目的位置信息
      const totalWidth = (timelineRect.width - trackHeaderWidth) * zoom;
      const duration = getDuration();
      const pixelsPerSecond = totalWidth / duration;
      
      // 计算相关位置信息
      const itemLeftPx = (item.start * pixelsPerSecond * zoom) + trackHeaderWidth;
      const itemWidthPx = item.duration * pixelsPerSecond * zoom;
      const itemRightPx = itemLeftPx + itemWidthPx;
      
      // 计算鼠标在手柄上的相对位置
      const mouseOffsetInHandle = direction === 'left'
        ? e.clientX - itemRect.left  // 鼠标在左手柄的位置
        : itemRect.right - e.clientX; // 鼠标在右手柄的位置
      
      dragItemRef.current = { 
        trackId, 
        itemId,
        initialStart: item.start,
        initialDuration: item.duration,
        initialEnd: item.start + item.duration, // 保存初始结束位置
        direction,
        initialMouseX: e.clientX,
        mouseOffsetInHandle, // 保存鼠标在手柄上的相对位置
        timelineLeft: timelineRect.left,
        trackHeaderWidth,
        scrollLeft,
        pixelsPerSecond,
        itemLeftPx,
        itemWidthPx,
        itemRightPx
      };
      
      document.addEventListener('mousemove', handleItemResize);
      document.addEventListener('mouseup', handleItemResizeEnd);
      
      // 添加调整大小时的视觉反馈
      itemElement.classList.add('resizing');
      itemElement.classList.add(`resizing-${direction}`);
    }
  };

  const handleItemResize = (e) => {
    if (!isResizing || !dragItemRef.current || !timelineRef.current) return;

    const currentScrollLeft = timelineRef.current.scrollLeft;
    const scrollDelta = currentScrollLeft - dragItemRef.current.scrollLeft;
    const duration = getDuration();
    
    // 计算当前鼠标位置
    const mouseX = e.clientX;
    
    // 计算鼠标位置对应的时间点
    // 需要减去鼠标在手柄上的偏移，这样拖动时手柄的中心会跟随鼠标
    const mousePositionWithOffset = mouseX - dragItemRef.current.timelineLeft - dragItemRef.current.trackHeaderWidth + scrollDelta;
    const mouseTimePosition = mousePositionWithOffset / dragItemRef.current.pixelsPerSecond / zoom;
    
    requestAnimationFrame(() => {
      const { initialStart, initialDuration, initialEnd, direction, trackId, itemId, mouseOffsetInHandle } = dragItemRef.current;
      
      let newStart = initialStart;
      let newDuration = initialDuration;
      
      if (direction === 'left') {
        // 调整左侧手柄时，需要考虑鼠标在手柄上的偏移
        // 此时拖动影响 start 和 duration，但 end 保持不变
        const adjustedMouseTime = mouseTimePosition - (mouseOffsetInHandle / dragItemRef.current.pixelsPerSecond / zoom);
        const potentialNewStart = Math.max(0, Math.round(adjustedMouseTime * 10) / 10);
        
        // 确保不会使duration小于最小值
        if (initialEnd - potentialNewStart >= 0.1) {
          newStart = potentialNewStart;
          newDuration = initialEnd - potentialNewStart;
        } else {
          // 如果调整会使duration太小，就固定为最小duration
          newStart = initialEnd - 0.1;
          newDuration = 0.1;
        }
      } else { // 'right'
        // 调整右侧手柄时，左侧位置不变，只调整duration
        // 同样需要考虑鼠标在手柄上的偏移
        const adjustedMouseTime = mouseTimePosition + (mouseOffsetInHandle / dragItemRef.current.pixelsPerSecond / zoom);
        const potentialNewEnd = Math.min(duration, Math.round(adjustedMouseTime * 10) / 10);
        
        // 确保不会使duration小于最小值
        if (potentialNewEnd - initialStart >= 0.1) {
          newDuration = potentialNewEnd - initialStart;
        } else {
          newDuration = 0.1;
        }
      }
      
      // 检查是否与同轨道上的其他片段碰撞
      const { hasCollision, collidingItemIds } = checkCollision(trackId, itemId, newStart, newDuration);
      
      // 设置碰撞警告状态
      setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);
      
      if (!hasCollision) {
        const newTracks = tracks.map(track => {
          if (track.id === trackId) {
            return {
              ...track,
              items: track.items.map(item => {
                if (item.id === itemId) {
                  return { 
                    ...item, 
                    start: newStart,
                    duration: newDuration
                  };
                }
                return item;
              })
            };
          }
          return track;
        });

        setTracks(newTracks);
        onTrackChange?.(newTracks);
      }
    });
  };

  const handleItemResizeEnd = () => {
    if (dragItemRef.current) {
      // 移除调整大小时的视觉反馈
      const itemElement = document.querySelector(`.track-item[data-track-id="${dragItemRef.current.trackId}"][data-item-id="${dragItemRef.current.itemId}"]`);
      if (itemElement) {
        itemElement.classList.remove('resizing');
        itemElement.classList.remove(`resizing-left`);
        itemElement.classList.remove(`resizing-right`);
      }
    }
    
    setIsResizing(false);
    setResizeDirection(null);
    dragItemRef.current = null;
    setCollisionWarning([]);
    document.removeEventListener('mousemove', handleItemResize);
    document.removeEventListener('mouseup', handleItemResizeEnd);
  };

  // 获取总时长
  const getDuration = () => {
    // 计算所有轨道项目中的最大结束时间
    let maxEndTime = 0;
    
    tracks.forEach(track => {
      track.items.forEach(item => {
        const itemEndTime = item.start + item.duration;
        if (itemEndTime > maxEndTime) {
          maxEndTime = itemEndTime;
        }
      });
    });
    
    // 确保时间轴至少有视频时长那么长，并添加一些额外空间（例如10%）
    const minDuration = videoDuration;
    const extraSpace = 0.1; // 10% 额外空间
    
    return Math.max(maxEndTime * (1 + extraSpace), minDuration);
  };

  // 处理片段选择
  const handleItemClick = (trackId, itemId) => {
    console.log('Item clicked:', { trackId, itemId });
    const track = tracks.find(t => t.id === trackId);
    console.log('Found track:', track);
    
    if (!track) {
      console.error('Track not found for trackId:', trackId);
      return;
    }
    
    const item = track?.items.find(i => i.id === itemId);
    console.log('Found item:', item);
    
    if (item) {
      // 确保item中包含trackId
      const itemWithTrackId = { ...item, trackId };
      setSelectedItem(itemWithTrackId);
      onItemSelect?.(itemWithTrackId);
    } else {
      console.error('Item not found for itemId:', itemId, 'in track:', trackId);
    }
  };

  // 添加一个处理滚动事件的函数
  const handleTimelineScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // 监听轨道变化，更新游标位置和时间轴长度
  useEffect(() => {
    // 当轨道内容变化时，可能会影响总时长
    // 如果游标位置超出了新的总时长，需要调整
    const duration = getDuration();
    if (currentTime > duration) {
      setCurrentTime(duration);
      onCursorChange?.(duration);
    }
    
    // 更新游标位置
    if (timelineRef.current && !cursorPositionRef.current.isDragging) {
      updateCursorPositionAfterZoom(zoom);
    }
  }, [tracks]);

  // 当initialTracks变化时更新内部状态
  useEffect(() => {
    if (initialTracks) {
      console.log('Updating tracks from initialTracks (selectedVideoId:', selectedVideoId, '):', initialTracks);
      // 通过深拷贝确保数据的完全独立，避免引用相同对象
      setTracks(JSON.parse(JSON.stringify(initialTracks)));
    }
  }, [initialTracks, selectedVideoId]); // 添加 selectedVideoId 作为依赖，确保区域改变时也会触发更新

  // 初始化时记录初始轨道数据
  useEffect(() => {
    console.log('TrackEditor initialized with tracks:', tracks);
  }, []);

  // 监听currentTime变化，更新游标位置
  useEffect(() => {
    if (!timelineRef.current || cursorPositionRef.current.isDragging) return;
    
    const cursorIndicator = timelineRef.current.querySelector('.cursor-indicator:not(.temp-cursor-indicator)');
    const cursorLine = timelineRef.current.querySelector('.cursor-line:not(.temp-cursor-line)');
    
    if (cursorIndicator && cursorLine) {
      if (currentTime === 0) {
        // 时间为0时，设置为轨道头部宽度位置
        const trackHeaderWidth = 36;
        cursorIndicator.style.left = `${trackHeaderWidth}px`;
        cursorLine.style.left = `${trackHeaderWidth}px`;
        
        // 更新保存的像素位置
        cursorPositionRef.current.pixelPosition = trackHeaderWidth;
      } else {
        // 计算当前时间对应的像素位置
        const trackHeaderWidth = 36;
        const rulerWidth = timelineRef.current.querySelector('.timeline-ruler').offsetWidth;
        const pixelPosition = trackHeaderWidth + (currentTime / getDuration()) * (rulerWidth - trackHeaderWidth);
        
        // 使用像素定位，确保一致性
        cursorIndicator.style.left = `${pixelPosition}px`;
        cursorLine.style.left = `${pixelPosition}px`;
        
        // 更新保存的像素位置
        cursorPositionRef.current.pixelPosition = pixelPosition;
      }
      
      // 确保游标线的高度足够
      cursorLine.style.height = `${timelineRef.current.scrollHeight}px`;
    }
  }, [currentTime, zoom]);

  // 初始化时设置游标位置为0
  useEffect(() => {
    // 确保游标初始化在零位置
    setCurrentTime(0);
    if (onCursorChange) {
      onCursorChange(0);
    }
    
    // 初始化游标位置引用
    cursorPositionRef.current = { time: 0, isDragging: false, pixelPosition: 36 };
    
    // 添加一个小延迟确保DOM已经渲染完成
    const timer = setTimeout(() => {
      if (timelineRef.current) {
        // 强制重置滚动位置到开始位置
        timelineRef.current.scrollLeft = 0;
        
        // 确保游标位置正确 - 直接设置为轨道头部宽度位置（即时间轴的起始点）
        const trackHeaderWidth = 36;
        
        const cursorIndicator = timelineRef.current.querySelector('.cursor-indicator:not(.temp-cursor-indicator)');
        const cursorLine = timelineRef.current.querySelector('.cursor-line:not(.temp-cursor-line)');
        
        if (cursorIndicator && cursorLine) {
          // 设置为时间轴起始位置
          cursorIndicator.style.left = `${trackHeaderWidth}px`;
          cursorLine.style.left = `${trackHeaderWidth}px`;
          cursorIndicator.style.transform = 'translateX(-50%)';
          cursorLine.style.transform = 'translateX(-50%)';
          
          // 更新保存的像素位置
          cursorPositionRef.current.pixelPosition = trackHeaderWidth;
          
          // 确保游标线的高度足够
          cursorLine.style.height = `${timelineRef.current.scrollHeight}px`;
        }
      }
    }, 300); // 增加延迟确保DOM完全加载
    
    return () => clearTimeout(timer);
  }, []);

  // 监听滚动高度变化，更新游标线高度
  useEffect(() => {
    if (timelineRef.current) {
      const cursorLine = timelineRef.current.querySelector('.cursor-line');
      if (cursorLine) {
        cursorLine.style.height = `${timelineRef.current.scrollHeight}px`;
      }
    }
  }, [tracks, isCollapsed]);

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleCursorDrag);
      document.removeEventListener('mouseup', handleCursorDragEnd);
      document.removeEventListener('mousemove', handleItemResize);
      document.removeEventListener('mouseup', handleItemResizeEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 渲染视频帧
  const renderVideoFrames = (item, trackId) => {
    if (!item.frames || item.frames.length === 0) {
      return (
        <div className="video-placeholder">
          <PlayCircleOutlined />
        </div>
      );
    }

    if (isCollapsed) {
      return (
        <div className="video-frames-container">
          {item.frames.map((frame, index) => (
            <div
              key={index}
              className="video-frame"
              style={{ backgroundImage: `url(${frame})` }}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="video-frames">
        {item.frames.map((frame, index) => (
          <div
            key={index}
            className={`video-frame ${index === 0 ? 'main-frame' : ''}`}
            style={{ backgroundImage: `url(${frame})` }}
          />
        ))}
      </div>
    );
  };

  // 渲染音频波形
  const renderAudioWaveform = (item) => {
    const waveform = audioWaveforms[item.id];
    
    if (!waveform) {
      return (
        <div className="audio-placeholder">
          <div className="audio-waveform-placeholder"></div>
        </div>
      );
    }
    
    return (
      <div className="audio-waveform-container">
        {waveform.map((height, index) => (
          <div 
            key={index} 
            className="waveform-bar"
            style={{ 
              left: `${(index / (waveform.length - 1)) * 100}%`,
              height: `${height * 100}%`
            }}
          />
        ))}
      </div>
    );
  };

  // 渲染媒体内容
  const renderTrackItem = (track, item) => {
    // 确保item中有trackId
    const itemWithTrackId = item.trackId ? item : { ...item, trackId: track.id };
    const isSelected = itemWithTrackId.id === selectedItem?.id;
    const hasCollision = collisionWarning.includes(itemWithTrackId.id);
    const isDragging = dragItemRef.current?.itemId === itemWithTrackId.id;

    const commonProps = {
      className: `track-item type-${track.type} ${isSelected ? 'selected' : ''} ${hasCollision ? 'collision-warning' : ''} ${isDragging ? 'dragging' : ''}`,
      style: {
        left: `${itemWithTrackId.start * zoom * 100}px`,
        width: `${itemWithTrackId.duration * zoom * 100}px`
      },
      onClick: () => handleItemClick(track.id, itemWithTrackId.id),
      onMouseDown: (e) => handleItemDragStart(e, track.id, itemWithTrackId.id),
      'data-track-id': track.id,
      'data-item-id': itemWithTrackId.id
    };

    // 根据轨道类型渲染不同的内容
    const renderContent = () => {
      switch (track.type) {
        case TRACK_TYPES.VIDEO:
          return (
            <div className="media-container">
              <div 
                className="media-cover"
                style={{ 
                  backgroundImage: `url(${itemWithTrackId.cover || 'https://picsum.photos/300/200'})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: '4px'
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
                <div className="audio-name">{itemWithTrackId.content}</div>
                <div className="audio-duration">{itemWithTrackId.duration}s</div>
              </div>
              <div className="audio-waveform">
                {renderAudioWaveform(itemWithTrackId)}
              </div>
            </div>
          );
        
        case TRACK_TYPES.TEXT:
          return (
            <div className="media-container text-container">
              <div className="text-icon">
                <FontSizeOutlined />
              </div>
              <div className="text-content">{itemWithTrackId.content}</div>
            </div>
          );
        
        case TRACK_TYPES.IMAGE:
          return (
            <div className="media-container">
              <div 
                className="media-cover"
                style={{ 
                  backgroundImage: `url(${itemWithTrackId.src || 'https://picsum.photos/300/200'})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: '4px'
                }}
              />
            </div>
          );
        
        default:
          return null;
      }
    };

    // 通用的调整手柄
    const resizeHandles = (
      <>
        <div className="resize-handle left" onMouseDown={(e) => handleItemResizeStart(e, 'left', track.id, itemWithTrackId.id)} />
        <div className="resize-handle right" onMouseDown={(e) => handleItemResizeStart(e, 'right', track.id, itemWithTrackId.id)} />
      </>
    );

    return (
      <div {...commonProps}>
        {renderContent()}
        {resizeHandles}
      </div>
    );
  };

  // 获取人物视频封面图的样式
  const getHumanVideoCoverStyle = (item, trackId) => {
    const frameData = videoFrames[item.id];
    if (frameData && frameData.frames && frameData.frames.length > 0) {
      return { backgroundImage: `url(${frameData.frames[0]})` };
    }
    return {};
  };

  // 修改计算时间轴宽度的函数
  const calculateTimelineWidth = () => {
    const duration = getDuration();
    const trackHeaderWidth = 36;
    // 每秒的基础宽度（像素）
    const baseWidthPerSecond = 100;
    // 计算实际每秒宽度（考虑缩放）
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    // 计算总宽度（包括轨道头部宽度）
    const totalWidth = trackHeaderWidth + (duration * scaledWidthPerSecond);
    
    // 返回固定值而不是百分比
    return `${totalWidth}px`;
  };

  // 修改刻度渲染逻辑
  const renderRulerMarks = () => {
    const duration = getDuration();
    const trackHeaderWidth = 36;
    const baseWidthPerSecond = 100; // 与calculateTimelineWidth中的值保持一致
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    const marks = [];

    // 计算刻度数量（每0.1秒一个刻度）
    const totalMarks = Math.ceil(duration * 10);

    for (let i = 0; i <= totalMarks; i++) {
      const isSecondMark = i % 10 === 0;
      const time = i / 10; // 转换为秒
      const position = trackHeaderWidth + (time * scaledWidthPerSecond);

      marks.push(
        <div
          key={i}
          className={`ruler-mark ${isSecondMark ? 'second-mark' : ''}`}
          style={{
            position: 'absolute',
            left: `${position}px`,
            width: '1px', // 设置固定宽度
            flex: 'none' // 移除flex布局
          }}
        >
          {isSecondMark && (
            <span className="ruler-label">{time}s</span>
          )}
        </div>
      );
    }

    return marks;
  };

  // 处理视频选择
  const handleVideoSelect = (videoId) => {
    console.log('Video selected:', videoId, 'Current selected:', selectedVideoId);
    
    // 如果点击的是当前已选中的视频，则取消选择
    if (videoId === selectedVideoId) {
      console.log('取消选择视频');
      setSelectedItem(null);
      // 通知父组件取消选择，但不清空轨道
      onSelectedVideoIdChange?.(null);
      // 只通知取消选择项目，不清空轨道数据
      onItemSelect?.(null);
      return;
    }
    
    // 遍历所有视频轨道找到匹配的项目
    let foundItem = null;
    let foundTrack = null;
    
    for (const track of tracks) {
      if (track.type === TRACK_TYPES.VIDEO) {
        const item = track.items.find(item => item.id === videoId);
        if (item) {
          foundItem = item;
          foundTrack = track;
          break;
        }
      }
    }
    
    if (foundTrack && foundItem) {
      console.log('找到视频项目:', foundItem, '在轨道中:', foundTrack);
      
      // 确保item包含trackId
      const itemWithTrackId = { ...foundItem, trackId: foundTrack.id };
      
      // 设置选中状态
      setSelectedItem(itemWithTrackId);
      
      // 通知父组件
      onSelectedVideoIdChange?.(videoId);
      onItemSelect?.(itemWithTrackId);
    } else {
      console.error('未找到ID为', videoId, '的视频项目');
    }
  };

  // 获取实际轨道中的所有视频元素（扁平化）用于显示
  const getAllVideoItems = () => {
    const videoItems = [];
    tracks.forEach(track => {
      if (track.type === TRACK_TYPES.VIDEO) {
        track.items.forEach(item => {
          videoItems.push({
            ...item,
            trackId: track.id
          });
        });
      }
    });
    return videoItems;
  };

  // 修改添加视频处理函数
  const handleAddVideo = (e) => {
    console.log('handleAddVideo 被调用');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 创建新的视频项，始终从0秒开始
    const newVideoId = `video-${Date.now()}`;
    const newVideo = {
      id: newVideoId,
      start: 0, // 始终从0秒开始
      duration: 10,
      content: '新视频片段',
      src: 'http://kl-digital.oss-cn-shanghai.aliyuncs.com/synthesis/42/P13525239778T1741857143139RPYUV.mp4',
      frames: [
        'https://picsum.photos/300/200?random=2',
        'https://picsum.photos/300/200?random=3',
        'https://picsum.photos/300/200?random=4',
        'https://picsum.photos/300/200?random=5',
        'https://picsum.photos/300/200?random=6'
      ]
    };
    
    // 获取当前视频轨道
    const videoTrack = tracks.find(track => track.type === TRACK_TYPES.VIDEO);
    
    // 在现有轨道中添加新片段
    if (videoTrack) {
      console.log('在现有视频轨道中添加新视频');
      
      // 更新轨道数据 - 向轨道中添加新视频片段
      const updatedTrack = {
        ...videoTrack,
        items: [...videoTrack.items, newVideo] // 追加到现有视频后面
      };
      
      const newTracks = tracks.map(track => 
        track.id === videoTrack.id ? updatedTrack : track
      );
      
      // 更新状态
      onTrackChange(newTracks);
      
      // 添加视频帧数据
      setVideoFrames(prev => ({
        ...prev,
        [newVideoId]: {
          frames: newVideo.frames
        }
      }));
      
      // 选中新添加的视频
      handleVideoSelect(newVideoId);
      
      console.log('新视频片段添加成功，ID:', newVideoId);
    } else {
      // 如果没有视频轨道，创建新的
      console.log('创建新的视频轨道并添加视频');
      
      const newVideoTrack = {
        id: `video-track-${Date.now()}`,
        type: TRACK_TYPES.VIDEO,
        name: '视频轨道',
        items: [newVideo]
      };
      
      const newTracks = [newVideoTrack, ...tracks.filter(track => track.type !== TRACK_TYPES.VIDEO)];
      
      // 更新状态
      onTrackChange(newTracks);
      
      // 添加视频帧数据
      setVideoFrames(prev => ({
        ...prev,
        [newVideoId]: {
          frames: newVideo.frames
        }
      }));
      
      // 选中新添加的视频
      handleVideoSelect(newVideoId);
      
      console.log('新视频轨道和片段添加成功，ID:', newVideoId);
    }
  };

  // 修改轨道展开/收起的函数
  const toggleCollapse = () => {
    // 如果当前是收起状态但没有选择任何视频
    if (isCollapsed && !selectedVideoId) {
      console.log('请先选择一个区域片段');
      // 通知父组件显示提示消息
      onItemSelect?.({action: 'showTip', message: '请先选择一个区域片段'});
      return;
    }
    
    // 通知父组件状态变化
    onCollapsedChange?.(!isCollapsed);
  };

  // 修改渲染收起状态下的视频轨道
  const renderCollapsedVideoTracks = () => {
    // 获取所有视频项目
    const allVideoItems = getAllVideoItems();
    console.log('收起状态下渲染视频项目:', allVideoItems.length);
    
    return (
      <div className="collapsed-video-tracks">
        {/* 渲染所有视频项目 */}
        {allVideoItems.map((item) => (
          <div 
            key={item.id}
            className={`collapsed-video-item ${item.id === selectedVideoId ? 'selected' : ''}`}
            onClick={() => handleVideoSelect(item.id)}
          >
            <div className="video-frames-container">
              {videoFrames[item.id]?.frames.map((frame, index) => (
                <div
                  key={index}
                  className="video-frame"
                  style={{ backgroundImage: `url(${frame})` }}
                />
              ))}
            </div>
            <div className="video-item-duration">{item.duration}s</div>
          </div>
        ))}
        
        {/* 添加按钮 */}
        <button 
          className="add-video-button" 
          onClick={(e) => {
            console.log('加号按钮被点击');
            e.preventDefault();
            e.stopPropagation();
            handleAddVideo(e);
            return false; // 阻止事件传播
          }}
        >
          <PlusOutlined />
        </button>
        
        {/* 空状态提示 */}
        {allVideoItems.length === 0 && (
          <div className="empty-track-message">
            没有视频片段，点击"+"按钮添加
          </div>
        )}
      </div>
    );
  };

  // 修改视频轨道项渲染
  const renderVideoTrackItem = (item, track, isCollapsed) => {
    // 确保item具有trackId
    const itemWithTrackId = item.trackId ? item : { ...item, trackId: track.id };
    const isSelected = itemWithTrackId.id === selectedVideoId;
    
    return (
      <div
        className={`track-item type-video ${isSelected ? 'selected' : ''}`}
        style={{
          left: `${itemWithTrackId.start * zoom * 100}px`,
          width: `${itemWithTrackId.duration * zoom * 100}px`
        }}
        onClick={() => handleVideoSelect(itemWithTrackId.id)}
        data-track-id={track.id}
        data-item-id={itemWithTrackId.id}
      >
        <div className="media-container">
          <div 
            className="video-cover"
            style={{ 
              backgroundImage: `url(${itemWithTrackId.cover || 'https://picsum.photos/300/200'})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: '4px'
            }}
          />
        </div>
        <div className="resize-handle left" onMouseDown={(e) => handleItemResizeStart(e, 'left', track.id, itemWithTrackId.id)} />
        <div className="resize-handle right" onMouseDown={(e) => handleItemResizeStart(e, 'right', track.id, itemWithTrackId.id)} />
      </div>
    );
  };

  // 修改轨道点击处理函数
  const handleTrackClick = (track) => {
    console.log('Track clicked:', track);
    
    // 清除之前选中的项目
    setSelectedItem(null);
    
    // 通知选中状态
    console.log('Notifying parent of track selection:', {
      trackId: track.id,
      type: track.type,
      isTrack: true
    });
    
    onItemSelect?.({
      trackId: track.id,
      type: track.type,
      isTrack: true // 标记这是一个轨道而不是轨道中的项目
    });
  };

  // 修改渲染轨道的函数
  const renderTrack = (track) => {
    const isVideoTrack = track.type === TRACK_TYPES.VIDEO;
    
    return (
      <div
        key={track.id}
        className={`track ${isCollapsed ? 'collapsed' : ''} ${track.type.toLowerCase()}`}
        data-track-id={track.id}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleTrackClick(track);
        }}
      >
        <div 
          className="track-header"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTrackClick(track);
          }}
        >
          <div className="track-info">
            <span className={`track-icon type-${track.type}`}>
              {track.type === TRACK_TYPES.VIDEO && <VideoCameraOutlined />}
              {track.type === TRACK_TYPES.VOICE && <AudioOutlined />}
              {track.type === TRACK_TYPES.BACKGROUND && <CustomerServiceOutlined />}
              {track.type === TRACK_TYPES.IMAGE && <PictureOutlined />}
              {track.type === TRACK_TYPES.TEXT && <FontSizeOutlined />}
            </span>
          </div>
        </div>

        <div 
          className="track-content"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTrackClick(track);
          }}
        >
          {track.items.map(item => {
            // 确保item明确关联到这个轨道
            const trackItem = { ...item, trackId: track.id };
            if (isVideoTrack) {
              return renderVideoTrackItem(trackItem, track, isCollapsed);
            }
            return renderTrackItem(track, trackItem);
          })}
        </div>
        
        {isCollapsed && isVideoTrack && (
          <button 
            className="add-video-button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddVideo();
            }}
          >
            <PlusOutlined />
          </button>
        )}
      </div>
    );
  };

  // 处理删除按钮点击
  const handleDeleteButtonClick = () => {
    if (!selectedItem) {
      message.warning('请先选择一个项目');
      return;
    }
    
    console.log('Deleting item:', selectedItem);
    
    // 调用父组件提供的删除函数
    onDeleteItem?.(selectedItem.trackId, selectedItem.id);
  };

  // 生成视频帧缩略图
  const generateVideoFrames = (videoId, videoSrc, duration, isHuman = false) => {
    if (videoFrames[videoId]) return;

    // 直接生成5个随机图片帧
    const frames = Array.from({ length: 5 }, (_, i) => 
      `https://picsum.photos/300/200?random=${videoId}-${i}`
    );
    
    setVideoFrames(prev => ({
      ...prev,
      [videoId]: {
        frames,
        isHuman
      }
    }));
    
    // 更新轨道数据中的帧信息
    const newTracks = tracks.map(track => {
      if (track.type === TRACK_TYPES.VIDEO) {
        return {
          ...track,
          items: track.items.map(item => {
            if (item.id === videoId) {
              return {
                ...item,
                frames
              };
            }
            return item;
          })
        };
      }
      return track;
    });
    
    // 由于是可视化增强，不触发onTrackChange
    setTracks(newTracks);
  };

  // 生成音频波形
  const generateAudioWaveform = (audioId, audioSrc) => {
    if (audioWaveforms[audioId]) return;
    
    // 模拟波形数据 - 实际应用中应该使用Web Audio API分析音频
    const simulateWaveform = () => {
      const waveformPoints = [];
      const pointCount = 50;
      
      for (let i = 0; i < pointCount; i++) {
        // 生成随机高度，但保持一定的连续性
        const height = Math.random() * 0.7 + 0.3; // 0.3 到 1.0 之间
        waveformPoints.push(height);
      }
      
      setAudioWaveforms(prev => ({
        ...prev,
        [audioId]: waveformPoints
      }));
    };
    
    // 在实际应用中，这里应该使用Web Audio API分析音频
    // 但为了演示，我们使用模拟数据
    simulateWaveform();
  };

  // 加载媒体资源
  useEffect(() => {
    tracks.forEach(track => {
      track.items.forEach(item => {
        if (track.type === TRACK_TYPES.VIDEO && item.src) {
          // 检测是否为人物视频（根据轨道名称或其他属性判断）
          const isHuman = track.name.includes('人') || 
                          item.content.includes('人') || 
                          track.id === 'track-1'; // 假设第一个轨道是人物轨道
          generateVideoFrames(item.id, item.src, item.duration, isHuman);
        } else if ((track.type === TRACK_TYPES.VOICE || track.type === TRACK_TYPES.BACKGROUND) && item.src) {
          generateAudioWaveform(item.id, item.src);
        }
      });
    });
  }, [tracks]);

  return (
    <div className={`track-editor ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="timeline-controls">
        <div className="left-controls">
          <button
            className="play-button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          </button>
          <button
            className="control-button"
            onClick={() => {/* 实现撤销功能 */}}
            disabled={!canUndo}
            title="撤销"
          >
            <UndoOutlined />
          </button>
          <button
            className="control-button"
            onClick={() => {/* 实现重做功能 */}}
            disabled={!canRedo}
            title="重做"
          >
            <RedoOutlined />
          </button>
          <button
            className="control-button"
            onClick={handleDeleteButtonClick}
            title="删除所选项目"
          >
            <DeleteOutlined />
          </button>
        </div>
        
        <div className="center-controls">
          <button 
            className="toggle-tracks-button" 
            onClick={toggleCollapse}
            title={isCollapsed ? '编辑轨道' : '收起轨道'}
          >
            <span>{isCollapsed ? '编辑轨道' : '收起轨道'}</span>
            <DownOutlined style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>

        <div className="right-controls">
          <div className="zoom-controls">
            <button
              className="zoom-button"
              onClick={handleZoomOut}
              title="缩小"
            >
              <MinusOutlined />
            </button>
            <span className="zoom-text">{Math.round(zoom * 100)}%</span>
            <button
              className="zoom-button"
              onClick={handleZoomIn}
              title="放大"
            >
              <PlusOutlined />
            </button>
          </div>
          <div className="time-display">
            {currentTime.toFixed(1)}s / {getDuration().toFixed(1)}s
          </div>
        </div>
      </div>

      {isCollapsed ? (
        renderCollapsedVideoTracks()
      ) : (
        <div 
          className="timeline" 
          ref={timelineRef} 
          onScroll={handleTimelineScroll}
        >
          <div 
            className="timeline-ruler"
            style={{ 
              width: calculateTimelineWidth(),
              position: 'sticky',
              top: 0,
              zIndex: 2,
              paddingLeft: '36px',
              boxSizing: 'border-box'
            }}
            onClick={handleTimelineClick}
          >
            {renderRulerMarks()}
            
            {/* 游标指示器 */}
            {renderCursor()}
          </div>

          {/* 游标线 */}
          <div 
            className={`cursor-line ${cursorPositionRef.current?.isDragging ? 'dragging' : ''}`}
            style={{ 
              left: currentTime === 0 ? '36px' : undefined,
              height: timelineRef.current ? `${timelineRef.current.scrollHeight}px` : '100%',
              pointerEvents: 'all'
            }}
            onMouseDown={handleCursorMouseDown}
            ref={cursorRef}
          />
          
          <div 
            className="tracks-container"
            style={{ width: calculateTimelineWidth() }}
            onClick={handleTimelineClick}
          >
            {tracks.map(renderTrack)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackEditor;