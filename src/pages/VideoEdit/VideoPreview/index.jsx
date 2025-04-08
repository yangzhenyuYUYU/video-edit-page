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
import './index.scss';
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
  onRotateStart,
  zoomLevel = 100
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  
  // 计算位置和尺寸
  const baseWidth = containerSize.width * (zoomLevel / 100);
  const baseHeight = containerSize.height * (zoomLevel / 100);
  
  const x = (item.x / 100) * baseWidth;
  const y = (item.y / 100) * baseHeight;
  
  // 边界检查
  const boundedX = Math.max(0, Math.min(baseWidth, x));
  const boundedY = Math.max(0, Math.min(baseHeight, y));

  // 计算元素尺寸
  const width = item.width ? (item.width / 100) * baseWidth : 'auto';
  const height = item.height ? (item.height / 100) * baseHeight : 'auto';

  // 处理点击
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect?.(item);
  };

  // 处理拖拽开始
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || containerSize.width === 0) {
      console.error('Container reference or size not available');
      return;
    }
    
    setIsDragging(true);
    onSelect?.(item);
    
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialElementX = parseFloat(item.x || 0);
    const initialElementY = parseFloat(item.y || 0);
    
    const initialContainerRect = containerRef.current.getBoundingClientRect();
    const initialContainerWidth = containerSize.width;
    const initialContainerHeight = containerSize.height;
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'grabbing';
    document.body.appendChild(overlay);
    
    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      
      const deltaXPercent = (deltaX / initialContainerWidth) * 100;
      const deltaYPercent = (deltaY / initialContainerHeight) * 100;
      
      const newX = initialElementX + deltaXPercent;
      const newY = initialElementY + deltaYPercent;
      
      const boundedX = Math.max(0, Math.min(100, newX));
      const boundedY = Math.max(0, Math.min(100, newY));
      
      const updatedItem = {
        ...item,
        x: parseFloat(boundedX.toFixed(4)),
        y: parseFloat(boundedY.toFixed(4))
      };
      
      onChange?.(updatedItem);
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.removeChild(overlay);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 当元素被选中时触发事件
  useEffect(() => {
    if (isSelected) {
      const selectEvent = new CustomEvent('preview-element-select', {
        detail: {
          itemId: item.id,
          trackId: item.trackId,
          type: item.type
        }
      });
      document.dispatchEvent(selectEvent);
    }
  }, [isSelected, item]);

  // 图片样式
  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '4px'
  };

  // 文本样式
  const textStyle = {
    color: item.textStyle?.color || '#FFFFFF',
    fontSize: item.textStyle?.fontSize ? 
      `${item.textStyle.fontSize * (zoomLevel / 100)}px` : 
      `${24 * (zoomLevel / 100)}px`,
    fontFamily: item.textStyle?.fontFamily || 'MiSans',
    fontWeight: item.textStyle?.fontWeight || 'normal',
    fontStyle: item.textStyle?.fontStyle || 'normal',
    textAlign: item.textStyle?.textAlign || 'center',
    letterSpacing: item.textStyle?.letterSpacing ? `${item.textStyle.letterSpacing}px` : '0',
    lineHeight: item.textStyle?.lineHeight || 1.5,
    WebkitTextStroke: item.textStyle?.WebkitTextStroke || 'none',
    textShadow: item.textStyle?.textShadow || '2px 2px 4px rgba(0,0,0,0.5)',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  };

  const handleRotateStart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 获取元素的中心点
    const element = document.getElementById(`element-${item.id}`);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 计算相对于容器的中心点
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    
    const startAngle = Math.atan2(
      e.clientY - (containerRect.top + centerY),
      e.clientX - (containerRect.left + centerX)
    );
    
    const startRotation = item.rotation || 0;
    
    const onMouseMove = (moveEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - (containerRect.top + centerY),
        moveEvent.clientX - (containerRect.left + centerX)
      );
      
      // 增加旋转灵敏度，通过乘以系数
      const rotation = startRotation + (currentAngle - startAngle) * (180 / Math.PI) * 1.5;
      
      // 限制旋转角度在 -180 到 180 度之间
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const boundedRotation = normalizedRotation > 180 ? normalizedRotation - 360 : normalizedRotation;
      
      // 使用 CSS3 transform 实现旋转，保持中心点不变
      if (element) {
        // 保持元素在容器中的相对位置
        const x = (item.x / 100) * containerSize.width;
        const y = (item.y / 100) * containerSize.height;
        
        element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.webkitTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.MozTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.msTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.OTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
      }
      
      onChange?.({
        ...item,
        rotation: boundedRotation
      });
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      id={`element-${item.id}`}
      className={`text-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`,
        width,
        height,
        opacity: item.opacity ?? 1,
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 999 : item.zIndex || 0
      }}
      onMouseDown={handleDragStart}
      onClick={handleClick}
    >
      {item.url ? (
        <img 
          src={item.url}
          alt={item.content}
          style={imageStyle}
        />
      ) : (
        <div 
          className="text-content" 
          style={textStyle}
        >
          {item.content}
        </div>
      )}
      
      {isSelected && (
        <div className="resize-rotate-handles">
          <div className="handle nw" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'nw'); }} />
          <div className="handle ne" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'ne'); }} />
          <div className="handle se" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'se'); }} />
          <div className="handle sw" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'sw'); }} />
          <div className="rotate-handle" onMouseDown={(e) => handleRotateStart(e, item)} />
        </div>
      )}
    </div>
  );
};

