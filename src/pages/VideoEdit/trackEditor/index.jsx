import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, VideoCameraOutlined, AudioOutlined, PictureOutlined, FontSizeOutlined, CustomerServiceOutlined, PlusOutlined, MinusOutlined, UpOutlined, DownOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './index.scss';
import { TRACK_TYPES } from '../constants';
import TimelineRuler from './components/TimelineRuler';
import TimelineCursor from './components/TimelineCursor';
import Track from './components/Track';

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
  onDeleteItem,
  onPlay,
  onPause
}) => {
  // 状态管理
  const [tracks, setTracks] = useState(() => initialTracks || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [collisionWarning, setCollisionWarning] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Refs
  const timelineRef = useRef(null);
  const dragItemRef = useRef(null);
  const playbackRef = useRef(null);
  
  // 获取视频轨道的实际时长（由视频片段决定）
  const getActualVideoDuration = useCallback(() => {
    // 查找视频轨道
    const videoTrack = tracks.find(track => track.type === TRACK_TYPES.VIDEO);
    if (!videoTrack || videoTrack.items.length === 0) {
      // 没有视频轨道或没有视频片段，返回默认视频时长
      return videoDuration;
    }

    // 计算视频片段的最大结束时间点
    let maxEndTime = 0;
    videoTrack.items.forEach(item => {
      const itemEnd = item.start + item.duration;
      if (itemEnd > maxEndTime) {
        maxEndTime = itemEnd;
      }
    });

    return maxEndTime > 0 ? maxEndTime : videoDuration;
  }, [tracks, videoDuration]);

  // 获取总时长
  const getDuration = useCallback(() => {
    if (tracks.length === 0) return videoDuration;

    let maxEndTime = 0;
    tracks.forEach(track => {
      track.items.forEach(item => {
        const itemEnd = item.start + item.duration;
        if (itemEnd > maxEndTime) {
          maxEndTime = itemEnd;
        }
      });
    });

    // 使用视频时长作为基准，确保时间轴长度不小于视频时长
    return Math.max(maxEndTime, videoDuration);
  }, [tracks, videoDuration]);

  // 计算时间轴总宽度
  const calculateTimelineWidth = useCallback(() => {
    const duration = getDuration();
    const trackHeaderWidth = 36;
    const baseWidthPerSecond = 100; // 每秒100像素
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    const totalWidth = trackHeaderWidth + (duration * scaledWidthPerSecond);
    return Math.max(totalWidth, window.innerWidth); // 确保至少和视口一样宽
  }, [zoom, getDuration]);

  // 计算游标位置
  const calculateCursorPosition = useCallback((time) => {
    const trackHeaderWidth = 36;
    const baseWidthPerSecond = 100;
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    return trackHeaderWidth + (time * scaledWidthPerSecond);
  }, [zoom]);

  // 停止播放 - 确保此函数先于需要它的函数定义
  const stopPlayback = useCallback(() => {
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // 开始播放
  const startPlayback = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // 播放控制
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      console.log('轨道编辑器请求暂停');
      // 先设置状态，再通知父组件
      setIsPlaying(false);
      // 触发全局暂停事件，确保视频和其他组件都响应
      document.dispatchEvent(new CustomEvent('video-pause-requested'));
      onPause?.();
    } else {
      console.log('轨道编辑器请求播放');
      const actualVideoDur = getActualVideoDuration();
      
      // 如果当前时间已经到了或超过视频实际时长，重置到起点
      if (currentTime >= actualVideoDur) {
        console.log('播放前检查：重置到起点');
        setCurrentTime(0);
        onCursorChange?.(0);
      }
      
      // 先设置状态，再通知父组件
      setIsPlaying(true);
      
      // 触发全局播放事件
      document.dispatchEvent(new CustomEvent('video-play-requested'));
      onPlay?.();
    }
  }, [isPlaying, currentTime, getActualVideoDuration, onCursorChange, onPlay, onPause]);

  // 添加播放进度更新机制
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const updatePlaybackProgress = (timestamp) => {
      if (!isPlaying) return;

      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // 更新当前时间（毫秒转换为秒）
      setCurrentTime(prevTime => {
        const newTime = prevTime + (deltaTime / 1000);
        const actualVideoDur = getActualVideoDuration();
        
        // 如果超过视频时长，停止播放
        if (newTime >= actualVideoDur) {
          setIsPlaying(false);
          onPause?.();
          return actualVideoDur;
        }
        
        // 更新游标位置
        onCursorChange?.(newTime);
        return newTime;
      });

      animationFrameId = requestAnimationFrame(updatePlaybackProgress);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updatePlaybackProgress);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, getActualVideoDuration, onCursorChange, onPause]);

  // 监听视频时间更新
  useEffect(() => {
    const handleVideoTimeUpdate = (event) => {
      const videoTime = event.detail;
      if (typeof videoTime === 'number' && !isNaN(videoTime)) {
        console.log('轨道编辑器收到视频时间更新:', videoTime);
        setCurrentTime(videoTime);
        onCursorChange?.(videoTime);
        
        // 自动滚动时间轴以保持游标在可视区域内
        if (timelineRef.current && isPlaying) {
          const timelineElement = timelineRef.current;
          const cursorPosition = calculateCursorPosition(videoTime);
          const timelineRect = timelineElement.getBoundingClientRect();
          const scrollLeft = timelineElement.scrollLeft;
          const visibleWidth = timelineRect.width;
          
          // 计算可视区域的边界
          const trackHeaderWidth = 36;
          const leftEdge = scrollLeft + trackHeaderWidth + 20; // 左边界，加一点缓冲区
          const rightEdge = scrollLeft + visibleWidth - 20; // 右边界，减一点缓冲区
          
          // 如果游标接近或超出可视区域，自动滚动
          if (cursorPosition < leftEdge || cursorPosition > rightEdge) {
            const newScrollLeft = Math.max(0, cursorPosition - visibleWidth / 2);
            timelineElement.scrollTo({
              left: newScrollLeft,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    document.addEventListener('video-time-update', handleVideoTimeUpdate);

    return () => {
      document.removeEventListener('video-time-update', handleVideoTimeUpdate);
    };
  }, [onCursorChange, isPlaying, calculateCursorPosition]);

  // 监听播放状态变化
  useEffect(() => {
    // 当父组件传递的播放状态变化时，更新本地状态
    if (isPlaying !== undefined) {
      console.log('轨道编辑器收到播放状态更新:', isPlaying);
      setIsPlaying(isPlaying);
    }
  }, [isPlaying]);

  // 监听全局暂停请求
  useEffect(() => {
    const handlePauseRequested = () => {
      console.log('轨道编辑器收到暂停请求');
      // 停止播放
      stopPlayback();
      onPause?.();
    };

    // 添加事件监听
    document.addEventListener('video-pause-requested', handlePauseRequested);

    // 清理函数
    return () => {
      document.removeEventListener('video-pause-requested', handlePauseRequested);
    };
  }, [stopPlayback, onPause]);

  // 监听当前时间变化
  useEffect(() => {
    const actualVideoDur = getActualVideoDuration();
    
    // 如果当前时间超出视频时长，停止播放
    if (currentTime >= actualVideoDur) {
      console.log('时间超出视频时长，停止播放');
      setIsPlaying(false);
      onPause?.();
    }
  }, [currentTime, getActualVideoDuration, onPause]);

  // 处理时间轴点击
  const handleTimelineClick = useCallback((time) => {
    // 如果正在播放，先停止播放
    if (isPlaying) {
      stopPlayback(); // 现在安全，因为stopPlayback已经在前面定义
    }
    
    // 使用视频实际时长作为判断依据
    const actualVideoDur = getActualVideoDuration();
    
    // 确保时间不超过视频实际时长，超过则重置到0点
    if (time >= actualVideoDur) {
      console.log(`点击时间(${time.toFixed(1)}s)超出视频实际时长(${actualVideoDur.toFixed(1)}s)，重置到0点`);
      setCurrentTime(0);
      onCursorChange?.(0);
    } else {
      setCurrentTime(time);
      onCursorChange?.(time);
    }
  }, [isPlaying, stopPlayback, onCursorChange, getActualVideoDuration]);

  // 处理缩放
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  // 检查碰撞
  const checkCollision = useCallback((trackId, itemId, newStart, newDuration) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return { hasCollision: false, collidingItemIds: [] };
    
    const newEnd = newStart + newDuration;
    const collidingItemIds = [];
    
    const hasCollision = track.items.some(item => {
      if (item.id === itemId) return false;
      const itemEnd = item.start + item.duration;
      const isColliding = (newStart < itemEnd && newEnd > item.start);
      if (isColliding) {
        collidingItemIds.push(item.id);
      }
      return isColliding;
    });
    
    return { hasCollision, collidingItemIds };
  }, [tracks]);

  // 处理轨道项目拖拽
  const handleItemDragStart = useCallback((itemId) => {
    setCollisionWarning([]);
    // 记住拖拽开始的轨道ID，用于跨轨道拖拽
    const sourceTrack = tracks.find(track => 
      track.items.some(item => item.id === itemId)
    );
    if (sourceTrack) {
      dragItemRef.current = {
        itemId,
        sourceTrackId: sourceTrack.id,
        item: sourceTrack.items.find(item => item.id === itemId)
      };
    }
  }, [tracks]);

  const handleItemDrag = useCallback((itemId, newStart, targetTrackId) => {
    // 获取拖拽的项目和源轨道信息
    if (!dragItemRef.current || dragItemRef.current.itemId !== itemId) {
      // 如果没有拖拽记录或者itemId不匹配，重新查找
      const sourceTrack = tracks.find(track => 
        track.items.some(item => item.id === itemId)
      );
      
      if (!sourceTrack) return;
      
      const draggedItem = sourceTrack.items.find(item => item.id === itemId);
      
      dragItemRef.current = {
        itemId,
        sourceTrackId: sourceTrack.id,
        item: draggedItem
      };
    }
    
    const { sourceTrackId, item: draggedItem } = dragItemRef.current;
    
    if (!draggedItem) return;
    
    // 检查目标轨道是否存在且类型是否与源轨道类型相同
    if (targetTrackId && targetTrackId !== sourceTrackId) {
      const sourceTrack = tracks.find(t => t.id === sourceTrackId);
      const targetTrack = tracks.find(t => t.id === targetTrackId);
      
      if (!sourceTrack || !targetTrack) return;
      
      // 轨道类型不同时不允许拖拽
      if (targetTrack.type !== sourceTrack.type) {
        console.log('不能跨不同类型的轨道拖拽', sourceTrack.type, targetTrack.type);
        return;
      }
      
      // 检查碰撞
      const { hasCollision, collidingItemIds } = checkCollision(
        targetTrackId,
        itemId,
        newStart,
        draggedItem.duration
      );
      
      setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);
      
      if (!hasCollision) {
        // 只在目标轨道预览，不改变原轨道
        // 使用临时的视觉元素来显示，而非真正修改状态
        dragItemRef.current.newStart = newStart;
        dragItemRef.current.targetTrackId = targetTrackId;
      }
    } else {
      // 在同一轨道内移动
      const { hasCollision, collidingItemIds } = checkCollision(
        sourceTrackId,
        itemId,
        newStart,
        draggedItem.duration
      );
      
      setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);
      
      if (!hasCollision) {
        // 同一轨道内的拖拽可以直接更新位置
        const newTracks = tracks.map(t => {
          if (t.id === sourceTrackId) {
            return {
              ...t,
              items: t.items.map(i => {
                if (i.id === itemId) {
                  return { ...i, start: newStart };
                }
                return i;
              })
            };
          }
          return t;
        });
        
        setTracks(newTracks);
        onTrackChange?.(newTracks);
      }
    }
  }, [tracks, checkCollision, onTrackChange]);

  const handleItemDragEnd = useCallback(() => {
    setCollisionWarning([]);
    
    // 处理跨轨道拖拽的结束状态
    if (dragItemRef.current && dragItemRef.current.targetTrackId && dragItemRef.current.targetTrackId !== dragItemRef.current.sourceTrackId) {
      const { itemId, sourceTrackId, targetTrackId, newStart, item } = dragItemRef.current;
      
      // 最后检查一次碰撞
      const { hasCollision } = checkCollision(
        targetTrackId,
        itemId,
        newStart,
        item.duration
      );
      
      if (!hasCollision) {
        // 从源轨道删除并添加到目标轨道
        const newTracks = tracks.map(track => {
          if (track.id === sourceTrackId) {
            // 从源轨道中删除
            return {
              ...track,
              items: track.items.filter(i => i.id !== itemId)
            };
          }
          if (track.id === targetTrackId) {
            // 添加到目标轨道
            return {
              ...track,
              items: [...track.items, { 
                ...item, 
                start: newStart,
                trackId: targetTrackId // 更新轨道ID
              }]
            };
          }
          return track;
        });
        
        setTracks(newTracks);
        onTrackChange?.(newTracks);
        
        // 更新选中状态
        setSelectedItem({
          ...item,
          trackId: targetTrackId,
          start: newStart
        });
      }
    }
    
    // 清除拖拽状态
    dragItemRef.current = null;
  }, [tracks, checkCollision, onTrackChange]);
        
  // 处理轨道项目缩放
  const handleItemResize = useCallback((itemId, newStart, newDuration) => {
    const track = tracks.find(track => 
      track.items.some(item => item.id === itemId)
    );
    
    if (!track) return;

    const { hasCollision, collidingItemIds } = checkCollision(
      track.id,
      itemId,
      newStart,
      newDuration
    );
      
      setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);
      
      if (!hasCollision) {
      const newTracks = tracks.map(t => {
        if (t.id === track.id) {
            return {
            ...t,
            items: t.items.map(i => {
              if (i.id === itemId) {
                return { 
                  ...i, 
                  start: newStart, 
                  duration: newDuration,
                  trackId: track.id 
                };
              }
              return i;
              })
            };
          }
        return t;
        });

        setTracks(newTracks);
        onTrackChange?.(newTracks);
      }
  }, [tracks, checkCollision, onTrackChange]);

  // 处理轨道点击
  const handleTrackClick = useCallback((trackId) => {
    console.log('轨道被点击:', trackId);
    
    // 清除之前选中的项目
    setSelectedItem(null);
    
    // 设置当前选中的轨道ID
    setSelectedTrackId(trackId);
    
    // 查找轨道对象
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      console.warn('未找到被点击的轨道:', trackId);
      return;
    }
    
    // 手动管理轨道的选中状态
    const trackElements = document.querySelectorAll('.track');
    trackElements.forEach(el => {
      const elTrackId = el.getAttribute('data-track-id');
      if (elTrackId === trackId) {
        el.classList.add('selected-track');
      } else {
        el.classList.remove('selected-track');
      }
    });
    
    // 通知父组件轨道被选中
    onItemSelect?.({
      trackId,
      type: track.type,
      isTrack: true
    });
  }, [tracks, onItemSelect]);

  // 处理项目选择
  const handleItemSelect = useCallback((itemId) => {
    // 如果传入的是一个对象（来自TrackItem组件），则使用itemId属性
    const id = typeof itemId === 'object' ? itemId.id : itemId;
    
    const track = tracks.find(track => 
      track.items.some(item => item.id === id)
    );
    
    if (!track) {
      console.log('未找到对应的轨道');
      return;
    }
    
    const item = track.items.find(item => item.id === id);
    if (!item) {
      console.log('未找到对应的轨道项目');
      return;
    }

    console.log('找到选中项目:', item, '所在轨道:', track.id);
    
    // 更新选中状态
    const itemWithTrackInfo = { 
      ...item, 
      trackId: track.id,
      type: track.type
    };
    setSelectedItem(itemWithTrackInfo);
    
    // 设置选中轨道ID
    setSelectedTrackId(track.id);
    
    // 通知父组件
    onItemSelect?.(itemWithTrackInfo);
    
    // 触发轨道项目选择事件，通知预览区域
    const selectEvent = new CustomEvent('track-item-select', {
      detail: {
        itemId: id,
        trackId: track.id,
        type: track.type,
        item: itemWithTrackInfo // 添加完整的项目数据
      }
    });
    document.dispatchEvent(selectEvent);
  }, [tracks, onItemSelect]);

  // 处理删除
  const handleDelete = useCallback(() => {
    if (!selectedItem) {
      message.warning('请先选择一个项目');
      return;
    }
    onDeleteItem?.(selectedItem.trackId, selectedItem.id);
  }, [selectedItem, onDeleteItem]);

  // 处理轨道展开/收起
  const handleToggleCollapse = useCallback(() => {
    onCollapsedChange?.(!isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  // 监听currentTime变化，确保时间轴视图跟随
  useEffect(() => {
    // 通知父组件当前时间更新
    onCursorChange?.(currentTime);
    
    // 自动滚动时间轴
    if (!timelineRef.current || !isPlaying) return;

    const timelineElement = timelineRef.current;
    const cursorPosition = calculateCursorPosition(currentTime);
    const timelineRect = timelineElement.getBoundingClientRect();
    const scrollLeft = timelineElement.scrollLeft;
    const visibleWidth = timelineRect.width;
    
    // 计算可视区域的边界
    const trackHeaderWidth = 36;
    const leftEdge = scrollLeft + trackHeaderWidth + 20; // 左边界，加一点缓冲区
    const rightEdge = scrollLeft + visibleWidth - 20; // 右边界，减一点缓冲区
    
    // 如果游标接近或超出可视区域，自动滚动
    if (cursorPosition < leftEdge || cursorPosition > rightEdge) {
      const newScrollLeft = Math.max(0, cursorPosition - visibleWidth / 2);
      timelineElement.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [currentTime, isPlaying, calculateCursorPosition, onCursorChange]);

  // 监听initialTracks变化
  useEffect(() => {
    if (initialTracks) {
      setTracks(JSON.parse(JSON.stringify(initialTracks)));
    }
  }, [initialTracks]);

  // 监听预览区域元素选择事件
  useEffect(() => {
    const handlePreviewElementSelect = (event) => {
      const { detail } = event;
      if (!detail) return;
      
      // 如果需要展开时间轴，通知父组件
      if (detail.expandTimeline && isCollapsed) {
        onCollapsedChange?.(false);
      }
      
      // 查找轨道项目并高亮
      const trackWithItem = tracks.find(track => 
        track.id === detail.trackId && 
        track.items.some(item => item.id === detail.itemId)
      );
      
      if (trackWithItem) {
        const item = trackWithItem.items.find(item => item.id === detail.itemId);
        if (item) {
          // 设置选中状态
          setSelectedItem({
            id: detail.itemId,
            trackId: detail.trackId,
            type: detail.type || trackWithItem.type
          });
          
          // 设置选中轨道ID
          setSelectedTrackId(detail.trackId);
          
          // 通知父组件有元素被选中
          onItemSelect?.({
            id: detail.itemId,
            trackId: detail.trackId,
            type: detail.type || trackWithItem.type
          });
          
          // 滚动到该项目位置
          scrollToItem(detail.trackId, detail.itemId);
          
          // 如果需要强制选中轨道，添加额外延迟，确保DOM更新后再应用样式
          if (detail.forceSelectTrack) {
            setTimeout(() => {
              // 高亮显示整个轨道
              const trackRow = document.querySelector(`[data-track-id="${detail.trackId}"]`);
              if (trackRow) {
                // 移除其他轨道的选中状态
                document.querySelectorAll('.track').forEach(el => {
                  el.classList.remove('selected');
                });
                
                // 添加选中状态，使用!important增加优先级
                trackRow.setAttribute('style', 'background-color: rgba(24, 144, 255, 0.15) !important');
                trackRow.classList.add('selected');
                
                // 确保轨道在视图中
                trackRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 200);
          }
          
          // 高亮显示轨道项目
          const trackItem = document.querySelector(`[data-item-id="${detail.itemId}"]`);
          if (trackItem) {
            // 移除其他项目的选中状态
            document.querySelectorAll('.track-item.selected').forEach(el => {
              if (el.getAttribute('data-item-id') !== detail.itemId) {
                el.classList.remove('selected');
              }
            });
            
            // 添加选中状态
            trackItem.classList.add('selected');
          }
          
          // 高亮显示整个轨道
          const trackRow = document.querySelector(`[data-track-id="${detail.trackId}"]`);
          if (trackRow) {
            // 移除其他轨道的选中状态
            document.querySelectorAll('.track.selected').forEach(el => {
              if (el.getAttribute('data-track-id') !== detail.trackId) {
                el.classList.remove('selected');
              }
            });
            
            // 添加选中状态
            trackRow.classList.add('selected');
            
            // 确保轨道在视图中
            const timelineContainer = timelineRef.current;
            if (timelineContainer) {
              const containerRect = timelineContainer.getBoundingClientRect();
              const trackRect = trackRow.getBoundingClientRect();
              
              if (trackRect.top < containerRect.top || trackRect.bottom > containerRect.bottom) {
                trackRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        }
      }
    };

    const handleTrackItemSelect = (event) => {
      const { detail } = event;
      if (!detail) return;
      
      // 如果需要展开时间轴，通知父组件
      if (detail.expandTimeline && isCollapsed) {
        onCollapsedChange?.(false);
      }
      
      // 查找轨道项目并高亮
      const trackWithItem = tracks.find(track => 
        track.id === detail.trackId && 
        track.items.some(item => item.id === detail.itemId)
      );
      
      if (trackWithItem) {
        const item = trackWithItem.items.find(item => item.id === detail.itemId);
        if (item) {
          // 设置选中状态
          setSelectedItem({
            id: detail.itemId,
            trackId: detail.trackId,
            type: detail.type || trackWithItem.type
          });
          
          // 设置选中轨道ID
          setSelectedTrackId(detail.trackId);
          
          // 通知父组件有元素被选中
          onItemSelect?.({
            id: detail.itemId,
            trackId: detail.trackId,
            type: detail.type || trackWithItem.type
          });
          
          // 滚动到该项目位置
          scrollToItem(detail.trackId, detail.itemId);
          
          // 选中轨道项目，但不选中整个轨道
          setTimeout(() => {
            // 移除所有轨道的选中状态
            document.querySelectorAll('.track.selected').forEach(el => {
              el.classList.remove('selected');
            });
            
            // 确保轨道项目有选中状态
            const trackItemElement = document.querySelector(`[data-item-id="${detail.itemId}"]`);
            if (trackItemElement) {
              trackItemElement.classList.add('selected');
            }
            
            // 查找轨道元素
            const trackRow = document.querySelector(`[data-track-id="${detail.trackId}"]`);
            if (trackRow) {
              // 确保轨道在视图中
              const timelineContainer = timelineRef.current;
              if (timelineContainer) {
                const containerRect = timelineContainer.getBoundingClientRect();
                const trackRect = trackRow.getBoundingClientRect();
                
                if (trackRect.top < containerRect.top || trackRect.bottom > containerRect.bottom) {
                  trackRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
          }, 50);
        }
      }
    };
    
    document.addEventListener('preview-element-select', handlePreviewElementSelect);
    document.addEventListener('track-item-select', handleTrackItemSelect);
    
    return () => {
      document.removeEventListener('preview-element-select', handlePreviewElementSelect);
      document.removeEventListener('track-item-select', handleTrackItemSelect);
    };
  }, [tracks, onItemSelect, timelineRef, isCollapsed, onCollapsedChange]);
  
  // 滚动到指定项目位置
  const scrollToItem = (trackId, itemId) => {
    // 使用setTimeout确保DOM已完全更新
    setTimeout(() => {
      const trackElem = document.querySelector(`[data-track-id="${trackId}"]`);
      const itemElem = document.querySelector(`[data-item-id="${itemId}"]`);
      
      if (trackElem && itemElem && timelineRef.current) {
        // 先强制添加选中状态
        document.querySelectorAll('.track').forEach(el => {
          if (el.getAttribute('data-track-id') !== trackId) {
            el.classList.remove('selected');
            el.removeAttribute('style');
          }
        });
        
        trackElem.classList.add('selected');
        trackElem.setAttribute('style', 'background-color: rgba(24, 144, 255, 0.15) !important');
        
        // 确保轨道在视窗中
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const trackRect = trackElem.getBoundingClientRect();
        
        // 垂直滚动到轨道位置
        if (trackRect.top < timelineRect.top || trackRect.bottom > timelineRect.bottom) {
          trackElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // 水平滚动到项目位置
        const itemRect = itemElem.getBoundingClientRect();
        const itemLeft = itemRect.left - timelineRect.left + timelineRef.current.scrollLeft;
        const itemRight = itemLeft + itemRect.width;
        
        if (itemLeft < timelineRef.current.scrollLeft || 
            itemRight > timelineRef.current.scrollLeft + timelineRect.width) {
          timelineRef.current.scrollLeft = itemLeft - timelineRect.width / 4;
        }
        
        // 清除所有项目的选中状态，然后只选中目标项目
        document.querySelectorAll('.track-item').forEach(el => {
          if (el.getAttribute('data-item-id') !== itemId) {
            el.classList.remove('selected');
          }
        });
        
        itemElem.classList.add('selected');
      }
    }, 200); // 增加延迟以确保DOM已更新
  };

  // 渲染轨道
  const renderTracks = useMemo(() => {
    if (tracks.length === 0) {
    return (
      <div className="empty-timeline-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">
              <PlayCircleOutlined />
          </div>
          <div className="empty-state-text">
            从左侧素材库中选择内容添加到轨道
          </div>
        </div>
      </div>
    );
    }

    return tracks.map(track => (
      <Track
        key={track.id}
        track={track}
        zoom={zoom}
        duration={getDuration()}
        isCollapsed={isCollapsed}
        selectedItemId={selectedItem?.id}
        onItemSelect={handleItemSelect}
        onItemDragStart={handleItemDragStart}
        onItemDrag={handleItemDrag}
        onItemDragEnd={handleItemDragEnd}
        onItemResize={handleItemResize}
        onTrackClick={handleTrackClick}
        isTrackSelected={selectedTrackId === track.id}
      />
    ));
  }, [tracks, zoom, isCollapsed, selectedItem, selectedTrackId, getDuration, handleItemSelect, handleItemDragStart, handleItemDrag, handleItemDragEnd, handleItemResize, handleTrackClick]);

  return (
    <div className={`track-editor ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="timeline-controls">
        <div className="left-controls">
          <button
            className="play-button"
            onClick={handlePlayPause}
            disabled={tracks.length === 0}
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
            onClick={handleDelete}
            disabled={!selectedItem}
            title="删除所选项目"
          >
            <DeleteOutlined />
          </button>
        </div>
        
        <div className="center-controls">
          <button 
            className="toggle-tracks-button" 
            onClick={handleToggleCollapse}
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
            {Math.min(currentTime, getActualVideoDuration()).toFixed(1)}s / {getActualVideoDuration().toFixed(1)}s
          </div>
        </div>
      </div>

      {isCollapsed ? (
        <div className="collapsed-video-tracks">
          {tracks.find(t => t.type === TRACK_TYPES.VIDEO)?.items[0] ? (
        <div 
              className={`collapsed-video-item ${selectedVideoId === tracks.find(t => t.type === TRACK_TYPES.VIDEO)?.items[0]?.id ? 'selected' : ''}`}
              onClick={() => onSelectedVideoIdChange?.(tracks.find(t => t.type === TRACK_TYPES.VIDEO)?.items[0]?.id)}
              style={{ width: '100%' }}
        >
          <div 
                className="video-frames-container"
            style={{ 
                  backgroundImage: `url(${tracks.find(t => t.type === TRACK_TYPES.VIDEO)?.items[0]?.cover || 'https://picsum.photos/300/200'})`,
                  backgroundSize: 'auto 100%',
                  backgroundRepeat: 'repeat-x',
                  backgroundPosition: 'center',
                }}
              />
              <div className="video-item-duration">
                {tracks.find(t => t.type === TRACK_TYPES.VIDEO)?.items[0]?.duration}s
          </div>
            </div>
          ) : (
            <div className="empty-track-message">
              暂无视频片段
            </div>
          )}
        </div>
      ) : (
        <div 
          className="timeline" 
          ref={timelineRef}
          onScroll={(e) => setScrollTop(e.target.scrollTop)}
        >
          <TimelineRuler
            duration={getDuration()}
            actualVideoDuration={getActualVideoDuration()}
            zoom={zoom}
            width={calculateTimelineWidth()}
            onTimelineClick={handleTimelineClick}
          />

          <TimelineCursor
            currentTime={Math.min(currentTime, getDuration() - 0.01)}
            duration={getDuration()}
            actualVideoDuration={getActualVideoDuration()}
            zoom={zoom}
            onTimeChange={(time) => {
              const actualVideoDur = getActualVideoDuration();
              if (time >= actualVideoDur || time < 0) {
                console.log(`游标位置无效，超出视频实际时长(${actualVideoDur.toFixed(1)}s)或小于0，重置到起点`);
                stopPlayback();
                setCurrentTime(0);
                onCursorChange?.(0);
              } else {
                const validTime = Math.min(time, actualVideoDur - 0.01);
                setCurrentTime(validTime);
                onCursorChange?.(validTime);
              }
            }}
            isPlaying={isPlaying}
          />

          {/* 添加视频时长分界线 */}
          <div 
            className="duration-boundary"
            style={{
              left: `${calculateCursorPosition(getActualVideoDuration())}px`,
              width: `${calculateTimelineWidth() - calculateCursorPosition(getActualVideoDuration())}px`
            }}
          />
          
          <div 
            className="tracks-container"
            style={{ width: `${calculateTimelineWidth()}px` }}
          >
            {renderTracks}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackEditor;