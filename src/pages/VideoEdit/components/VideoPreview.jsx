import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PlusOutlined,
  MinusOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import './VideoPreview.scss';
import { TRACK_TYPES } from '../constants';

// 文本元素组件
const TextElement = ({ 
  item, 
  isSelected, 
  containerSize, 
  containerRef,
  onSelect,
  onChange,
  onResizeStart,
  onRotateStart
}) => {
  const [dragStartPos, setDragStartPos] = useState(null);
  const x = (item.x / 100) * containerSize.width;
  const y = (item.y / 100) * containerSize.height;

  // 处理拖拽开始
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      itemX: item.x,
      itemY: item.y
    });
    
    onSelect?.(item);
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // 处理拖拽移动
  const handleDragMove = useCallback((e) => {
    if (!dragStartPos) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStartPos.x;
    const y = e.clientY - rect.top - dragStartPos.y;
    
    const newX = (x / containerSize.width) * 100;
    const newY = (y / containerSize.height) * 100;
    
    const updatedItem = {
      ...item,
      x: Math.max(0, Math.min(100, newX)),
      y: Math.max(0, Math.min(100, newY))
    };
    
    onChange?.(updatedItem);
  }, [dragStartPos, item, containerSize, containerRef, onChange]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDragStartPos(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  return (
    <div 
      className={`text-element ${isSelected ? 'selected' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${item.rotation}deg) scale(${item.scale})`,
        opacity: item.opacity,
        position: 'absolute',
        cursor: 'move',
        ...item.textStyle
      }}
      onMouseDown={handleDragStart}
    >
      <div className="text-content">
        {item.content}
      </div>
      
      {isSelected && (
        <div className="resize-rotate-handles">
          {/* 缩放控制点 */}
          <div className="handle nw" onMouseDown={(e) => onResizeStart(e, 'nw')} />
          <div className="handle ne" onMouseDown={(e) => onResizeStart(e, 'ne')} />
          <div className="handle se" onMouseDown={(e) => onResizeStart(e, 'se')} />
          <div className="handle sw" onMouseDown={(e) => onResizeStart(e, 'sw')} />
          
          {/* 旋转控制点 */}
          <div className="rotate-handle" onMouseDown={onRotateStart} />
        </div>
      )}
    </div>
  );
};

