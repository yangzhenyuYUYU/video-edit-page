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
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [itemStart, setItemStart] = useState({ x: 0, y: 0 });
  const [isResizing, setResizing] = useState(false);
  const [isRotating, setRotating] = useState(false);
  const [rotateStart, setRotateStart] = useState({ x: 0, y: 0, initialRotation: 0 });
  
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

  // 渲染预览效果
  const renderPreviewOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // 确保canvas尺寸与显示尺寸匹配
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 获取当前时间点的活动项目
    const activeItems = tracks
      .flatMap(track => 
        track.items.map(item => ({
          ...item,
          type: track.type,
          zIndex: item.zIndex || 0,
          // 为新添加的元素设置默认位置和尺寸
          x: item.x ?? 50, // 默认水平居中
          y: item.y ?? 50, // 默认垂直居中
          width: item.width ?? (item.type === 'text' ? 30 : 20), // 默认宽度
          height: item.height ?? 'auto', // 默认高度
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

    console.log('Active items:', activeItems);
    
    // 渲染每个活动项目
    activeItems.forEach(item => {
      const x = (item.x / 100) * canvas.width;
      const y = (item.y / 100) * canvas.height;
      
      ctx.save();
      
      // 应用变换
      ctx.translate(x, y);
      ctx.rotate(item.rotation * Math.PI / 180);
      ctx.scale(item.scale, item.scale);
      ctx.globalAlpha = item.opacity;
      
      // 根据类型渲染
      switch(item.type) {
        case 'text':
          renderText(ctx, item, canvas);
          break;
        case 'image':
          renderImage(ctx, item, canvas);
          break;
        // 添加其他类型的渲染...
      }
      
      // 如果是选中项，绘制边框和控制点
      if (selectedItem?.id === item.id) {
        drawSelectionFrame(ctx, item, canvas);
      }
      
      ctx.restore();
    });
  }, [tracks, currentTime, selectedItem]);

  // 渲染文本
  const renderText = (ctx, item, canvas) => {
    const { content, textStyle = {} } = item;
    
    // 设置文本样式
    ctx.font = `${textStyle.fontWeight || 'normal'} ${textStyle.fontSize || 24}px ${textStyle.fontFamily || 'Arial'}`;
    ctx.fillStyle = textStyle.color || '#ffffff';
    ctx.textAlign = textStyle.textAlign || 'center';
    ctx.textBaseline = 'middle';
    
    // 添加文本阴影
    if (textStyle.textShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // 绘制文本
    ctx.fillText(content, 0, 0);
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };

  // 渲染图片
  const renderImage = (ctx, item, canvas) => {
    if (!item.src) return;
    
    const image = new Image();
    image.src = item.src;
    
    image.onload = () => {
      const width = item.width ? (item.width / 100) * canvas.width : image.width;
      const height = item.height === 'auto' ? (width * image.height / image.width) : (item.height / 100) * canvas.height;
      
      ctx.drawImage(image, -width/2, -height/2, width, height);
      
      // 重新渲染以确保图片显示
      renderPreviewOverlay();
    };
  };

  // 绘制选中框和控制点
  const drawSelectionFrame = (ctx, item, canvas) => {
    const width = item.width ? (item.width / 100) * canvas.width : 100;
    const height = item.height === 'auto' ? width : (item.height / 100) * canvas.height;
    
    // 绘制选中框
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-width/2, -height/2, width, height);
    
    // 绘制控制点
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    // 角点 - 添加缩放控制点
    const controlPoints = [
      { x: -width/2, y: -height/2, cursor: 'nw-resize' }, // 左上
      { x: width/2, y: -height/2, cursor: 'ne-resize' },  // 右上
      { x: width/2, y: height/2, cursor: 'se-resize' },   // 右下
      { x: -width/2, y: height/2, cursor: 'sw-resize' },  // 左下
      { x: 0, y: -height/2, cursor: 'n-resize' },         // 上中
      { x: width/2, y: 0, cursor: 'e-resize' },           // 右中
      { x: 0, y: height/2, cursor: 's-resize' },          // 下中
      { x: -width/2, y: 0, cursor: 'w-resize' }           // 左中
    ];
    
    controlPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // 旋转控制点
    const rotateHandleDistance = 30;
    ctx.beginPath();
    ctx.moveTo(0, -height/2);
    ctx.lineTo(0, -height/2 - rotateHandleDistance);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, -height/2 - rotateHandleDistance, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // 处理鼠标事件
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击到控制点
    if (selectedItem) {
      const controlPoint = findClickedControlPoint(x, y);
      if (controlPoint) {
        // 处理控制点操作
        handleControlPointDrag(controlPoint, x, y);
        return;
      }
    }
    
    // 检查是否点击到元素
    const clickedItem = findClickedItem(x, y);
    
    if (clickedItem) {
      setSelectedItem(clickedItem);
      onItemSelect?.(clickedItem);
      
      setIsDragging(true);
      setDragStart({ x, y });
      setItemStart({ 
        x: clickedItem.x, 
        y: clickedItem.y 
      });
    } else {
      setSelectedItem(null);
      onItemSelect?.(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isRotating) {
      handleRotate(e);
    } else if (isResizing) {
      handleResize(e);
    } else if (isDragging) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      const newX = itemStart.x + (deltaX / rect.width) * 100;
      const newY = itemStart.y + (deltaY / rect.height) * 100;
      
      const updatedItem = {
        ...selectedItem,
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY))
      };
      
      onItemChange?.(updatedItem);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(false);
    setRotating(false);
  };

  // 查找点击的元素
  const findClickedItem = (x, y) => {
    const canvas = canvasRef.current;
    const activeItems = tracks
      .flatMap(track => 
        track.items.map(item => ({...item, type: track.type}))
      )
      .filter(item => 
        item.start <= currentTime && 
        item.start + item.duration > currentTime
      )
      .reverse(); // 从上层往下检查
    
    return activeItems.find(item => {
      const itemX = (item.x / 100) * canvas.width;
      const itemY = (item.y / 100) * canvas.height;
      const width = (item.width / 100) * canvas.width;
      const height = item.height === 'auto' ? width : (item.height / 100) * canvas.height;
      
      return x >= itemX - width/2 &&
             x <= itemX + width/2 &&
             y >= itemY - height/2 &&
             y <= itemY + height/2;
    });
  };

  // 查找点击的控制点
  const findClickedControlPoint = (x, y) => {
    if (!selectedItem) return null;
    
    const canvas = canvasRef.current;
    const width = (selectedItem.width / 100) * canvas.width;
    const height = selectedItem.height === 'auto' ? width : (selectedItem.height / 100) * canvas.height;
    const itemX = (selectedItem.x / 100) * canvas.width;
    const itemY = (selectedItem.y / 100) * canvas.height;
    
    // 定义控制点位置
    const controlPoints = [
      { x: itemX - width/2, y: itemY - height/2, type: 'nw' },
      { x: itemX + width/2, y: itemY - height/2, type: 'ne' },
      { x: itemX + width/2, y: itemY + height/2, type: 'se' },
      { x: itemX - width/2, y: itemY + height/2, type: 'sw' },
      { x: itemX, y: itemY - height/2 - 30, type: 'rotate' }
    ];
    
    // 检查是否点击到控制点
    return controlPoints.find(point => {
      const dx = x - point.x;
      const dy = y - point.y;
      return Math.sqrt(dx * dx + dy * dy) <= 6;
    });
  };

  // 处理控制点拖拽
  const handleControlPointDrag = (controlPoint, startX, startY) => {
    const type = controlPoint.type;
    if (type === 'rotate') {
      setRotating(true);
      setRotateStart({
        x: startX,
        y: startY,
        initialRotation: selectedItem.rotation || 0
      });
    } else {
      setResizing(true);
      setDragStart({ x: startX, y: startY });
      setItemStart({
        width: selectedItem.width,
        height: selectedItem.height
      });
    }
  };

  // 处理旋转
  const handleRotate = (e) => {
    if (!isRotating || !selectedItem) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const centerX = (selectedItem.x / 100) * rect.width;
    const centerY = (selectedItem.y / 100) * rect.height;
    
    const startAngle = Math.atan2(
      rotateStart.y - centerY,
      rotateStart.x - centerX
    );
    const currentAngle = Math.atan2(
      e.clientY - rect.top - centerY,
      e.clientX - rect.left - centerX
    );
    
    let rotation = (currentAngle - startAngle) * (180 / Math.PI) + rotateStart.initialRotation;
    rotation = ((rotation % 360) + 360) % 360; // 标准化角度到0-360
    
    const updatedItem = {
      ...selectedItem,
      rotation
    };
    
    onItemChange?.(updatedItem);
  };

  // 处理缩放
  const handleResize = (e) => {
    if (!isResizing || !selectedItem) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    let newWidth = itemStart.width;
    let newHeight = itemStart.height;
    
    // 根据不同的控制点计算新的尺寸
    if (isResizing.includes('w')) {
      newWidth = itemStart.width - (deltaX / rect.width) * 100;
    } else if (isResizing.includes('e')) {
      newWidth = itemStart.width + (deltaX / rect.width) * 100;
    }
    
    if (isResizing.includes('n')) {
      newHeight = itemStart.height - (deltaY / rect.height) * 100;
    } else if (isResizing.includes('s')) {
      newHeight = itemStart.height + (deltaY / rect.height) * 100;
    }
    
    // 确保最小尺寸
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);
    
    const updatedItem = {
      ...selectedItem,
      width: newWidth,
      height: newHeight
    };
    
    onItemChange?.(updatedItem);
  };

  // 设置渲染循环
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      renderPreviewOverlay();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [renderPreviewOverlay]);

  // 添加事件监听
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, selectedItem, dragStart, itemStart, rotateStart]);

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
            <canvas 
              ref={canvasRef}
              className={`effects-canvas ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isRotating ? 'rotating' : ''}`}
            />
          </>
        ) : (
          <div className="grid-background">
            <div className="grid-pattern"></div>
            <div className="upload-hint">
              <div className="hint-icon">
                <VideoCameraOutlined />
              </div>
              <div className="hint-text">点击左侧素材添加视频</div>
            </div>
          </div>
        )}
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