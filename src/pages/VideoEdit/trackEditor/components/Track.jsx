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

  // 当轨道中的项目被选中或轨道本身被选中时，高亮显示轨道
  useEffect(() => {
    if (!trackRef.current) return;
    
    const hasSelectedItem = track.items.some(item => item.id === selectedItemId);
    
    if (hasSelectedItem || isTrackSelected) {
      trackRef.current.classList.add('selected');
      // 添加强制样式
      trackRef.current.setAttribute('style', 'background-color: rgba(24, 144, 255, 0.15) !important');
    } else {
      trackRef.current.classList.remove('selected');
      trackRef.current.removeAttribute('style');
    }
  }, [selectedItemId, track.items, isTrackSelected]);
  
  // 处理轨道选择事件
  useEffect(() => {
    const handleTrackItemSelect = (event) => {
      const { detail } = event;
      if (!detail || !trackRef.current) return;
      
      // 如果选中项目属于此轨道，则选中此轨道
      if (detail.trackId === track.id) {
        trackRef.current.classList.add('selected');
      } else {
        trackRef.current.classList.remove('selected');
      }
    };
    
    document.addEventListener('track-item-select', handleTrackItemSelect);
    document.addEventListener('preview-element-select', handleTrackItemSelect);
    
    return () => {
      document.removeEventListener('track-item-select', handleTrackItemSelect);
      document.removeEventListener('preview-element-select', handleTrackItemSelect);
    };
  }, [track.id]);

  return (
    <div
      ref={trackRef}
      className={`track ${track.type} ${isCollapsed ? 'collapsed' : ''} ${isTrackSelected ? 'selected' : ''}`}
      data-track-id={track.id}
      data-track-type={track.type}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTrackClick?.(track.id);
        
        // 触发轨道选中事件
        const trackSelectEvent = new CustomEvent('track-select', {
          detail: {
            trackId: track.id,
            type: track.type
          }
        });
        document.dispatchEvent(trackSelectEvent);
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
          return (
            <TrackItem
              key={item.id}
              item={item}
              track={track}
              zoom={zoom}
              duration={duration}
              isSelected={item.id === selectedItemId}
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