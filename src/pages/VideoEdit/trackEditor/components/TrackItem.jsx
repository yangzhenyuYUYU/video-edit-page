import React from 'react';
import PropTypes from 'prop-types';

const TrackItem = ({
  item,
  trackId,
  trackType,
  duration,
  isSelected,
  hasCollision,
  isDragging,
  dragOffset,
  onItemClick,
  onItemDragStart,
  onItemResizeStart,
  children
}) => {
  return (
    <div
      data-item-id={item.id}
      className={`track-item type-${trackType.toLowerCase()} ${
        isSelected ? 'selected' : ''
      } ${
        hasCollision ? 
          (isDragging ? 'collision-warning' : 'collision-target') 
          : ''
      } ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${(item.start / duration) * 100}%`,
        width: `${(item.duration / duration) * 100}%`,
        transform: isDragging && dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
        zIndex: isDragging ? 1000 : 1
      }}
      onClick={() => onItemClick(trackId, item.id)}
      onMouseDown={(e) => onItemDragStart(e, trackId, item.id)}
    >
      <div 
        className="resize-handle left"
        onMouseDown={(e) => onItemResizeStart(e, 'left', trackId, item.id)}
      />
      {children}
      <div 
        className="resize-handle right"
        onMouseDown={(e) => onItemResizeStart(e, 'right', trackId, item.id)}
      />
    </div>
  );
};

TrackItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    src: PropTypes.string
  }).isRequired,
  trackId: PropTypes.string.isRequired,
  trackType: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  hasCollision: PropTypes.bool,
  isDragging: PropTypes.bool,
  dragOffset: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  onItemClick: PropTypes.func.isRequired,
  onItemDragStart: PropTypes.func.isRequired,
  onItemResizeStart: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};

export default TrackItem; 