import React from 'react';
import PropTypes from 'prop-types';
import { AudioOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import TrackItem from './TrackItem';

const AudioTrackItem = ({
  item,
  trackId,
  duration,
  isSelected,
  hasCollision,
  isDragging,
  onItemClick,
  onItemDragStart,
  onItemResizeStart,
  audioWaveforms,
  isBackground
}) => {
  const renderAudioWaveform = () => {
    const waveform = audioWaveforms[item.id];
    
    if (!waveform) {
      return (
        <div className="audio-placeholder">
          <div className="audio-waveform-placeholder"></div>
        </div>
      );
    }
    
    return (
      <div className="audio-waveform-container">
        {waveform.map((height, index) => (
          <div 
            key={index} 
            className="waveform-bar"
            style={{ 
              left: `${(index / (waveform.length - 1)) * 100}%`,
              height: `${height * 100}%`
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
      trackType={isBackground ? "BACKGROUND" : "VOICE"}
      duration={duration}
      isSelected={isSelected}
      hasCollision={hasCollision}
      isDragging={isDragging}
      onItemClick={onItemClick}
      onItemDragStart={onItemDragStart}
      onItemResizeStart={onItemResizeStart}
    >
      <div className="media-container">
        <div className="media-thumbnail audio-thumbnail">
          {renderAudioWaveform()}
          {isBackground ? 
            <CustomerServiceOutlined className="media-icon" /> : 
            <AudioOutlined className="media-icon" />
          }
        </div>
        <span className="item-text">{item.content}</span>
      </div>
    </TrackItem>
  );
};

AudioTrackItem.propTypes = {
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
  audioWaveforms: PropTypes.object.isRequired,
  isBackground: PropTypes.bool
};

export default AudioTrackItem; 