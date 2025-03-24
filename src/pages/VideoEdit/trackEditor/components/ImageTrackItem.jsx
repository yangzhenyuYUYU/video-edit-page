import React from 'react';
import PropTypes from 'prop-types';
import { PictureOutlined } from '@ant-design/icons';
import TrackItem from './TrackItem';

const ImageTrackItem = ({
  item,
  trackId,
  duration,
  isSelected,
  hasCollision,
  isDragging,
  onItemClick,
  onItemDragStart,
  onItemResizeStart
}) => {
  return (
    <TrackItem
      item={item}
      trackId={trackId}
      trackType="IMAGE"
      duration={duration}
      isSelected={isSelected}
      hasCollision={hasCollision}
      isDragging={isDragging}
      onItemClick={onItemClick}
      onItemDragStart={onItemDragStart}
      onItemResizeStart={onItemResizeStart}
    >
      <div className="media-container">
        <div className="media-thumbnail">
          {item.src ? (
            <img src={item.src} alt={item.content} className="thumbnail-preview" />
          ) : (
            <PictureOutlined className="media-icon" />
          )}
        </div>
        <span className="item-text">{item.content}</span>
      </div>
    </TrackItem>
  );
};

ImageTrackItem.propTypes = {
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
  onItemResizeStart: PropTypes.func.isRequired
};

export default ImageTrackItem; 