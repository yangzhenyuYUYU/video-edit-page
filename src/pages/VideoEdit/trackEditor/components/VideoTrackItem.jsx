import React from 'react';
import PropTypes from 'prop-types';
import { VideoCameraOutlined } from '@ant-design/icons';
import TrackItem from './TrackItem';

const VideoTrackItem = ({
  item,
  trackId,
  duration,
  isSelected,
  hasCollision,
  isDragging,
  onItemClick,
  onItemDragStart,
  onItemResizeStart,
  videoFrames,
  isHuman
}) => {
  const renderVideoFrames = () => {
    const frameData = videoFrames[item.id];
    
    if (!frameData || !frameData.frames) {
      return (
        <div className="video-placeholder">
          <VideoCameraOutlined />
        </div>
      );
    }
    
    if (isHuman) {
      return (
        <div className="video-frames">
          <div 
            className="video-frame main-frame"
            style={{ 
              backgroundImage: `url(${frameData.frames[0]})`
            }}
          />
        </div>
      );
    }
    
    return (
      <div className="video-frames">
        {frameData.frames.map((frame, index) => (
          <div 
            key={index} 
            className={`video-frame ${index === Math.floor(frameData.frames.length / 2) ? 'main-frame' : ''}`}
            style={{ 
              left: `${(index / (frameData.frames.length - 1)) * 100}%`,
              backgroundImage: `url(${frame})`
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <TrackItem
      item={item}
      trackId={trackId}
      trackType="VIDEO"
      duration={duration}
      isSelected={isSelected}
      hasCollision={hasCollision}
      isDragging={isDragging}
      onItemClick={onItemClick}
      onItemDragStart={onItemDragStart}
      onItemResizeStart={onItemResizeStart}
    >
      {isHuman && (
        <div 
          className="text-background"
          data-content={item.content}
        >
          {item.content}
        </div>
      )}
      <div className={`media-container ${isHuman ? 'human-video-container' : ''}`}>
        <div className="media-thumbnail video-thumbnail">
          {renderVideoFrames()}
          {!isHuman && <VideoCameraOutlined className="media-icon" />}
        </div>
        <span className="item-text">{item.content}</span>
      </div>
    </TrackItem>
  );
};

VideoTrackItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    src: PropTypes.string
  }).isRequired,
  trackId: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  hasCollision: PropTypes.bool,
  isDragging: PropTypes.bool,
  onItemClick: PropTypes.func.isRequired,
  onItemDragStart: PropTypes.func.isRequired,
  onItemResizeStart: PropTypes.func.isRequired,
  videoFrames: PropTypes.object.isRequired,
  isHuman: PropTypes.bool
};

export default VideoTrackItem; 