// 图片元素组件
const ImageElement = ({
  item,
  isSelected,
  containerSize,
  containerRef,
  onSelect,
  onChange,
  onResizeStart,
  onRotateStart
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  
  // 计算实际元素位置时考虑容器的9:16比例
  const x = (item.x / 100) * containerSize.width;
  const y = (item.y / 100) * containerSize.height;
  const width = item.width ? (item.width / 100) * containerSize.width : 'auto';
  const height = item.height ? (item.height / 100) * containerSize.height : 'auto';

  // 处理拖拽开始
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || containerSize.width === 0) {
      console.error('Container reference or size not available');
      return;
    }
    
    setIsDragging(true);
    onSelect?.(item); // 确保选中当前元素
    
    // 记录初始鼠标位置和元素位置
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialElementX = parseFloat(item.x || 0);
    const initialElementY = parseFloat(item.y || 0);
    
    // 记录初始容器尺寸，用于计算比例一致性
    const initialContainerRect = containerRef.current.getBoundingClientRect();
    const initialContainerWidth = containerSize.width; // 使用状态中的尺寸，确保一致性
    const initialContainerHeight = containerSize.height; // 使用状态中的尺寸，确保一致性
    
    // 创建全屏覆盖层以捕获所有鼠标事件
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'grabbing';
    document.body.appendChild(overlay);
    
    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      // 计算鼠标移动的距离（像素）
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      
      // 将像素距离转换为百分比，使用初始容器尺寸确保比例一致
      const deltaXPercent = (deltaX / initialContainerWidth) * 100;
      const deltaYPercent = (deltaY / initialContainerHeight) * 100;
      
      // 计算新的元素位置（百分比）
      const newX = initialElementX + deltaXPercent;
      const newY = initialElementY + deltaYPercent;
      
      // 边界限制
      const boundedX = Math.max(0, Math.min(100, newX));
      const boundedY = Math.max(0, Math.min(100, newY));
      
      // 更新元素位置 (保留4位小数精度)
      const updatedItem = {
        ...item,
        x: parseFloat(boundedX.toFixed(4)),
        y: parseFloat(boundedY.toFixed(4))
      };
      
      // 通知父组件位置变化
      onChange?.(updatedItem);
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      setIsDragging(false);
      
      // 移除事件监听
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // 移除覆盖层
      document.body.removeChild(overlay);
      
      console.log('图片拖拽结束');
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 处理旋转开始
  const handleRotateStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 获取元素的中心点
    const element = document.getElementById(`element-${item.id}`);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 计算相对于容器的中心点
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    
    const startAngle = Math.atan2(
      e.clientY - (containerRect.top + centerY),
      e.clientX - (containerRect.left + centerX)
    );
    
    const startRotation = item.rotation || 0;
    
    const onMouseMove = (moveEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - (containerRect.top + centerY),
        moveEvent.clientX - (containerRect.left + centerX)
      );
      
      // 增加旋转灵敏度，通过乘以系数
      const rotation = startRotation + (currentAngle - startAngle) * (180 / Math.PI) * 1.5;
      
      // 限制旋转角度在 -180 到 180 度之间
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const boundedRotation = normalizedRotation > 180 ? normalizedRotation - 360 : normalizedRotation;
      
      // 使用 CSS3 transform 实现旋转，保持中心点不变
      if (element) {
        // 保持元素在容器中的相对位置
        const x = (item.x / 100) * containerSize.width;
        const y = (item.y / 100) * containerSize.height;
        
        element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.webkitTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.MozTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.msTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
        element.style.OTransform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${boundedRotation}deg) scale(${item.scale || 1})`;
      }
      
      onChange?.({
        ...item,
        rotation: boundedRotation
      });
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 处理缩放开始
  const handleResizeStart = (e, corner) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 确保元素被选中
    onSelect?.(item);
    
    // 获取元素的当前尺寸和位置
    const elementId = `element-${item.id}`;
    const element = document.getElementById(elementId);
    let elementRect;
    
    if (element) {
      elementRect = element.getBoundingClientRect();
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const startData = {
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: item.width || 20,
      startHeight: item.height || 20,
      startScale: item.scale || 1,
      elementRect,
      containerRect
    };
    
    // 创建一个透明覆盖层，捕获所有鼠标事件
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = `${corner}-resize`;
    document.body.appendChild(overlay);
    
    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      if (!startData || !item) return;
      
      // 获取容器的边界
      const rect = containerRef.current.getBoundingClientRect();
      
      // 计算在容器内的相对位置变化（以百分比形式）
      const deltaXPercent = ((moveEvent.clientX - startData.startX) / rect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - startData.startY) / rect.height) * 100;
      
      let newWidth = startData.startWidth;
      let newHeight = startData.startHeight;
      
      // 根据不同角落调整大小
      switch (startData.corner) {
        case 'se': // 右下角
          newWidth = Math.max(5, startData.startWidth + deltaXPercent);
          newHeight = Math.max(5, startData.startHeight + deltaYPercent);
          break;
        case 'sw': // 左下角
          newWidth = Math.max(5, startData.startWidth - deltaXPercent);
          newHeight = Math.max(5, startData.startHeight + deltaYPercent);
          break;
        case 'ne': // 右上角
          newWidth = Math.max(5, startData.startWidth + deltaXPercent);
          newHeight = Math.max(5, startData.startHeight - deltaYPercent);
          break;
        case 'nw': // 左上角
          newWidth = Math.max(5, startData.startWidth - deltaXPercent);
          newHeight = Math.max(5, startData.startHeight - deltaYPercent);
          break;
      }
      
      // 更新元素尺寸
      const updatedItem = {
        ...item,
        width: parseFloat(newWidth.toFixed(4)),
        height: parseFloat(newHeight.toFixed(4))
      };
      
      onChange?.(updatedItem);
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.removeChild(overlay);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 当元素被选中时，触发轨道项目选择
  useEffect(() => {
    if (isSelected) {
      // 触发轨道编辑器的选中事件
      const trackSelectEvent = new CustomEvent('track-item-select', {
        detail: {
          itemId: item.id,
          trackId: item.trackId,
          type: item.type,
          item: item
        }
      });
      document.dispatchEvent(trackSelectEvent);
      
      // 触发预览区域的选中事件
      const previewSelectEvent = new CustomEvent('preview-element-select', {
        detail: {
          itemId: item.id,
          trackId: item.trackId,
          type: item.type,
          item: item
        }
      });
      document.dispatchEvent(previewSelectEvent);
      
      // 更新DOM选中状态
      setTimeout(() => {
        // 更新预览区域的选中状态
        const previewElement = document.getElementById(`element-${item.id}`);
        if (previewElement) {
          document.querySelectorAll('.text-element.selected, .image-element.selected').forEach(el => {
            if (el.id !== `element-${item.id}`) {
              el.classList.remove('selected');
            }
          });
          previewElement.classList.add('selected');
        }
        
        // 更新轨道项目的选中状态
        const trackElement = document.querySelector(`[data-track-item-id="${item.id}"]`);
        if (trackElement) {
          document.querySelectorAll('.track-item.selected').forEach(el => {
            if (el.getAttribute('data-track-item-id') !== item.id) {
              el.classList.remove('selected');
            }
          });
          trackElement.classList.add('selected');
        }
      }, 0);
    }
  }, [isSelected, item]);

  return (
    <div 
      id={`element-${item.id}`}
      className={`image-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`,
        width,
        height,
        opacity: item.opacity ?? 1,
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 999 : item.zIndex || 0 // 确保选中的元素在最上层
      }}
      onMouseDown={handleDragStart}
      onClick={(e) => {
        console.log('图片元素被点击:', item.id);
        e.stopPropagation();
        onSelect?.(item);
      }}
    >
      <img 
        src={item.src} 
        alt={item.alt || 'Image element'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none' // 确保图片不捕获鼠标事件
        }}
      />
      
      {isSelected && (
        <div className="resize-rotate-handles">
          {/* 缩放控制点 */}
          <div className="handle nw" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'nw'); }} />
          <div className="handle ne" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'ne'); }} />
          <div className="handle se" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'se'); }} />
          <div className="handle sw" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, 'sw'); }} />
          
          {/* 旋转控制点 */}
          <div className="rotate-handle" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); handleRotateStart(e); }} />
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
  const audioRefs = useRef({}); // 音频元素引用
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
    // 先获取所有在当前时间点应该显示的项目
    const activeItems = tracks
      .flatMap((track, trackIndex) => 
        track.items.map(item => {
          // 只处理当前时间点需要显示的项目
          if (!(item.start <= currentTime && item.start + item.duration > currentTime)) {
            return null;
          }
          
          // 检查是否是新添加的元素（没有位置信息）
          const isNewItem = item.x === undefined && item.y === undefined;
          
          // 为每个元素创建一个唯一的渲染ID，包含trackId和itemId，确保同一轨道的不同元素都能显示
          const renderKey = `${track.id}_${item.id}`;
          
          // 轨道索引越小，层级值越大，确保轨道列表前面的元素层级更高
          const zIndexBase = (tracks.length - trackIndex) * 100;
          
          // 如果是背景元素，设置特殊属性
          if (track.type === TRACK_TYPES.BACKGROUND || item.isBackground) {
            return {
              ...item,
              renderKey,
              type: track.type,
              trackId: track.id,
              zIndex: -1,
              x: 50,
              y: 50,
              width: 100,
              height: 100,
              isBackground: true,
              opacity: item.opacity ?? 1 // 默认完全不透明
            };
          }
          
          // 为新元素设置中心点位置、合理的尺寸和z-index
          const newItem = {
            ...item,
            renderKey,
            type: track.type,
            trackId: track.id,
            zIndex: zIndexBase + (item.zIndex || 0),
            x: isNewItem ? 50 : item.x,
            y: isNewItem ? 50 : item.y,
            width: item.width ?? (item.type === TRACK_TYPES.TEXT ? 30 : 20),
            height: item.height ?? 'auto',
            rotation: item.rotation ?? 0,
            scale: item.scale ?? 1,
            opacity: item.opacity ?? 1, // 默认完全不透明
            isNew: isNewItem
          };
          
          return newItem;
        }).filter(Boolean)
      )
      .sort((a, b) => {
        if (a.isBackground && !b.isBackground) return -1;
        if (!a.isBackground && b.isBackground) return 1;
        return a.zIndex - b.zIndex;
      });
      
    return activeItems;
  }, [tracks, currentTime]);

  // 处理元素选择
  const handleElementSelect = (item) => {
    // 防止重复选择同一个元素导致状态错误
    if (selectedItem && selectedItem.id === item.id) {
      return;
    }
    
    // 保持原有的opacity值
    const updatedItem = {
      ...item,
      opacity: item.opacity === undefined ? 1 : item.opacity
    };
    
    setSelectedItem(updatedItem);
    
    // 通知上层组件
    onItemSelect?.(updatedItem);
    
    // 触发轨道编辑器的选中事件
    const trackSelectEvent = new CustomEvent('track-item-select', {
      detail: {
        itemId: item.id,
        trackId: item.trackId,
        type: item.type,
        item: updatedItem
      }
    });
    document.dispatchEvent(trackSelectEvent);
    
    // 触发预览区域的选中事件
    const previewSelectEvent = new CustomEvent('preview-element-select', {
      detail: {
        itemId: item.id,
        trackId: item.trackId,
        type: item.type,
        item: updatedItem
      }
    });
    document.dispatchEvent(previewSelectEvent);
    
    // 在DOM中添加高亮标记
    setTimeout(() => {
      // 更新预览区域的选中状态
      const previewElement = document.getElementById(`element-${item.id}`);
      if (previewElement) {
        // 移除所有其他元素的选中状态
        document.querySelectorAll('.text-element.selected, .image-element.selected').forEach(el => {
          if (el.id !== `element-${item.id}`) {
            el.classList.remove('selected');
          }
        });
        
        // 添加选中状态
        previewElement.classList.add('selected');
      }
      
      // 更新轨道项目的选中状态
      const trackElement = document.querySelector(`[data-track-item-id="${item.id}"]`);
      if (trackElement) {
        // 移除所有轨道项目的选中状态
        document.querySelectorAll('.track-item.selected').forEach(el => {
          if (el.getAttribute('data-track-item-id') !== item.id) {
            el.classList.remove('selected');
          }
        });
        
        // 添加选中状态
        trackElement.classList.add('selected');
      }
    }, 0);
  };

  // 处理元素属性变更
  const handleElementChange = (updatedItem) => {
    // 保存当前选中状态
    const wasSelected = updatedItem && selectedItem && updatedItem.id === selectedItem.id;
    
    // 确保opacity值被正确保持
    const itemWithOpacity = {
      ...updatedItem,
      opacity: updatedItem.opacity === undefined ? 1 : updatedItem.opacity
    };
    
    // 更新当前选中的item
    setSelectedItem(itemWithOpacity);
    
    // 通知外部处理变更
    onItemChange?.(itemWithOpacity);
    
    // 确保元素保持选中状态
    if (wasSelected) {
      setTimeout(() => {
        const element = document.getElementById(`element-${updatedItem.id}`);
        if (element) {
          element.classList.add('selected');
        }
      }, 0);
    }
  };

  // 处理缩放开始
  const handleResizeStart = (e, corner) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!selectedItem) return;
    
    // 确保元素仍然被选中
    onItemSelect?.(selectedItem);

    // 获取元素的当前尺寸和位置
    const elementId = `element-${selectedItem.id}`;
    const element = document.getElementById(elementId);
    let elementRect;
    
    if (element) {
      elementRect = element.getBoundingClientRect();
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const startData = {
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: selectedItem.width || 20,
      startHeight: selectedItem.height || 20,
      startScale: selectedItem.scale || 1,
      elementRect,
      containerRect
    };
    
    console.log('缩放开始:', startData);
    setResizeStart(startData);

    // 创建一个透明覆盖层，捕获所有鼠标事件
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = `${corner}-resize`; // 会根据角落自动改变
    document.body.appendChild(overlay);

    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      if (!startData || !selectedItem) return;
  
      // 获取容器的边界
      const rect = containerRef.current.getBoundingClientRect();
      
      // 计算在容器内的相对位置变化（以百分比形式）
      const deltaXPercent = ((moveEvent.clientX - startData.startX) / rect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - startData.startY) / rect.height) * 100;
      
      console.log('Resize delta:', { deltaXPercent, deltaYPercent });
      
      let newWidth = startData.startWidth || 20;
      let newHeight = startData.startHeight || 20;
      
      // 根据不同角落调整大小
      switch (startData.corner) {
        case 'se': // 右下角
          newWidth = Math.max(5, startData.startWidth + deltaXPercent);
          newHeight = Math.max(5, startData.startHeight + deltaYPercent);
          overlay.style.cursor = 'se-resize';
          break;
        case 'sw': // 左下角
          newWidth = Math.max(5, startData.startWidth - deltaXPercent);
          newHeight = Math.max(5, startData.startHeight + deltaYPercent);
          overlay.style.cursor = 'sw-resize';
          break;
        case 'ne': // 右上角
          newWidth = Math.max(5, startData.startWidth + deltaXPercent);
          newHeight = Math.max(5, startData.startHeight - deltaYPercent);
          overlay.style.cursor = 'ne-resize';
          break;
        case 'nw': // 左上角
          newWidth = Math.max(5, startData.startWidth - deltaXPercent);
          newHeight = Math.max(5, startData.startHeight - deltaYPercent);
          overlay.style.cursor = 'nw-resize';
          break;
      }
      
      console.log('New dimensions:', { newWidth, newHeight });
      
      // 所有元素类型都应用尺寸调整和缩放
      const scaleFactor = newWidth / startData.startWidth;
      
      // 记录当前选中的元素ID，用于防止状态丢失
      const currentSelectedId = selectedItem.id;
      
      // 更新元素
      const updatedItem = {
        ...selectedItem,
        width: newWidth,
        height: newHeight,
        scale: Math.max(0.1, startData.startScale * scaleFactor)
      };
      
      handleElementChange(updatedItem);
      
      // 确保选中状态不会丢失
      setTimeout(() => {
        if (selectedItem?.id !== currentSelectedId) {
          // 如果选中状态已丢失，重新设置
          setSelectedItem(updatedItem);
          onItemSelect?.(updatedItem);
        }
      }, 0);
      
      console.log('Element resize:', { 
        type: selectedItem.type,
        scale: updatedItem.scale,
        width: updatedItem.width, 
        height: updatedItem.height 
      });
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      setResizeStart(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // 移除覆盖层
      document.body.removeChild(overlay);
      
      // 确保元素仍然被选中
      setTimeout(() => {
        if (selectedItem) {
          onItemSelect?.(selectedItem);
        }
      }, 50);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 监听轨道选择变化，同步预览区域的选择状态
  useEffect(() => {
    const handleTrackItemSelect = (event) => {
      const { detail } = event;
      if (!detail) return;
      
      // 根据轨道选择找到对应的预览元素
      const activeItems = getActiveItems();
      const matchedItem = activeItems.find(item => item.id === detail.itemId);
      
      if (matchedItem) {
        console.log('找到匹配元素，设置选中状态:', matchedItem);
        setSelectedItem(matchedItem);
        
        // 通知上层组件此元素被选中
        onItemSelect?.(matchedItem);
        
        // 在DOM中添加高亮标记
        const element = document.getElementById(`element-${matchedItem.id}`);
        if (element) {
          // 移除所有其他元素的选中状态
          document.querySelectorAll('.text-element.selected, .image-element.selected').forEach(el => {
            if (el.id !== `element-${matchedItem.id}`) {
              el.classList.remove('selected');
            }
          });
          
          // 添加选中状态
          element.classList.add('selected');
        }
      } else {
        console.log('未找到匹配元素，清除选中状态');
        setSelectedItem(null);
      }
    };

    // 监听轨道选择事件
    document.addEventListener('track-item-select', handleTrackItemSelect);
    return () => {
      document.removeEventListener('track-item-select', handleTrackItemSelect);
    };
  }, [getActiveItems, onItemSelect]);

  // 更新容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        // 获取容器的宽度和高度（不包括控制区）
        const containerWidth = rect.width;
        const containerHeight = rect.height - 40; // 减去控制器高度
        
        // 基于9:16比例计算视频容器的尺寸
        let width, height;
        
        // 计算可能的尺寸
        const heightBasedOnWidth = containerWidth * (16/9);
        const widthBasedOnHeight = containerHeight * (9/16);
        
        // 选择合适的尺寸
        if (heightBasedOnWidth <= containerHeight) {
          // 如果基于宽度计算的高度小于等于容器高度，则宽度限制优先
          width = containerWidth;
          height = heightBasedOnWidth;
        } else {
          // 否则，高度限制优先
          width = widthBasedOnHeight;
          height = containerHeight;
        }
        
        // 更新尺寸状态，只有在尺寸确实变化时才更新
        if (width !== containerSize.width || height !== containerSize.height) {
          console.log('容器尺寸更新:', { width, height });
          setContainerSize({
            width,
            height
          });
        }
      }
    };

    // 立即运行一次
    updateSize();
    
    // 使用ResizeObserver来监听容器尺寸变化，比window.resize更精确
    let resizeObserver;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
    } else {
      // 如果ResizeObserver不可用，退回到window.resize事件
      window.addEventListener('resize', updateSize);
    }
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateSize);
      }
    };
  }, []);

  // 监测新添加的元素并自动选中，确保容器尺寸已初始化
  useEffect(() => {
    if (containerSize.width === 0) return; // 等待容器尺寸初始化完成
    
    const activeItems = getActiveItems();
    
    // 查找是否有新添加的元素（没有位置信息的）
    const newItems = activeItems.filter(item => 
      item.isNew && !item._positioned // 使用isNew标记和_positioned来跟踪
    );
    
    if (newItems.length > 0) {
      // 选中最新添加的元素
      const newestItem = newItems[newItems.length - 1];
      
      // 标记这个元素已经被处理过
      newestItem._positioned = true;
      
      // 确保新元素在视口中心
      const updatedItem = {
        ...newestItem,
        x: 50, // 确保水平居中
        y: 50, // 确保垂直居中
      };
      
      // 选中该元素并通知变更
      handleElementSelect(updatedItem);
      onItemChange?.(updatedItem);
      
      console.log('新元素添加并居中:', updatedItem);
    }
  }, [tracks, getActiveItems, containerSize]);

  // 渲染元素层
  const renderElementsLayer = () => {
    const activeItems = getActiveItems();
    const backgroundItems = activeItems.filter(item => item.isBackground || item.type === TRACK_TYPES.BACKGROUND);
    const foregroundItems = activeItems.filter(item => !item.isBackground && item.type !== TRACK_TYPES.BACKGROUND);
    
    return (
      <div 
        className="elements-layer"
        onClick={(e) => {
          // 只在没有选中元素时才阻止事件冒泡
          if (!selectedItem) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseDown={(e) => {
          // 只在没有选中元素时才阻止事件冒泡
          if (!selectedItem) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{ zIndex: 20 }} // 确保元素层在视频上方
      >
        {/* 先渲染背景元素 */}
        {backgroundItems.length > 0 && (
          <div 
            className="backgrounds-container" 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1, // 改用正数但很小的z-index，确保在视频下方
              overflow: 'hidden',
              pointerEvents: 'none' // 背景整体不捕获鼠标事件
            }}
          >
            {backgroundItems.map(item => (
              <div 
                key={item.renderKey || item.id}
                className="background-element"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none' // 背景不捕获鼠标事件
                }}
              >
                <img 
                  src={item.src}
                  alt={item.content || "背景"}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: item.opacity ?? 1
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 然后渲染前景元素 */}
        {foregroundItems.map(item => {
          if (item.type === TRACK_TYPES.TEXT) {
            return (
              <TextElement
                key={item.renderKey || item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                containerSize={containerSize}
                containerRef={containerRef}
                onSelect={handleElementSelect}
                onChange={handleElementChange}
                onResizeStart={handleResizeStart}
                onRotateStart={(e) => handleRotateStart(e, item)}
              />
            );
          } else if (item.type === TRACK_TYPES.IMAGE) {
            return (
              <ImageElement
                key={item.renderKey || item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                containerSize={containerSize}
                containerRef={containerRef}
                onSelect={handleElementSelect}
                onChange={handleElementChange}
                onResizeStart={handleResizeStart}
                onRotateStart={(e) => handleRotateStart(e, item)}
              />
            );
          }
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

  // 音频播放状态同步
  useEffect(() => {
    // 获取当前时间点活跃的音频轨道项目
    const audioTracks = tracks.filter(track => track.type === TRACK_TYPES.AUDIO);
    if (audioTracks.length === 0) return;
    
    // 遍历所有音频项，决定播放或暂停
    audioTracks.flatMap(track => track.items).forEach(item => {
      const audioRef = audioRefs.current[item.id];
      if (!audioRef) return;
      
      // 是否是当前应该播放的音频
      const isActive = item.start <= currentTime && (item.start + item.duration) > currentTime;
      
      // 如果视频正在播放且该音频处于活跃状态
      if (isPlaying && isActive) {
        // 计算应该在哪个位置播放（当前时间 - 音频开始时间）
        const audioPosition = Math.max(0, currentTime - item.start);
        
        // 如果音频不在播放中或位置不正确，调整位置并播放
        if (Math.abs(audioRef.currentTime - audioPosition) > 0.1 || audioRef.paused) {
          audioRef.currentTime = audioPosition;
          audioRef.play().catch(error => {
            console.error('音频播放失败:', error);
          });
        }
      } else {
        // 如果视频暂停或不在活跃范围内，暂停播放
        if (!audioRef.paused) {
          audioRef.pause();
        }
      }
    });
  }, [tracks, currentTime, isPlaying]);

  return (
    <div 
      className="video-preview-container" 
      ref={containerRef}
      style={{ width, height }}
      onClick={(e) => {
        console.log('视频预览容器被点击');
        e.preventDefault(); // 添加阻止默认行为
        e.stopPropagation(); // 添加阻止事件冒泡
      }}
    >
      <div 
        className="video-wrapper" 
        style={{ transform: `scale(${zoomLevel / 100})` }}
        onClick={(e) => {
          // 只在没有选中元素时才阻止事件冒泡
          if (!selectedItem) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {videoSrc ? (
          <>
            {/* 1. 先渲染背景元素（最底层） */}
            {renderBackgrounds()}
            
            {/* 2. 渲染音频元素（不可见） */}
            {renderAudioElements()}
            
            {/* 3. 然后是视频（中间层） */}
            <video
              ref={videoRef}
              className="preview-video"
              muted={true}
              playsInline
              style={{ zIndex: 10 }} // 确保视频在背景上方
              onClick={(e) => {
                // 只在没有选中元素时才阻止事件冒泡
                if (!selectedItem) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
            
            {/* 4. 最后是前景元素（最上层） */}
            {renderForeground()}
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

  // 单独渲染背景元素
  function renderBackgrounds() {
    const activeItems = getActiveItems();
    const backgroundItems = activeItems.filter(item => item.isBackground || item.type === TRACK_TYPES.BACKGROUND);
    
    if (backgroundItems.length === 0) return null;
    
    return (
      <div 
        className="backgrounds-container" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1, // 使用较小的正整数确保背景在视频下方
          overflow: 'hidden',
          pointerEvents: 'none' // 背景整体不捕获鼠标事件
        }}
      >
        {backgroundItems.map(item => (
          <div 
            key={item.renderKey || item.id}
            className="background-element"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none' // 背景不捕获鼠标事件
            }}
          >
            <img 
              src={item.src}
              alt={item.content || "背景"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: item.opacity ?? 1
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 单独渲染前景元素
  function renderForeground() {
    const activeItems = getActiveItems();
    const foregroundItems = activeItems.filter(item => !item.isBackground && item.type !== TRACK_TYPES.BACKGROUND);
    
    return (
      <div 
        className="elements-layer"
        onClick={(e) => {
          // 只在没有选中元素时才阻止事件冒泡
          if (!selectedItem) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseDown={(e) => {
          // 只在没有选中元素时才阻止事件冒泡
          if (!selectedItem) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{ zIndex: 20 }} // 确保元素层在视频上方
      >
        {foregroundItems.map(item => {
          if (item.type === TRACK_TYPES.TEXT) {
            return (
              <TextElement
                key={item.renderKey || item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                containerSize={containerSize}
                containerRef={containerRef}
                onSelect={handleElementSelect}
                onChange={handleElementChange}
                onResizeStart={handleResizeStart}
                onRotateStart={(e) => handleRotateStart(e, item)}
              />
            );
          } else if (item.type === TRACK_TYPES.IMAGE) {
            return (
              <ImageElement
                key={item.renderKey || item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                containerSize={containerSize}
                containerRef={containerRef}
                onSelect={handleElementSelect}
                onChange={handleElementChange}
                onResizeStart={handleResizeStart}
                onRotateStart={(e) => handleRotateStart(e, item)}
              />
            );
          }
          return null;
        })}
      </div>
    );
  }

  // 渲染音频元素
  function renderAudioElements() {
    // 获取所有音频轨道
    const audioTracks = tracks.filter(track => track.type === TRACK_TYPES.AUDIO);
    if (audioTracks.length === 0) return null;
    
    return (
      <div style={{ display: 'none' }}>
        {audioTracks.flatMap(track => track.items).map(item => (
          <audio
            key={`audio-${item.id}`}
            ref={el => {
              if (el) audioRefs.current[item.id] = el;
              else delete audioRefs.current[item.id];
            }}
            src={item.src}
            preload="auto"
          />
        ))}
      </div>
    );
  }
};

export default VideoPreview;
