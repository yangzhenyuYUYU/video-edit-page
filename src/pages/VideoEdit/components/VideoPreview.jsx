import React, { useRef, useEffect, useState } from 'react';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PlusOutlined,
  MinusOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';

const VideoPreview = ({ 
  width = '100%', 
  height = '100%', 
  videoSrc,
  tracks = [],
  currentTime = 0,
  isPlaying = false,
  onPlay,
  onPause,
  onSeek
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prevLevel => Math.min(prevLevel + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prevLevel => Math.max(prevLevel - 10, 50));
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || !!document.webkitFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Video setup effect
  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.currentTime = currentTime;
      
      if (isPlaying) {
        video.play().catch(error => {
          console.error('Video playback failed:', error);
        });
      } else {
        video.pause();
      }
    }
  }, [currentTime, isPlaying, videoSrc]);

  // Function to draw text items (regular text and bubbles)
  const drawTextItems = (ctx, canvasWidth, canvasHeight) => {
    const activeTextItems = tracks
      .filter(track => track.type === 'text')
      .flatMap(track => track.items)
      .filter(item => 
        item.start <= currentTime && 
        item.start + item.duration > currentTime
      );

    activeTextItems.forEach(item => {
      if (item.bubbleStyle) {
        // Render text with bubble background
        drawTextBubble(ctx, item, canvasWidth, canvasHeight);
      } else {
        // Render regular text
        drawPlainText(ctx, item, canvasWidth, canvasHeight);
      }
    });
  };

  // Function to draw a text bubble
  const drawTextBubble = (ctx, item, canvasWidth, canvasHeight) => {
    const { content, bubbleStyle } = item;
    const {
      imageUrl, 
      preview_url, 
      textColor, 
      textAlign, 
      paddingVertical, 
      paddingHorizontal,
      width: bubbleWidth,
      height: bubbleHeight
    } = bubbleStyle;

    // Calculate bubble position (center of screen by default)
    const x = (canvasWidth - (bubbleWidth || 300)) / 2;
    const y = (canvasHeight - (bubbleHeight || 120)) / 2;

    // Load and draw bubble background
    const bubbleImage = new Image();
    bubbleImage.onload = () => {
      // Draw the bubble background
      ctx.drawImage(
        bubbleImage, 
        x, 
        y, 
        bubbleWidth || 300, 
        bubbleHeight || 120
      );

      // Configure text style
      ctx.font = '20px Arial';
      ctx.fillStyle = textColor || '#000000';
      ctx.textAlign = textAlign || 'center';
      ctx.textBaseline = 'middle';

      // Calculate text position within bubble
      const textX = x + (bubbleWidth || 300) / 2;
      const textY = y + (bubbleHeight || 120) / 2;

      // Draw the text
      ctx.fillText(content, textX, textY, (bubbleWidth || 300) - (paddingHorizontal || 16) * 2);
    };
    
    // Set bubble image source with fallback
    bubbleImage.src = preview_url || imageUrl;
  };

  // Function to draw plain text
  const drawPlainText = (ctx, item, canvasWidth, canvasHeight) => {
    const { content } = item;

    // Configure text style for plain text
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw text at center of canvas
    ctx.fillText(content, canvasWidth / 2, canvasHeight / 2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // Render preview overlay effects
  const renderPreviewOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    const { width: canvasWidth, height: canvasHeight } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw all active text items
    drawTextItems(ctx, canvasWidth, canvasHeight);
    
    // Request next frame
    requestAnimationFrame(renderPreviewOverlay);
  };

  // Set up canvas and start render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (canvas && container) {
      // Set canvas dimensions to match container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Start render loop
      const animationId = requestAnimationFrame(renderPreviewOverlay);
      
      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [tracks, currentTime]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 渲染网格背景
  const renderGridBackground = () => {
    return (
      <div className="grid-background">
        <div className="grid-pattern"></div>
        <div className="upload-hint">
          <div className="hint-icon">
            <VideoCameraOutlined />
          </div>
          <div className="hint-text">点击左侧素材添加视频</div>
        </div>
      </div>
    );
  };

  // 视频播放状态同步
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (Math.abs(video.currentTime - currentTime) > 0.1) {
        video.currentTime = currentTime;
      }
    };

    const handleVideoEnd = () => {
      onPause?.();
      video.currentTime = 0;
      onSeek?.(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentTime, onPause, onSeek]);

  return (
    <div 
      className="video-preview-container" 
      ref={containerRef}
      style={{ width, height }}
    >
      <div className="video-wrapper" style={{ transform: `scale(${zoomLevel / 100})` }}>
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="preview-video"
            muted={true}
            playsInline
          />
        ) : (
          renderGridBackground()
        )}
        
        <canvas 
          ref={canvasRef}
          className="effects-canvas"
        />
      </div>
      
      <div className="preview-controls">
        <div className="left-controls">
          <button 
            className="control-button"
            onClick={handlePlayPause}
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          </button>
        </div>
        
        <div className="right-controls">
          <div className="zoom-controls">
            <button 
              className="zoom-button"
              onClick={handleZoomOut}
              title="缩小"
            >
              <MinusOutlined />
            </button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button 
              className="zoom-button"
              onClick={handleZoomIn}
              title="放大"
            >
              <PlusOutlined />
            </button>
          </div>
          
          <button 
            className="control-button"
            onClick={handleFullscreen}
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview; 