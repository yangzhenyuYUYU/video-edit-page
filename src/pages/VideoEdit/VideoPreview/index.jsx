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
  const elementRef = useRef(null);
  const textContentRef = useRef(null);
  
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

  // 监听文本内容大小变化
  useEffect(() => {
    if (!elementRef.current || !textContentRef.current || !isSelected) return;
    
    // 创建MutationObserver监听文本内容变化
    const textObserver = new MutationObserver(() => {
      if (textContentRef.current && elementRef.current) {
        // 获取文本内容元素的尺寸
        const textRect = textContentRef.current.getBoundingClientRect();
        const elementRect = elementRef.current.getBoundingClientRect();
        
        // 如果尺寸有差异，调整外层元素
        if (Math.abs(textRect.width - elementRect.width) > 2 || 
            Math.abs(textRect.height - elementRect.height) > 2) {
          
          // 强制刷新选中框效果
          requestAnimationFrame(() => {
            if (elementRef.current) {
              // 先移除选中类
              elementRef.current.classList.remove('selected');
              
              // 再添加回来触发重新计算
              setTimeout(() => {
                if (elementRef.current) {
                  elementRef.current.classList.add('selected');
                }
              }, 0);
            }
          });
        }
      }
    });
    
    // 配置观察选项
    const config = { 
      characterData: true, 
      childList: true, 
      subtree: true,
      attributes: true
    };
    
    // 开始观察
    textObserver.observe(textContentRef.current, config);
    
    // 创建ResizeObserver监听文本内容大小变化
    const resizeObserver = new ResizeObserver(entries => {
      // 处理大小变化
      if (textContentRef.current && elementRef.current) {
        // 强制刷新选中框，确保它适应新的内容尺寸
        elementRef.current.classList.remove('selected');
        requestAnimationFrame(() => {
          if (elementRef.current) {
            elementRef.current.classList.add('selected');
          }
        });
      }
    });
    
    // 同时监听文本内容元素的大小变化
    resizeObserver.observe(textContentRef.current);
    
    // 清理函数
    return () => {
      textObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [isSelected, item.content, item.textStyle]);

  // 监听文本元素大小变化
  useEffect(() => {
    if (!elementRef.current || !isSelected) return;
    
    // 创建ResizeObserver监听元素大小变化
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // 元素大小变化时，强制更新选中框
        if (entry.target.classList.contains('selected')) {
          // 通过移除再添加selected类，触发重新应用样式
          entry.target.classList.remove('selected');
          // 使用setTimeout确保DOM有时间更新
          setTimeout(() => {
            if (elementRef.current) {
              elementRef.current.classList.add('selected');
            }
          }, 0);
        }
      }
    });
    
    // 开始监听
    resizeObserver.observe(elementRef.current);
    
    // 清理函数
    return () => {
      resizeObserver.disconnect();
    };
  }, [isSelected]);

  // 处理拖拽开始
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || containerSize.width === 0) {
      console.error('Container reference or size not available');
      return;
    }
    
    setIsDragging(true);
    onSelect?.({...item, originalOpacity: item.opacity}); // 保存原始opacity值
    
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialElementX = parseFloat(item.x || 0);
    const initialElementY = parseFloat(item.y || 0);
    
    const initialContainerRect = containerRef.current.getBoundingClientRect();
    const initialContainerWidth = containerSize.width;
    const initialContainerHeight = containerSize.height;
    
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
    
    // 创建中心参考线
    const centerGuideVertical = document.createElement('div');
    centerGuideVertical.style.position = 'absolute';
    centerGuideVertical.style.top = '0';
    centerGuideVertical.style.left = '50%';
    centerGuideVertical.style.width = '2px';
    centerGuideVertical.style.height = '100%';
    centerGuideVertical.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
    centerGuideVertical.style.transform = 'translateX(-50%)';
    centerGuideVertical.style.zIndex = '9998';
    centerGuideVertical.style.opacity = '0'; // 确保初始透明度为0
    centerGuideVertical.style.pointerEvents = 'none';
    centerGuideVertical.style.transition = 'opacity 0.2s';
    centerGuideVertical.style.visibility = 'hidden'; // 添加visibility属性
    
    const centerGuideHorizontal = document.createElement('div');
    centerGuideHorizontal.style.position = 'absolute';
    centerGuideHorizontal.style.left = '0';
    centerGuideHorizontal.style.top = '50%';
    centerGuideHorizontal.style.width = '100%';
    centerGuideHorizontal.style.height = '2px';
    centerGuideHorizontal.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
    centerGuideHorizontal.style.transform = 'translateY(-50%)';
    centerGuideHorizontal.style.zIndex = '9998';
    centerGuideHorizontal.style.opacity = '0'; // 确保初始透明度为0
    centerGuideHorizontal.style.pointerEvents = 'none';
    centerGuideHorizontal.style.transition = 'opacity 0.2s';
    centerGuideHorizontal.style.visibility = 'hidden'; // 添加visibility属性
    
    containerRef.current.appendChild(centerGuideVertical);
    containerRef.current.appendChild(centerGuideHorizontal);
    
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
      let newX = initialElementX + deltaXPercent;
      let newY = initialElementY + deltaYPercent;
      
      // 获取中心控制点元素
      const centerHandle = elementRef.current?.querySelector('.resize-handle.center');
      if (centerHandle) {
        const handleRect = centerHandle.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // 计算中心控制点相对于容器的中心点
        const handleCenterX = ((handleRect.left + handleRect.width / 2) - containerRect.left) / containerRect.width * 100;
        const handleCenterY = ((handleRect.top + handleRect.height / 2) - containerRect.top) / containerRect.height * 100;
        
        // 中心点吸附逻辑
        const centerX = 50; // 容器中心点X (50%)
        const centerY = 50; // 容器中心点Y (50%)
        const snapThreshold = 5; // 吸附阈值 (5%)
        
        // 检查是否接近中心X坐标
        if (Math.abs(handleCenterX - centerX) < snapThreshold) {
          // 计算需要调整的偏移量
          const offsetX = centerX - handleCenterX;
          newX = initialElementX + deltaXPercent + offsetX;
          centerGuideVertical.style.opacity = '1'; // 显示垂直参考线
          centerGuideVertical.style.visibility = 'visible'; // 设置为可见
          
          // 添加吸附动画效果
          if ('vibrate' in navigator) {
            navigator.vibrate(10); // 轻微震动提示
          }
          
          // 使参考线闪烁以增强视觉反馈
          centerGuideVertical.animate([
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' },
            { opacity: 0.8, boxShadow: '0 0 10px rgba(76, 175, 80, 0.9)' },
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' }
          ], {
            duration: 400,
            iterations: 1
          });
        } else {
          centerGuideVertical.style.opacity = '0'; // 隐藏垂直参考线
          centerGuideVertical.style.visibility = 'hidden'; // 设置为不可见
        }
        
        // 检查是否接近中心Y坐标
        if (Math.abs(handleCenterY - centerY) < snapThreshold) {
          // 计算需要调整的偏移量
          const offsetY = centerY - handleCenterY;
          newY = initialElementY + deltaYPercent + offsetY;
          centerGuideHorizontal.style.opacity = '1'; // 显示水平参考线
          centerGuideHorizontal.style.visibility = 'visible'; // 设置为可见
          
          // 添加吸附动画效果
          if ('vibrate' in navigator && centerGuideVertical.style.opacity !== '1') {
            navigator.vibrate(10); // 轻微震动提示
          }
          
          // 使参考线闪烁以增强视觉反馈
          centerGuideHorizontal.animate([
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' },
            { opacity: 0.8, boxShadow: '0 0 10px rgba(76, 175, 80, 0.9)' },
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' }
          ], {
            duration: 400,
            iterations: 1
          });
        } else {
          centerGuideHorizontal.style.opacity = '0'; // 隐藏水平参考线
          centerGuideHorizontal.style.visibility = 'hidden'; // 设置为不可见
        }
      }
      
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
      
      // 移除参考线
      if (containerRef.current) {
        if (containerRef.current.contains(centerGuideVertical)) {
          containerRef.current.removeChild(centerGuideVertical);
        }
        if (containerRef.current.contains(centerGuideHorizontal)) {
          containerRef.current.removeChild(centerGuideHorizontal);
        }
      }
      
      // 确保元素仍然被选中
      setTimeout(() => {
        if (item) {
          onSelect?.(item);
        }
      }, 50);
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

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '4px'
  };

  const handleRotateStart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item) return;
    
    // 确保元素仍然被选中
    onSelect?.(item);

    // 获取元素的当前位置和角度
    const elementId = `element-${item.id}`;
    const element = document.getElementById(elementId);
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
    
    // 创建一个透明覆盖层，捕获所有鼠标事件
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'crosshair';
    document.body.appendChild(overlay);
    
    // 创建参考线容器
    const guideLinesContainer = document.createElement('div');
    guideLinesContainer.style.position = 'fixed';
    guideLinesContainer.style.top = '0';
    guideLinesContainer.style.left = '0';
    guideLinesContainer.style.width = '100vw';
    guideLinesContainer.style.height = '100vh';
    guideLinesContainer.style.zIndex = '9998';
    guideLinesContainer.style.pointerEvents = 'none';
    document.body.appendChild(guideLinesContainer);

    // 创建参考线
    const createGuideLine = (angle, isCenter = false) => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.top = `${containerRect.top + centerY}px`;
      line.style.left = `${containerRect.left + centerX}px`;
      line.style.width = '300px';
      line.style.height = '2px';
      line.style.backgroundColor = isCenter ? 'rgba(76, 175, 80, 0.7)' : 'rgba(76, 175, 80, 0.4)';
      line.style.transform = `rotate(${angle}deg) translateX(-50%)`;
      line.style.transformOrigin = 'left center';
      guideLinesContainer.appendChild(line);
    };

    // 添加所有参考线
    [0, 45, 90, 135].forEach(angle => createGuideLine(angle, angle === 0));
    
    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      // 重新计算元素中心点（因为元素可能移动）
      const element = document.getElementById(`element-${item.id}`);
      if (!element) return;
      
      const updatedRect = element.getBoundingClientRect();
      const updatedCenterX = updatedRect.left - containerRect.left + updatedRect.width / 2;
      const updatedCenterY = updatedRect.top - containerRect.top + updatedRect.height / 2;
      
      // 更新参考线位置
      const lines = guideLinesContainer.querySelectorAll('div');
      lines.forEach(line => {
        line.style.top = `${containerRect.top + updatedCenterY}px`;
        line.style.left = `${containerRect.left + updatedCenterX}px`;
      });
      
      const currentAngle = Math.atan2(
        moveEvent.clientY - (containerRect.top + updatedCenterY),
        moveEvent.clientX - (containerRect.left + updatedCenterX)
      );
      
      // 降低旋转灵敏度
      let rotation = startRotation + (currentAngle - startAngle) * (180 / Math.PI) * 0.5;
      
      // 将旋转角度限制在0-360度范围内
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      // 将角度范围调整为-180到180度之间
      const boundedRotation = normalizedRotation > 180 ? normalizedRotation - 360 : normalizedRotation;
      
      // 基准线吸附功能
      const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315];
      const snapThreshold = 8; // 增加吸附阈值
      
      let snapped = false;
      let lastSnappedValue = null;
      for (const snapPoint of snapPoints) {
        const diff = Math.abs(boundedRotation - snapPoint);
        if (diff <= snapThreshold) {
          // 如果是新的吸附点，添加震动反馈
          if (lastSnappedValue !== snapPoint) {
            if ('vibrate' in navigator) {
              navigator.vibrate(20); // 短暂震动提示
            }
            lastSnappedValue = snapPoint;
          }
          
          // 应用吸附
          rotation = snapPoint;
          snapped = true;
          
          // 高亮显示当前吸附的参考线
          lines.forEach(line => {
            // 将所有线条恢复为普通状态
            line.style.backgroundColor = 'rgba(76, 175, 80, 0.4)';
            line.style.height = '2px';
            
            // 高亮匹配的参考线
            const lineAngle = parseInt(line.style.transform.match(/rotate\((\d+)deg\)/)?.[1] || '0');
            // 处理等效角度
            const normalizedLineAngle = lineAngle % 180;
            const normalizedSnapPoint = snapPoint % 180;
            
            if (normalizedLineAngle === normalizedSnapPoint || 
                (snapPoint % 180 === 0 && lineAngle === 0) || 
                (snapPoint % 180 === 90 && lineAngle === 90) || 
                (snapPoint % 180 === 45 && lineAngle === 45) || 
                (snapPoint % 180 === 135 && lineAngle === 135)) {
              line.style.backgroundColor = 'rgba(76, 175, 80, 1)';
              line.style.height = '3px';
              line.style.boxShadow = '0 0 6px rgba(76, 175, 80, 0.9)';
              
              // 使对齐线稍微闪烁以增强视觉反馈
              setTimeout(() => {
                if (line && line.parentNode) {
                  line.style.backgroundColor = 'rgba(255, 238, 88, 1)';
                  line.style.boxShadow = '0 0 8px rgba(255, 238, 88, 0.9)';
                  
                  setTimeout(() => {
                    if (line && line.parentNode) {
                      line.style.backgroundColor = 'rgba(76, 175, 80, 1)';
                      line.style.boxShadow = '0 0 6px rgba(76, 175, 80, 0.9)';
                    }
                  }, 150);
                }
              }, 0);
            }
          });
          
          break;
        }
      }
      
      // 如果没有吸附，恢复所有线条为普通状态，并重置lastSnappedValue
      if (!snapped) {
        lastSnappedValue = null;
        lines.forEach(line => {
          const isCenter = line.style.transform.includes('rotate(0deg)');
          line.style.backgroundColor = isCenter ? 'rgba(76, 175, 80, 0.7)' : 'rgba(76, 175, 80, 0.4)';
          line.style.height = '2px';
          line.style.boxShadow = 'none';
        });
      }
      
      // 更新元素
      const updatedItem = {
        ...item,
        rotation: Math.round(boundedRotation) // 四舍五入到整数
      };
      
      onChange?.({
        ...item,
        rotation: boundedRotation
      });
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // 移除覆盖层和参考线
      document.body.removeChild(overlay);
      document.body.removeChild(guideLinesContainer);
      
      // 确保元素仍然被选中
      setTimeout(() => {
        if (item) {
          onSelect?.(item);
        }
      }, 50);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      ref={elementRef}
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
        zIndex: isSelected ? 9999 : item.zIndex || 0,
        boxShadow: isSelected ? '0 0 0 1px #1890ff' : 'none',
        padding: 0,
        margin: 0,
        minWidth: '30px',
        minHeight: '30px',
        overflow: 'visible'
      }}
      onMouseDown={(e) => {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止冒泡
        handleDragStart(e);
      }}
      onClick={(e) => {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止冒泡
        handleClick(e);
      }}
    >
      {/* 渲染实际内容 */}
      {item.type === TRACK_TYPES.TEXT ? (
        <div className="text-content" ref={textContentRef} style={textStyle}>
          {item.content}
        </div>
      ) : item.type === TRACK_TYPES.IMAGE ? (
        <img 
          src={item.src || 'https://picsum.photos/300/200'} 
          alt={item.content || 'Image'} 
          style={imageStyle} 
        />
      ) : null}
      
      {/* 选中时显示的控制点 */}
      {isSelected && (
        <>
          {/* 四角控制点 */}
          <div className="resize-handle nw" data-handle="nw" onMouseDown={(e) => onResizeStart?.(e, 'nw')}></div>
          <div className="resize-handle ne" data-handle="ne" onMouseDown={(e) => onResizeStart?.(e, 'ne')}></div>
          <div className="resize-handle sw" data-handle="sw" onMouseDown={(e) => onResizeStart?.(e, 'sw')}></div>
          <div className="resize-handle se" data-handle="se" onMouseDown={(e) => onResizeStart?.(e, 'se')}></div>
          
          {/* 四边中点控制点 */}
          <div className="resize-handle n" data-handle="n" onMouseDown={(e) => onResizeStart?.(e, 'n')}></div>
          <div className="resize-handle e" data-handle="e" onMouseDown={(e) => onResizeStart?.(e, 'e')}></div>
          <div className="resize-handle s" data-handle="s" onMouseDown={(e) => onResizeStart?.(e, 's')}></div>
          <div className="resize-handle w" data-handle="w" onMouseDown={(e) => onResizeStart?.(e, 'w')}></div>
          
          {/* 中心控制点 */}
          <div className="resize-handle center" data-handle="center"></div>
          
          {/* 旋转控制点 */}
          <div className="rotate-handle" onMouseDown={(e) => onRotateStart?.(e, item)}></div>
        </>
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
  const elementRef = useRef(null); // 添加引用
  
  // 计算实际元素位置时考虑容器的9:16比例
  const x = (item.x / 100) * containerSize.width;
  const y = (item.y / 100) * containerSize.height;
  
  // 确保width和height始终有有效值，防止NaN
  const itemWidth = typeof item.width === 'number' && !isNaN(item.width) ? item.width : 10;
  const itemHeight = typeof item.height === 'number' && !isNaN(item.height) ? item.height : 10;
  
  const width = (itemWidth / 100) * containerSize.width;
  const height = (itemHeight / 100) * containerSize.height;

  // 监听图片元素大小变化
  useEffect(() => {
    if (!elementRef.current || !isSelected) return;
    
    // 创建ResizeObserver监听元素大小变化
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // 元素大小变化时，强制更新选中框
        if (entry.target.classList.contains('selected')) {
          // 通过移除再添加selected类，触发重新应用样式
          entry.target.classList.remove('selected');
          // 使用setTimeout确保DOM有时间更新
          setTimeout(() => {
            if (elementRef.current) {
              elementRef.current.classList.add('selected');
            }
          }, 0);
        }
      }
    });
    
    // 开始监听
    resizeObserver.observe(elementRef.current);
    
    // 清理函数
    return () => {
      resizeObserver.disconnect();
    };
  }, [isSelected]);

  // 处理拖拽开始
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || containerSize.width === 0) {
      console.error('Container reference or size not available');
      return;
    }
    
    setIsDragging(true);
    onSelect?.({...item, originalOpacity: item.opacity}); // 保存原始opacity值
    
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
    
    // 创建中心参考线
    const centerGuideVertical = document.createElement('div');
    centerGuideVertical.style.position = 'absolute';
    centerGuideVertical.style.top = '0';
    centerGuideVertical.style.left = '50%';
    centerGuideVertical.style.width = '2px';
    centerGuideVertical.style.height = '100%';
    centerGuideVertical.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
    centerGuideVertical.style.transform = 'translateX(-50%)';
    centerGuideVertical.style.zIndex = '9998';
    centerGuideVertical.style.opacity = '0';
    centerGuideVertical.style.pointerEvents = 'none';
    centerGuideVertical.style.transition = 'opacity 0.2s';
    
    const centerGuideHorizontal = document.createElement('div');
    centerGuideHorizontal.style.position = 'absolute';
    centerGuideHorizontal.style.left = '0';
    centerGuideHorizontal.style.top = '50%';
    centerGuideHorizontal.style.width = '100%';
    centerGuideHorizontal.style.height = '2px';
    centerGuideHorizontal.style.backgroundColor = 'rgba(76, 175, 80, 0.7)';
    centerGuideHorizontal.style.transform = 'translateY(-50%)';
    centerGuideHorizontal.style.zIndex = '9998';
    centerGuideHorizontal.style.opacity = '0';
    centerGuideHorizontal.style.pointerEvents = 'none';
    centerGuideHorizontal.style.transition = 'opacity 0.2s';
    
    containerRef.current.appendChild(centerGuideVertical);
    containerRef.current.appendChild(centerGuideHorizontal);
    
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
      let newX = initialElementX + deltaXPercent;
      let newY = initialElementY + deltaYPercent;
      
      // 获取中心控制点元素
      const centerHandle = elementRef.current?.querySelector('.resize-handle.center');
      if (centerHandle) {
        const handleRect = centerHandle.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // 计算中心控制点相对于容器的中心点
        const handleCenterX = ((handleRect.left + handleRect.width / 2) - containerRect.left) / containerRect.width * 100;
        const handleCenterY = ((handleRect.top + handleRect.height / 2) - containerRect.top) / containerRect.height * 100;
        
        // 中心点吸附逻辑
        const centerX = 50; // 容器中心点X (50%)
        const centerY = 50; // 容器中心点Y (50%)
        const snapThreshold = 5; // 吸附阈值 (5%)
        
        // 检查是否接近中心X坐标
        if (Math.abs(handleCenterX - centerX) < snapThreshold) {
          // 计算需要调整的偏移量
          const offsetX = centerX - handleCenterX;
          newX = initialElementX + deltaXPercent + offsetX;
          centerGuideVertical.style.opacity = '1'; // 显示垂直参考线
          centerGuideVertical.style.visibility = 'visible'; // 设置为可见
          
          // 添加吸附动画效果
          if ('vibrate' in navigator) {
            navigator.vibrate(10); // 轻微震动提示
          }
          
          // 使参考线闪烁以增强视觉反馈
          centerGuideVertical.animate([
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' },
            { opacity: 0.8, boxShadow: '0 0 10px rgba(76, 175, 80, 0.9)' },
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' }
          ], {
            duration: 400,
            iterations: 1
          });
        } else {
          centerGuideVertical.style.opacity = '0'; // 隐藏垂直参考线
          centerGuideVertical.style.visibility = 'hidden'; // 设置为不可见
        }
        
        // 检查是否接近中心Y坐标
        if (Math.abs(handleCenterY - centerY) < snapThreshold) {
          // 计算需要调整的偏移量
          const offsetY = centerY - handleCenterY;
          newY = initialElementY + deltaYPercent + offsetY;
          centerGuideHorizontal.style.opacity = '1'; // 显示水平参考线
          centerGuideHorizontal.style.visibility = 'visible'; // 设置为可见
          
          // 添加吸附动画效果
          if ('vibrate' in navigator && centerGuideVertical.style.opacity !== '1') {
            navigator.vibrate(10); // 轻微震动提示
          }
          
          // 使参考线闪烁以增强视觉反馈
          centerGuideHorizontal.animate([
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' },
            { opacity: 0.8, boxShadow: '0 0 10px rgba(76, 175, 80, 0.9)' },
            { opacity: 1, boxShadow: '0 0 5px rgba(76, 175, 80, 0.7)' }
          ], {
            duration: 400,
            iterations: 1
          });
        } else {
          centerGuideHorizontal.style.opacity = '0'; // 隐藏水平参考线
          centerGuideHorizontal.style.visibility = 'hidden'; // 设置为不可见
        }
      }
      
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
      
      // 移除参考线
      if (containerRef.current) {
        if (containerRef.current.contains(centerGuideVertical)) {
          containerRef.current.removeChild(centerGuideVertical);
        }
        if (containerRef.current.contains(centerGuideHorizontal)) {
          containerRef.current.removeChild(centerGuideHorizontal);
        }
      }
      
      // 确保元素仍然被选中
      setTimeout(() => {
        if (item) {
          onSelect?.(item);
        }
      }, 50);
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
      ref={elementRef} // 添加引用
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
        zIndex: isSelected ? 9999 : item.zIndex || 0,
        boxShadow: isSelected ? '0 0 0 1px #1890ff' : 'none',
        padding: 0,
        margin: 0,
        overflow: 'visible'
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDragStart(e);
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(item);
      }}
    >
      <img 
        src={item.src} 
        alt={item.alt || 'Image'} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none'
        }} 
      />
      
      {/* 选中时显示的控制点 */}
      {isSelected && (
        <>
          {/* 四角控制点 */}
          <div className="resize-handle nw" data-handle="nw" onMouseDown={(e) => onResizeStart?.(e, 'nw')}></div>
          <div className="resize-handle ne" data-handle="ne" onMouseDown={(e) => onResizeStart?.(e, 'ne')}></div>
          <div className="resize-handle sw" data-handle="sw" onMouseDown={(e) => onResizeStart?.(e, 'sw')}></div>
          <div className="resize-handle se" data-handle="se" onMouseDown={(e) => onResizeStart?.(e, 'se')}></div>
          
          {/* 四边中点控制点 */}
          <div className="resize-handle n" data-handle="n" onMouseDown={(e) => onResizeStart?.(e, 'n')}></div>
          <div className="resize-handle e" data-handle="e" onMouseDown={(e) => onResizeStart?.(e, 'e')}></div>
          <div className="resize-handle s" data-handle="s" onMouseDown={(e) => onResizeStart?.(e, 's')}></div>
          <div className="resize-handle w" data-handle="w" onMouseDown={(e) => onResizeStart?.(e, 'w')}></div>
          
          {/* 中心控制点 */}
          <div className="resize-handle center" data-handle="center"></div>
          
          {/* 旋转控制点 */}
          <div className="rotate-handle" onMouseDown={(e) => onRotateStart?.(e, item)}></div>
        </>
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
  const [isInternalSeek, setIsInternalSeek] = useState(false);

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
      console.log('视频播放器 - 暂停按钮点击');
      // 先暂停视频，再通知父组件
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
      onPause?.();
    } else {
      console.log('视频播放器 - 播放按钮点击');
      // 先通知父组件，再尝试播放
      onPlay?.();
      const video = videoRef.current;
      if (video) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('视频开始播放成功');
            })
            .catch(error => {
              console.warn('播放失败:', error);
              onPause?.();
            });
        }
      }
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

  // Video setup effect - 同步视频时间与应用状态
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    // 清理函数
    const cleanup = () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };

    // 视频时间更新处理
    let lastUpdateTime = 0;
    const handleTimeUpdate = () => {
      // 添加节流，避免过于频繁的更新
      const now = Date.now();
      if (now - lastUpdateTime < 50) return; // 每50ms最多更新一次
      lastUpdateTime = now;

      if (isPlaying) {
        const currentVideoTime = video.currentTime;
        // 只在时间差异较大时才更新
        if (Math.abs(currentVideoTime - currentTime) > 0.1) {
          // 触发自定义事件通知时间更新
          const timeUpdateEvent = new CustomEvent('video-time-update', {
            detail: currentVideoTime
          });
          document.dispatchEvent(timeUpdateEvent);
          
          // 通知父组件
          onSeek?.(currentVideoTime);
        }
      }
    };

    // 视频结束处理
    const handleEnded = () => {
      console.log('视频播放结束');
      onPause?.();
      // 重置到开始位置
      video.currentTime = 0;
      onSeek?.(0);
    };

    // 视频缓冲处理
    const handleWaiting = () => {
      console.log('视频缓冲中...');
      // 不自动暂停，让视频继续缓冲
    };

    // 视频可以播放时的处理
    const handleCanPlay = () => {
      console.log('视频可以播放');
      if (isPlaying && video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('播放失败:', error);
            onPause?.();
          });
        }
      }
    };

    // 添加事件监听
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    // 设置视频源
    if (video.src !== videoSrc) {
      video.src = videoSrc;
      video.load();
    }

    // 设置初始时间
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }

    return cleanup;
  }, [videoSrc, isPlaying, currentTime, onSeek, onPause]);

  // 播放状态控制
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      console.log('视频状态更新 - 开始播放');
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('视频开始播放成功');
          })
          .catch(error => {
            console.warn('播放失败:', error);
            onPause?.();
          });
      }
    } else {
      console.log('视频状态更新 - 暂停播放');
      video.pause();
    }
  }, [isPlaying, onPause]);

  // 时间同步效果
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPlaying) return;

    // 只在非播放状态下同步时间
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

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
              opacity: item.opacity ?? 1, // 默认完全不透明
              src: item.src || item.url // 确保图片路径字段统一
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
            height: item.height ?? (item.type === TRACK_TYPES.TEXT ? 'auto' : 20),
            rotation: item.rotation ?? 0,
            scale: item.scale ?? 1,
            opacity: item.opacity ?? 1, // 默认完全不透明
            isNew: isNewItem,
            src: item.src || item.url // 确保图片路径字段统一
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
      opacity: item.opacity !== undefined ? item.opacity : 1
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
      opacity: updatedItem.opacity !== undefined ? updatedItem.opacity : (updatedItem.originalOpacity || 1)
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
    // ImageElement不应该访问VideoPreview的状态
    // setResizeStart(startData);

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
        case 'n': // 上边中点
          newWidth = startData.startWidth;
          newHeight = Math.max(5, startData.startHeight - deltaYPercent);
          overlay.style.cursor = 'ns-resize';
          break;
        case 'e': // 右边中点
          newWidth = Math.max(5, startData.startWidth + deltaXPercent);
          newHeight = startData.startHeight;
          overlay.style.cursor = 'ew-resize';
          break;
        case 's': // 下边中点
          newWidth = startData.startWidth;
          newHeight = Math.max(5, startData.startHeight + deltaYPercent);
          overlay.style.cursor = 'ns-resize';
          break;
        case 'w': // 左边中点
          newWidth = Math.max(5, startData.startWidth - deltaXPercent);
          newHeight = startData.startHeight;
          overlay.style.cursor = 'ew-resize';
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
        {renderBackgrounds()}
        
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

  // 处理元素旋转开始
  const handleRotateStart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item) return;
    
    // 确保元素仍然被选中
    onItemSelect?.(item);

    // 获取元素的当前位置和角度
    const elementId = `element-${item.id}`;
    const element = document.getElementById(elementId);
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
    
    // 创建一个透明覆盖层，捕获所有鼠标事件
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'crosshair';
    document.body.appendChild(overlay);
    
    // 创建参考线容器
    const guideLinesContainer = document.createElement('div');
    guideLinesContainer.style.position = 'fixed';
    guideLinesContainer.style.top = '0';
    guideLinesContainer.style.left = '0';
    guideLinesContainer.style.width = '100vw';
    guideLinesContainer.style.height = '100vh';
    guideLinesContainer.style.zIndex = '9998';
    guideLinesContainer.style.pointerEvents = 'none';
    document.body.appendChild(guideLinesContainer);

    // 创建参考线
    const createGuideLine = (angle, isCenter = false) => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.top = `${containerRect.top + centerY}px`;
      line.style.left = `${containerRect.left + centerX}px`;
      line.style.width = '300px';
      line.style.height = '2px';
      line.style.backgroundColor = isCenter ? 'rgba(76, 175, 80, 0.7)' : 'rgba(76, 175, 80, 0.4)';
      line.style.transform = `rotate(${angle}deg) translateX(-50%)`;
      line.style.transformOrigin = 'left center';
      guideLinesContainer.appendChild(line);
    };

    // 添加所有参考线
    [0, 45, 90, 135].forEach(angle => createGuideLine(angle, angle === 0));
    
    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      // 重新计算元素中心点（因为元素可能移动）
      const element = document.getElementById(`element-${item.id}`);
      if (!element) return;
      
      const updatedRect = element.getBoundingClientRect();
      const updatedCenterX = updatedRect.left - containerRect.left + updatedRect.width / 2;
      const updatedCenterY = updatedRect.top - containerRect.top + updatedRect.height / 2;
      
      // 更新参考线位置
      const lines = guideLinesContainer.querySelectorAll('div');
      lines.forEach(line => {
        line.style.top = `${containerRect.top + updatedCenterY}px`;
        line.style.left = `${containerRect.left + updatedCenterX}px`;
      });
      
      const currentAngle = Math.atan2(
        moveEvent.clientY - (containerRect.top + updatedCenterY),
        moveEvent.clientX - (containerRect.left + updatedCenterX)
      );
      
      // 增加旋转灵敏度，通过乘以系数
      let rotation = startRotation + (currentAngle - startAngle) * (180 / Math.PI) * 1.5;
      
      // 限制旋转角度在 -180 到 180 度之间
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const boundedRotation = normalizedRotation > 180 ? normalizedRotation - 360 : normalizedRotation;
      
      // 基准线吸附功能
      const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315];
      const snapThreshold = 8; // 增加吸附阈值
      
      let snapped = false;
      let lastSnappedValue = null;
      for (const snapPoint of snapPoints) {
        const diff = Math.abs(boundedRotation - snapPoint);
        if (diff <= snapThreshold) {
          // 如果是新的吸附点，添加震动反馈
          if (lastSnappedValue !== snapPoint) {
            if ('vibrate' in navigator) {
              navigator.vibrate(20); // 短暂震动提示
            }
            lastSnappedValue = snapPoint;
          }
          
          // 应用吸附
          rotation = snapPoint;
          snapped = true;
          
          // 高亮显示当前吸附的参考线
          lines.forEach(line => {
            // 将所有线条恢复为普通状态
            line.style.backgroundColor = 'rgba(76, 175, 80, 0.4)';
            line.style.height = '2px';
            
            // 高亮匹配的参考线
            const lineAngle = parseInt(line.style.transform.match(/rotate\((\d+)deg\)/)?.[1] || '0');
            // 处理等效角度
            const normalizedLineAngle = lineAngle % 180;
            const normalizedSnapPoint = snapPoint % 180;
            
            if (normalizedLineAngle === normalizedSnapPoint || 
                (snapPoint % 180 === 0 && lineAngle === 0) || 
                (snapPoint % 180 === 90 && lineAngle === 90) || 
                (snapPoint % 180 === 45 && lineAngle === 45) || 
                (snapPoint % 180 === 135 && lineAngle === 135)) {
              line.style.backgroundColor = 'rgba(76, 175, 80, 1)';
              line.style.height = '3px';
              line.style.boxShadow = '0 0 6px rgba(76, 175, 80, 0.9)';
              
              // 使对齐线稍微闪烁以增强视觉反馈
              setTimeout(() => {
                if (line && line.parentNode) {
                  line.style.backgroundColor = 'rgba(255, 238, 88, 1)';
                  line.style.boxShadow = '0 0 8px rgba(255, 238, 88, 0.9)';
                  
                  setTimeout(() => {
                    if (line && line.parentNode) {
                      line.style.backgroundColor = 'rgba(76, 175, 80, 1)';
                      line.style.boxShadow = '0 0 6px rgba(76, 175, 80, 0.9)';
                    }
                  }, 150);
                }
              }, 0);
            }
          });
          
          break;
        }
      }
      
      // 如果没有吸附，恢复所有线条为普通状态，并重置lastSnappedValue
      if (!snapped) {
        lastSnappedValue = null;
        lines.forEach(line => {
          const isCenter = line.style.transform.includes('rotate(0deg)');
          line.style.backgroundColor = isCenter ? 'rgba(76, 175, 80, 0.7)' : 'rgba(76, 175, 80, 0.4)';
          line.style.height = '2px';
          line.style.boxShadow = 'none';
        });
      }
      
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
      
      onItemChange?.({
        ...item,
        rotation: boundedRotation
      });
    };
    
    const onMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // 移除覆盖层和参考线
      document.body.removeChild(overlay);
      document.body.removeChild(guideLinesContainer);
      
      // 确保元素仍然被选中
      setTimeout(() => {
        if (item) {
          onItemSelect?.(item);
        }
      }, 50);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      className="video-preview-container" 
      ref={containerRef}
      style={{ width, height }}
      onClick={(e) => {
        // 检查点击是否在元素区域内
        const clickedElement = e.target.closest('.text-element, .image-element');
        const clickedControl = e.target.closest('.preview-controls, .resize-handle, .rotate-handle');
        
        // 如果点击的是空白区域且不是控制按钮
        if (!clickedElement && !clickedControl) {
          // 取消选中状态
          setSelectedItem(null);
          onItemSelect?.(null);
          
          // 移除所有元素的选中状态
          document.querySelectorAll('.text-element.selected, .image-element.selected').forEach(el => {
            el.classList.remove('selected');
          });
          
          // 移除所有轨道项目的选中状态
          document.querySelectorAll('.track-item.selected').forEach(el => {
            el.classList.remove('selected');
          });
        }
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
              src={item.src || item.url || ''}
              alt={item.content || item.alt || "背景"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: item.opacity ?? 1
              }}
              onError={(e) => {
                console.error('背景图片加载失败:', item.src || item.url);
                e.target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20fill%3D%22%23333%22%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3C%2Fsvg%3E';
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
