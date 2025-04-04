import React, { useMemo } from 'react';

const TimelineRuler = ({
  duration,
  actualVideoDuration,
  zoom,
  trackHeaderWidth = 36,
  width,
  onTimelineClick
}) => {
  // 计算刻度标记
  const rulerMarks = useMemo(() => {
    const marks = [];
    const totalMarks = Math.ceil(duration * 10); // 每0.1秒一个刻度
    const baseWidthPerSecond = 100; // 基础每秒宽度
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;

    // 计算视频实际结束位置，用于标记
    const realVideoDuration = actualVideoDuration || duration;
    const videoEndPosition = trackHeaderWidth + (realVideoDuration * scaledWidthPerSecond);

    for (let i = 0; i <= totalMarks; i++) {
      const isSecondMark = i % 10 === 0;
      const time = i / 10; // 转换为秒
      const position = trackHeaderWidth + (time * scaledWidthPerSecond);

      // 生成普通刻度标记
      marks.push(
        <div
          key={i}
          className={`ruler-mark ${isSecondMark ? 'second-mark' : ''}`}
          style={{
            left: `${position}px`,
            width: '1px',
            flex: 'none'
          }}
        >
          {isSecondMark && (
            <span className="ruler-label">{time}s</span>
          )}
        </div>
      );
    }

    // 添加视频实际结束位置标记（如果与时间轴总长度不同）
    if (Math.abs(realVideoDuration - duration) > 0.1) {
      marks.push(
        <div
          key="video-end"
          className="ruler-mark video-end-mark"
          style={{
            left: `${videoEndPosition}px`,
            width: '2px',
            backgroundColor: 'red',
            height: '100%',
            flex: 'none',
            position: 'absolute',
            zIndex: 5
          }}
        >
          <span className="ruler-label video-end-label" style={{
            position: 'absolute',
            top: '-18px',
            left: '5px',
            fontSize: '11px',
            color: 'red',
            whiteSpace: 'nowrap'
          }}>
            视频结束 ({realVideoDuration.toFixed(1)}s)
          </span>
        </div>
      );
    }

    return marks;
  }, [duration, actualVideoDuration, zoom, trackHeaderWidth]);

  // 处理时间轴点击
  const handleClick = (e) => {
    if (e.target.closest('.cursor-indicator') || e.target.closest('.cursor-line')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + e.currentTarget.parentElement.querySelector('.tracks-container').scrollLeft;
    
    // 如果点击在轨道头部区域，不处理
    if (clickX < trackHeaderWidth) return;
    
    const baseWidthPerSecond = 100; // 基础每秒宽度
    const scaledWidthPerSecond = baseWidthPerSecond * zoom;
    const clickTime = (clickX - trackHeaderWidth) / scaledWidthPerSecond;
    
    // 将时间吸附到最近的0.1秒
    const snappedTime = Math.round(clickTime * 10) / 10;
    
    // 获取实际视频时长
    const realVideoDuration = actualVideoDuration || duration;
    
    // 强制检查：确保时间不超过视频实际时长
    if (snappedTime >= realVideoDuration) {
      // 点击超出视频实际时长，重置到起点
      console.log(`点击位置(${snappedTime.toFixed(1)}s)超出视频实际时长(${realVideoDuration.toFixed(1)}s)，重置到0点`);
      onTimelineClick(0);
    } else if (snappedTime < 0) {
      // 如果小于0，也重置到0
      onTimelineClick(0); 
    } else {
      // 正常范围内的点击
      onTimelineClick(snappedTime);
    }
  };

  return (
    <div
      className="timeline-ruler"
      style={{
        width: `${width}px`,
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 2,
        paddingLeft: `${trackHeaderWidth}px`,
        boxSizing: 'border-box'
      }}
      onClick={handleClick}
    >
      {rulerMarks}
    </div>
  );
};

export default TimelineRuler; 