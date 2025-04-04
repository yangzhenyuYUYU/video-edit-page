import React from 'react';
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
  onTrackClick
}) => {
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

  return (
    <div
      className={`track ${isCollapsed ? 'collapsed' : ''} type-${track.type} ${track.type === TRACK_TYPES.BACKGROUND ? 'bg-track' : ''}`}
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
        {track.items.map(item => (
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
          />
        ))}
      </div>
    </div>
  );
};

export default Track; 