import React from 'react';
import PropTypes from 'prop-types';
import { FontSizeOutlined, CommentOutlined } from '@ant-design/icons';
import TrackItem from './TrackItem';

const TextTrackItem = ({
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
  // Check if this is a bubble text
  const hasBubbleStyle = item.bubbleStyle && (item.bubbleStyle.imageUrl || item.bubbleStyle.preview_url);
  
  return (
    <TrackItem
      item={item}
      trackId={trackId}
      trackType="TEXT"
      duration={duration}
      isSelected={isSelected}
      hasCollision={hasCollision}
      isDragging={isDragging}
      onItemClick={onItemClick}
      onItemDragStart={onItemDragStart}
      onItemResizeStart={onItemResizeStart}
    >
      <div className={`media-container text-media-container ${hasBubbleStyle ? 'bubble-container' : ''}`}>
        {hasBubbleStyle && (
          <div className="bubble-preview" 
            style={{ 
              backgroundImage: `url(${item.bubbleStyle.preview_url || item.bubbleStyle.imageUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} 
          />
        )}
        <div className="text-content-preview" style={{
          color: hasBubbleStyle ? item.bubbleStyle.textColor : 'inherit',
          textAlign: hasBubbleStyle ? item.bubbleStyle.textAlign : 'center'
        }}>
          {item.content}
        </div>
        <div className="text-icon">
          {hasBubbleStyle ? <CommentOutlined /> : <FontSizeOutlined />}
        </div>
      </div>
    </TrackItem>
  );
};

TextTrackItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    bubbleStyle: PropTypes.object,
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

export default TextTrackItem; 