const VideoPreview = ({ 
  width = '100%', 
  height = '100%', 
  videoSrc,
  tracks = [],
  currentTime = 0,
  isPlaying = false,
  onPlay,
  onPause,
  onSeek,
  onItemSelect,
  onItemChange
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedItem, setSelectedItem] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [resizeStart, setResizeStart] = useState(null);
  const [rotateStart, setRotateStart] = useState(null);

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prevLevel => Math.min(prevLevel + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prevLevel => Math.max(prevLevel - 10, 50));
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || !!document.webkitFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Video setup effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    // Set video source
    if (video.src !== videoSrc) {
      video.src = videoSrc;
    }

    // Set current time
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
    
    // Handle play/pause
    if (isPlaying) {
      video.play().catch(error => {
        console.error('Video playback failed:', error);
      });
    } else {
      video.pause();
    }
  }, [videoSrc, currentTime, isPlaying]);

  // 获取当前时间点的活动项目
  const getActiveItems = useCallback(() => {
    return tracks
      .flatMap(track => 
        track.items.map(item => ({
          ...item,
          type: track.type,
          zIndex: item.zIndex || 0,
          x: item.x ?? 50,
          y: item.y ?? 50,
          width: item.width ?? (item.type === TRACK_TYPES.TEXT ? 30 : 20),
          height: item.height ?? 'auto',
          rotation: item.rotation ?? 0,
          scale: item.scale ?? 1,
          opacity: item.opacity ?? 1
        }))
      )
      .filter(item => 
        item.start <= currentTime && 
        item.start + item.duration > currentTime
      )
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [tracks, currentTime]);

  // 处理拖拽
  const handleDrag = (itemId, { x, y }) => {
    const item = getActiveItems().find(item => item.id === itemId);
    if (!item) return;

    const updatedItem = {
      ...item,
      x: (x / containerSize.width) * 100,
      y: (y / containerSize.height) * 100
    };

    onItemChange?.(updatedItem);
  };

  // 处理缩放
  const handleResize = (itemId, { width, height }) => {
    const item = getActiveItems().find(item => item.id === itemId);
    if (!item) return;

    const updatedItem = {
      ...item,
      width: (width / containerSize.width) * 100,
      height: (height / containerSize.height) * 100
    };

    onItemChange?.(updatedItem);
  };

  // 处理旋转
  const handleRotate = (itemId, rotation) => {
    const item = getActiveItems().find(item => item.id === itemId);
    if (!item) return;

    const updatedItem = {
      ...item,
      rotation
    };

    onItemChange?.(updatedItem);
  };

  // 更新容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 处理缩放开始
  const handleResizeStart = (e, corner) => {
    e.stopPropagation();
    if (!selectedItem) return;

    const rect = e.target.getBoundingClientRect();
    setResizeStart({
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: selectedItem.width,
      startHeight: selectedItem.height
    });

    // 添加全局鼠标事件监听
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // 处理缩放移动
  const handleResizeMove = useCallback((e) => {
    if (!resizeStart || !selectedItem) return;

    const deltaX = e.clientX - resizeStart.startX;
    const deltaY = e.clientY - resizeStart.startY;
    let newWidth = resizeStart.startWidth;
    let newHeight = resizeStart.startHeight;

    // 根据不同角落调整大小
    switch (resizeStart.corner) {
      case 'se':
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 'sw':
        newWidth -= deltaX;
        newHeight += deltaY;
        break;
      case 'ne':
        newWidth += deltaX;
        newHeight -= deltaY;
        break;
      case 'nw':
        newWidth -= deltaX;
        newHeight -= deltaY;
        break;
    }

    // 确保最小尺寸
    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);

    handleResize(selectedItem.id, {
      width: newWidth,
      height: newHeight
    });
  }, [resizeStart, selectedItem, handleResize]);

  // 处理缩放结束
  const handleResizeEnd = useCallback(() => {
    setResizeStart(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // 处理旋转开始
  const handleRotateStart = (e) => {
    e.stopPropagation();
    if (!selectedItem) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + (selectedItem.x / 100) * rect.width;
    const centerY = rect.top + (selectedItem.y / 100) * rect.height;

    setRotateStart({
      startX: e.clientX,
      startY: e.clientY,
      centerX,
      centerY,
      startRotation: selectedItem.rotation || 0
    });

    // 添加全局鼠标事件监听
    document.addEventListener('mousemove', handleRotateMove);
    document.addEventListener('mouseup', handleRotateEnd);
  };

  // 处理旋转移动
  const handleRotateMove = useCallback((e) => {
    if (!rotateStart || !selectedItem) return;

    const startAngle = Math.atan2(
      rotateStart.startY - rotateStart.centerY,
      rotateStart.startX - rotateStart.centerX
    );

    const currentAngle = Math.atan2(
      e.clientY - rotateStart.centerY,
      e.clientX - rotateStart.centerX
    );

    let rotation = ((currentAngle - startAngle) * (180 / Math.PI) + rotateStart.startRotation) % 360;
    if (rotation < 0) rotation += 360;

    handleRotate(selectedItem.id, rotation);
  }, [rotateStart, selectedItem, handleRotate]);

  // 处理旋转结束
  const handleRotateEnd = useCallback(() => {
    setRotateStart(null);
    document.removeEventListener('mousemove', handleRotateMove);
    document.removeEventListener('mouseup', handleRotateEnd);
  }, [handleRotateMove]);

  // 更新事件监听器清理
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('mousemove', handleRotateMove);
      document.removeEventListener('mouseup', handleRotateEnd);
    };
  }, [handleResizeMove, handleResizeEnd, handleRotateMove, handleRotateEnd]);

  // 渲染文本元素
  const renderTextElement = (item) => {
    const isSelected = selectedItem?.id === item.id;
    
    return (
      <TextElement
        key={item.id}
        item={item}
        isSelected={isSelected}
        containerSize={containerSize}
        containerRef={containerRef}
        onSelect={(item) => {
          setSelectedItem(item);
          onItemSelect?.(item);
        }}
        onChange={onItemChange}
        onResizeStart={handleResizeStart}
        onRotateStart={handleRotateStart}
      />
    );
  };

  // 渲染元素层
  const renderElementsLayer = () => {
    const activeItems = getActiveItems();
    
    return (
      <div className="elements-layer">
        {activeItems.map(item => {
          if (item.type === TRACK_TYPES.TEXT) {
            return renderTextElement(item);
          }
          // 处理其他类型的元素...
          return null;
        })}
      </div>
    );
  };

  // 渲染网格背景
  const renderGridBackground = () => {
    return (
      <div className="grid-background">
        <div className="grid-pattern"></div>
        <div className="upload-hint">
          <div className="hint-icon">
            <VideoCameraOutlined />
          </div>
          <div className="hint-text">点击左侧素材添加视频</div>
        </div>
      </div>
    );
  };

  // 视频播放状态同步
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (Math.abs(video.currentTime - currentTime) > 0.1) {
        video.currentTime = currentTime;
      }
    };

    const handleVideoEnd = () => {
      onPause?.();
      video.currentTime = 0;
      onSeek?.(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentTime, onPause, onSeek]);

  // 处理新元素添加
  useEffect(() => {
    // 当tracks发生变化时，检查是否有新元素添加
    const latestTrack = tracks[tracks.length - 1];
    if (latestTrack) {
      const latestItem = latestTrack.items[latestTrack.items.length - 1];
      if (latestItem && (!latestItem.x || !latestItem.y)) {
        // 如果是新添加的元素（没有位置信息），自动选中它
        setSelectedItem(latestItem);
        onItemSelect?.(latestItem);
      }
    }
  }, [tracks]);

  // 监听轨道选择变化
  useEffect(() => {
    const handleTrackItemSelect = (event) => {
      const { detail } = event;
      if (!detail) return;
      
      // 只处理文本和元素类型
      if (detail.type === TRACK_TYPES.TEXT || detail.type === TRACK_TYPES.ELEMENT) {
        const activeItems = getActiveItems();
        const selectedItem = activeItems.find(item => item.id === detail.itemId);
        if (selectedItem) {
          setSelectedItem(selectedItem);
          onItemSelect?.(selectedItem);
        }
      } else {
        setSelectedItem(null);
      }
    };

    // 监听轨道选择事件
    window.addEventListener('track-item-select', handleTrackItemSelect);
    return () => {
      window.removeEventListener('track-item-select', handleTrackItemSelect);
    };
  }, [getActiveItems, onItemSelect]);

  return (
    <div 
      className="video-preview-container" 
      ref={containerRef}
      style={{ width, height }}
    >
      <div className="video-wrapper" style={{ transform: `scale(${zoomLevel / 100})` }}>
        {videoSrc ? (
          <>
            <video
              ref={videoRef}
              className="preview-video"
              muted={true}
              playsInline
            />
            {renderElementsLayer()}
          </>
        ) : renderGridBackground()}
      </div>
      
      <div className="preview-controls">
        <div className="left-controls">
          <button 
            className="control-button"
            onClick={handlePlayPause}
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
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
            <span className="zoom-level">{zoomLevel}%</span>
            <button 
              className="zoom-button"
              onClick={handleZoomIn}
              title="放大"
            >
              <PlusOutlined />
            </button>
          </div>
          
          <button 
            className="control-button"
            onClick={handleFullscreen}
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview; 