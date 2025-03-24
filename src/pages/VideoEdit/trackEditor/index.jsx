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

  // 计算时间轴总宽度
  const calculateTimelineWidth = useCallback(() => {
    const duration = getDuration();
    const trackHeaderWidth = 36;
    const baseWidthPerSecond = 100;
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    return trackHeaderWidth + (duration * scaledWidthPerSecond);
  }, [zoom]);

  // 获取总时长
  const getDuration = useCallback(() => {
    if (tracks.length === 0) return 10;

    let maxEndTime = 0;
    tracks.forEach(track => {
      track.items.forEach(item => {
        const itemEndTime = item.start + item.duration;
        if (itemEndTime > maxEndTime) {
          maxEndTime = itemEndTime;
        }
      });
    });

    const minDuration = videoDuration;
    const extraSpace = 0.1;
    return Math.max(maxEndTime * (1 + extraSpace), minDuration);
  }, [tracks, videoDuration]);

  // 播放控制
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
        playbackRef.current = null;
      }
      setIsPlaying(false);
    } else {
    const duration = getDuration();
    const startTime = currentTime >= duration ? 0 : currentTime;
    setCurrentTime(startTime);
    setIsPlaying(true);

    playbackRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
        const nextTime = prevTime + 0.1;
        if (nextTime >= duration) {
            clearInterval(playbackRef.current);
            playbackRef.current = null;
            setIsPlaying(false);
          return 0;
        }
        return nextTime;
      });
    }, 100);
    }
  }, [isPlaying, currentTime, getDuration]);

  // 处理时间轴点击
  const handleTimelineClick = useCallback((time) => {
    if (isPlaying) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    setIsPlaying(false);
    }
    setCurrentTime(time);
    onCursorChange?.(time);
  }, [isPlaying, onCursorChange]);

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

  const handleItemDrag = useCallback((itemId, newStart) => {
    const track = tracks.find(track => 
      track.items.some(item => item.id === itemId)
    );
    
    if (!track) return;

    const item = track.items.find(item => item.id === itemId);
    if (!item) return;

    const { hasCollision, collidingItemIds } = checkCollision(
      track.id,
      itemId,
      newStart,
      item.duration
    );
    
    setCollisionWarning(hasCollision ? [...collidingItemIds, itemId] : []);

    if (!hasCollision) {
      const newTracks = tracks.map(t => {
        if (t.id === track.id) {
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
                return { ...i, start: newStart, duration: newDuration };
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
    const track = tracks.find(track => 
      track.items.some(item => item.id === itemId)
    );
    
    if (!track) return;
    
    const item = track.items.find(item => item.id === itemId);
    if (!item) return;

    const itemWithTrackId = { ...item, trackId: track.id };
      setSelectedItem(itemWithTrackId);
      onItemSelect?.(itemWithTrackId);
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
            zoom={zoom}
            width={calculateTimelineWidth()}
            onTimelineClick={handleTimelineClick}
          />

          <TimelineCursor
            currentTime={currentTime}
            duration={getDuration()}
            zoom={zoom}
            onTimeChange={(time) => {
              setCurrentTime(time);
              onCursorChange?.(time);
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