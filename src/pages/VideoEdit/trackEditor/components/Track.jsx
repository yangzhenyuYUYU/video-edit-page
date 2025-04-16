import React, { useEffect, useRef } from 'react';
import { VideoCameraOutlined, AudioOutlined, CustomerServiceOutlined, PictureOutlined, FontSizeOutlined, SoundOutlined } from '@ant-design/icons';
import TrackItem from './TrackItem';
import { TRACK_TYPES } from '../../constants';

const Track = ({
  track,
  zoom,
  duration,
  isCollapsed,
  selectedItemId,
  onItemSelect,
  onItemDragStart,
  onItemDrag,
  onItemDragEnd,
  onItemResize,
  onTrackClick,
  isTrackSelected
}) => {
  const trackRef = useRef(null);
  
  // 获取轨道图标
  const getTrackIcon = () => {
    switch (track.type) {
      case TRACK_TYPES.VIDEO:
        return <VideoCameraOutlined style={{ fontSize: '16px', color: '#fa541c' }} />;
      case TRACK_TYPES.VOICE:
        return <CustomerServiceOutlined style={{ fontSize: '16px', color: '#722ed1' }} />;
      case TRACK_TYPES.AUDIO:
        return <AudioOutlined style={{ fontSize: '16px', color: '#1890ff' }} />;
      case TRACK_TYPES.BACKGROUND:
        return <SoundOutlined style={{ fontSize: '16px', color: '#6f42c1' }} />;
      case TRACK_TYPES.IMAGE:
        return <PictureOutlined style={{ fontSize: '16px', color: '#13c2c2' }} />;
      case TRACK_TYPES.TEXT:
        return <FontSizeOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />;
      default:
        return null;
    }
  };

  // 监听选中事件确保正确处理
  useEffect(() => {
    const handleSelectionEvents = (event) => {
      const { detail } = event;
      if (!detail || !trackRef.current) return;
      
      // 如果是轨道项目选中事件
      if (event.type === 'track-item-select') {
        // 移除所有轨道项目的选中状态
        const allTrackItems = trackRef.current.querySelectorAll('.track-item');
        allTrackItems.forEach(item => {
          item.classList.remove('selected');
        });
        
        // 找到对应的轨道项目并设置选中状态
        const trackItem = trackRef.current.querySelector(`[data-item-id="${detail.itemId}"]`);
        if (trackItem && detail.trackId === track.id) {
          trackItem.classList.add('selected');
        }
      }
    };
    
    document.addEventListener('track-item-select', handleSelectionEvents);
    document.addEventListener('preview-element-select', handleSelectionEvents);
    
    return () => {
      document.removeEventListener('track-item-select', handleSelectionEvents);
      document.removeEventListener('preview-element-select', handleSelectionEvents);
    };
  }, [track.id]);

  // 处理轨道点击事件
  const handleTrackClick = (e) => {
    // 阻止冒泡，以免触发父元素的点击事件
    e.preventDefault();
    e.stopPropagation();
    
    // 确保点击的是轨道本身，而不是轨道内的项目
    if (e.target === e.currentTarget || 
        e.target.classList.contains('track-content') || 
        e.target.classList.contains('track-header') ||
        e.target.classList.contains('track-info') ||
        e.target.classList.contains('track-icon')) {
      console.log('点击轨道:', track.id);
      onTrackClick?.(track.id);
    }
  };

  return (
    <div
      ref={trackRef}
      className={`track ${track.type === TRACK_TYPES.BACKGROUND ? 'bg-track' : ''} ${track.type} ${isCollapsed ? 'collapsed' : ''} ${isTrackSelected ? 'selected-track' : ''}`}
      data-track-id={track.id}
      data-track-type={track.type}
      onClick={handleTrackClick}
    >
      <div className="track-header" title={`${track.type}轨道`}>
        <div className="track-info">
          <span className={`track-icon type-${track.type}`}>
            {getTrackIcon()}
          </span>
        </div>
      </div>

      <div className="track-content" onClick={handleTrackClick}>
        {track.items.map(item => {
          const isBeyondDuration = item.start + item.duration > duration;
          const isItemSelected = item.id === selectedItemId;
          
          return (
            <TrackItem
              key={item.id}
              item={item}
              track={track}
              zoom={zoom}
              duration={duration}
              isSelected={isItemSelected}
              onSelect={onItemSelect}
              onDragStart={onItemDragStart}
              onDrag={onItemDrag}
              onDragEnd={onItemDragEnd}
              onResize={onItemResize}
              isCollapsed={isCollapsed}
              isBeyondDuration={isBeyondDuration}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Track; 