import React, { useMemo } from 'react';

const TimelineRuler = ({
  duration,
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

    for (let i = 0; i <= totalMarks; i++) {
      const isSecondMark = i % 10 === 0;
      const time = i / 10; // 转换为秒
      const position = trackHeaderWidth + (time * scaledWidthPerSecond);

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

    return marks;
  }, [duration, zoom, trackHeaderWidth]);

  // 处理时间轴点击
  const handleClick = (e) => {
    if (e.target.closest('.cursor-indicator') || e.target.closest('.cursor-line')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + e.currentTarget.parentElement.querySelector('.tracks-container').scrollLeft;
    
    // 如果点击在轨道头部区域，不处理
    if (clickX < trackHeaderWidth) return;
    
    const effectiveWidth = (width - trackHeaderWidth) * zoom;
    const clickTime = ((clickX - trackHeaderWidth) / effectiveWidth) * duration;
    
    // 将时间吸附到最近的0.1秒
    const snappedTime = Math.round(clickTime * 10) / 10;
    onTimelineClick(Math.max(0, Math.min(snappedTime, duration)));
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