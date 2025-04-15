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
        return <VideoCameraOutlined />;
      case TRACK_TYPES.VOICE:
        return <CustomerServiceOutlined />;
      case TRACK_TYPES.AUDIO:
        return <CustomerServiceOutlined style={{ color: '#1890ff' }} />;
      case TRACK_TYPES.BACKGROUND:
        return <PictureOutlined style={{ color: '#6f42c1' }} />;
      case TRACK_TYPES.IMAGE:
        return <PictureOutlined />;
      case TRACK_TYPES.TEXT:
        return <FontSizeOutlined />;
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

  return (
    <div
      ref={trackRef}
      className={`track ${track.type} ${isCollapsed ? 'collapsed' : ''}`}
      data-track-id={track.id}
      data-track-type={track.type}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTrackClick?.(track.id);
      }}
    >
      <div className="track-header">
        <div className="track-info">
          <span className={`track-icon type-${track.type}`}>
            {getTrackIcon()}
          </span>
        </div>
      </div>

      <div className="track-content">
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