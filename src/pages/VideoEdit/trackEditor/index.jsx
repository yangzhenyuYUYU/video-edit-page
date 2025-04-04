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
  onDeleteItem
}) => {
  // 状态管理
  const [tracks, setTracks] = useState(() => initialTracks || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [collisionWarning, setCollisionWarning] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Refs
  const timelineRef = useRef(null);
  const playbackRef = useRef(null);
  const dragItemRef = useRef(null);
  
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
    
    // 清除任何存在的播放定时器
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }
    
    // 使用定时器推进时间，每10ms检查一次
    playbackRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
        // 使用视频实际时长作为判断依据
        const actualVideoDur = getActualVideoDuration();
        const nextTime = prevTime + 0.1;
        
        // 检查是否到达了视频末尾
        if (nextTime >= actualVideoDur) {
          console.log('播放到达视频实际末尾，停止并重置到起点');
          stopPlayback();
          // 重置到起点
          setTimeout(() => {
            setCurrentTime(0);
            onCursorChange?.(0);
          }, 0);
          return 0;
        }
        
        return nextTime;
      });
    }, 100);
  }, [getActualVideoDuration, onCursorChange, stopPlayback]);

  // 播放控制 - 现在stopPlayback已经定义，可以安全引用
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      // 使用视频实际时长作为判断依据
      const actualVideoDur = getActualVideoDuration();
      
      // 如果当前时间已经到了或超过视频实际时长，立即重置到起点
      if (currentTime >= actualVideoDur) {
        console.log('播放前检查：currentTime超出视频实际时长，重置到起点');
        setCurrentTime(0);
        onCursorChange?.(0);
        // 等待下一帧再开始播放，确保界面更新
        requestAnimationFrame(() => {
          startPlayback();
        });
        return;
      }
      
      startPlayback();
    }
  }, [isPlaying, currentTime, getActualVideoDuration, onCursorChange, stopPlayback, startPlayback]);

  // 处理时间轴点击 - 确保stopPlayback在这之前定义
  const handleTimelineClick = useCallback((time) => {
    if (isPlaying) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
      setIsPlaying(false);
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
  }, [isPlaying, onCursorChange, getActualVideoDuration]);

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
  }, []);

  const handleItemDrag = useCallback((itemId, newStart, targetTrackId) => {
    // 找到原始轨道和项目
    let sourceTrack = null;
    let draggedItem = null;
    
    tracks.forEach(track => {
      const item = track.items.find(i => i.id === itemId);
      if (item) {
        sourceTrack = track;
        draggedItem = item;
      }
    });
    
    if (!sourceTrack || !draggedItem) return;

    // 如果目标轨道和源轨道不同，且目标轨道存在
    if (targetTrackId && targetTrackId !== sourceTrack.id) {
      const targetTrack = tracks.find(t => t.id === targetTrackId);
      if (!targetTrack) return;
      
      // 检查目标轨道类型是否与源轨道类型相同
      if (targetTrack.type !== sourceTrack.type) {
        console.log('不能跨不同类型的轨道拖拽', sourceTrack.type, targetTrack.type);
        return; // 类型不同，不允许拖拽
      }

      // 检查目标轨道的碰撞
      const { hasCollision, collidingItemIds } = checkCollision(
        targetTrackId,
        itemId,
        newStart,
        draggedItem.duration
      );
      
      setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);

      if (!hasCollision) {
        // 从源轨道移除项目，添加到目标轨道
        const newTracks = tracks.map(track => {
          if (track.id === sourceTrack.id) {
            return {
              ...track,
              items: track.items.filter(i => i.id !== itemId)
            };
          }
          if (track.id === targetTrackId) {
            return {
              ...track,
              items: [...track.items, { 
                ...draggedItem, 
                start: newStart,
                trackId: targetTrackId // 确保更新项目的轨道ID
              }]
            };
          }
          return track;
        });

        setTracks(newTracks);
        onTrackChange?.(newTracks);
      }
    } else {
      // 在同一轨道内移动
      const { hasCollision, collidingItemIds } = checkCollision(
        sourceTrack.id,
        itemId,
        newStart,
        draggedItem.duration
      );
      
      setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);

      if (!hasCollision) {
        const newTracks = tracks.map(t => {
          if (t.id === sourceTrack.id) {
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
  }, []);
        
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
    setSelectedItem(null);
    onItemSelect?.({
      trackId,
      type: tracks.find(t => t.id === trackId)?.type,
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

  // 监听currentTime变化
  useEffect(() => {
    onCursorChange?.(currentTime);
  }, [currentTime, onCursorChange]);

  // 监听initialTracks变化
  useEffect(() => {
    if (initialTracks) {
      setTracks(JSON.parse(JSON.stringify(initialTracks)));
    }
  }, [initialTracks]);

  // 清理播放定时器
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, []);

  // 监听预览区域元素选择事件
  useEffect(() => {
    const handlePreviewElementSelect = (event) => {
      const { detail } = event;
      if (!detail) return;
      
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
          
          // 通知父组件有元素被选中
          onItemSelect?.({
            id: detail.itemId,
            trackId: detail.trackId,
            type: detail.type || trackWithItem.type
          });
          
          // 滚动到该项目位置
          scrollToItem(detail.trackId, detail.itemId);
          
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
        }
      }
    };

    const handleTrackItemSelect = (event) => {
      const { detail } = event;
      if (!detail) return;
      
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
          
          // 通知父组件有元素被选中
          onItemSelect?.({
            id: detail.itemId,
            trackId: detail.trackId,
            type: detail.type || trackWithItem.type
          });
          
          // 滚动到该项目位置
          scrollToItem(detail.trackId, detail.itemId);
          
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
        }
      }
    };
    
    document.addEventListener('preview-element-select', handlePreviewElementSelect);
    document.addEventListener('track-item-select', handleTrackItemSelect);
    
    return () => {
      document.removeEventListener('preview-element-select', handlePreviewElementSelect);
      document.removeEventListener('track-item-select', handleTrackItemSelect);
    };
  }, [tracks, onItemSelect]);
  
  // 滚动到指定项目位置
  const scrollToItem = (trackId, itemId) => {
    const trackElem = document.querySelector(`[data-track-id="${trackId}"]`);
    const itemElem = document.querySelector(`[data-item-id="${itemId}"]`);
    
    if (trackElem && itemElem && timelineRef.current) {
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const itemRect = itemElem.getBoundingClientRect();
      
      // 计算项目在时间轴中的位置
      const itemLeft = itemRect.left - timelineRect.left + timelineRef.current.scrollLeft;
      const itemRight = itemLeft + itemRect.width;
      
      // 确保项目在可视区域内
      if (itemLeft < timelineRef.current.scrollLeft || 
          itemRight > timelineRef.current.scrollLeft + timelineRect.width) {
        timelineRef.current.scrollLeft = itemLeft - timelineRect.width / 4;
      }
    }
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
      />
    ));
  }, [tracks, zoom, isCollapsed, selectedItem, getDuration]);

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
            {currentTime.toFixed(1)}s / {getDuration().toFixed(1)}s
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
              // 获取当前视频实际时长
              const actualVideoDur = getActualVideoDuration();
              
              // 对时间进行有效性和边界检查
              if (time >= actualVideoDur || time < 0) {
                console.log(`游标位置无效，超出视频实际时长(${actualVideoDur.toFixed(1)}s)或小于0，重置到起点`);
                // 立即停止播放
                stopPlayback();
                
                // 重置到起点
                requestAnimationFrame(() => {
                  setCurrentTime(0);
                  onCursorChange?.(0);
                });
              } else {
                // 确保在有效范围内
                const validTime = Math.min(time, actualVideoDur - 0.01);
                setCurrentTime(validTime);
                onCursorChange?.(validTime);
              }
            }}
            isPlaying={isPlaying}
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