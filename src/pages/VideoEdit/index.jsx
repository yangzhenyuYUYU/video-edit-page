import React, { useState, useRef, useCallback, useEffect } from 'react';
import { message } from 'antd';
import './index.scss';
import TrackEditor from './trackEditor';
import { TRACK_TYPES } from './constants';
import VideoPreview from './VideoPreview';
import MaterialsPanel from './materialsPanel';
import EditPanel from './editPanel';

const VideoEdit = () => {
  // Track-related state
  const [tracks, setTracks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrackItem, setSelectedTrackItem] = useState(null);
  const [timelineHeight, setTimelineHeight] = useState(120);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [contentHeight, setContentHeight] = useState('70%');
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  // 添加区域轨道数据映射
  const [areaTrackMap, setAreaTrackMap] = useState({});
  
  // 音频播放相关状态
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioPlayerRef = useRef(null);
  
  const timelineResizeRef = useRef(null);
  const contentRef = useRef(null);

  // 计算视频总时长
  const calculateTotalDuration = useCallback(() => {
    if (!tracks || tracks.length === 0) return 10;
    
    // 遍历所有轨道，找出最长的时长
    let maxDuration = 0;
    tracks.forEach(track => {
      track.items.forEach(item => {
        const itemEnd = item.start + item.duration;
        if (itemEnd > maxDuration) {
          maxDuration = itemEnd;
        }
      });
    });
    
    // 确保最小时长为10秒，并添加一些额外空间
    return Math.max(maxDuration + 5, 10);
  }, [tracks]);

  // 处理轨道变化
  const handleTrackChange = (newTracks) => {
    // 过滤轨道：只保留有内容的轨道
    const processedTracks = newTracks.filter(track => {
      // 如果是视频轨道且有内容，保留
      if (track.type === TRACK_TYPES.VIDEO && track.items.length > 0) {
        return true;
      }
      // 如果是其他轨道，只有在有内容时才保留
      return track.items && track.items.length > 0;
    });
    
    // 更新当前显示的轨道状态 - 使用深拷贝确保数据独立
    setTracks([...processedTracks]);
    
    // 如果有选中的视频区域，更新区域轨道映射
    if (selectedVideoId) {
      setAreaTrackMap(prevMap => {
        const newMap = { ...prevMap };
        newMap[selectedVideoId] = JSON.parse(JSON.stringify(processedTracks));
        return newMap;
      });
    }
  };

  // 处理时间轴游标位置变化
  const handleCursorChange = (time) => {
    setCurrentTime(time);
  };

  // 处理选中轨道项目
  const handleItemSelect = (item) => {
    if (!item) {
      console.log('No item provided to handleItemSelect');
      setSelectedTrackItem(null);
      return;
    }

    // 处理提示消息
    if (item.action === 'showTip') {
      message.warning(item.message || '请先选择区域片段');
      return;
    }
    
    // If we're selecting a track (not an item within a track)
    if (item.isTrack || (!item.id && item.trackId)) {
      console.log('Track selected:', item);
      setSelectedTrackItem({
        trackId: item.trackId || item.id, // 支持两种格式
        type: item.type,
        isTrack: true
      });
      return;
    }

    // 如果选择了轨道中的元素，更新编辑状态
    if (item.id) {
      // 查找轨道
      const trackIndex = tracks.findIndex(track => track.id === item.trackId);
      if (trackIndex !== -1) {
        // 查找元素
        const trackItem = tracks[trackIndex].items.find(i => i.id === item.id);
        if (trackItem) {
          // 更新编辑状态
          updateElementEditingState(trackItem);
        }
      }
    }
    
    setSelectedTrackItem({
      trackId: item.trackId,
      type: item.type || getItemTypeFromTrackId(item.trackId),
      itemId: item.id,
      isTrack: false
    });
  };

  // 根据轨道ID推断项目类型
  const getItemTypeFromTrackId = (trackId) => {
    if (!trackId) return null;
    
    // 根据轨道ID前缀判断类型
    if (trackId.startsWith('video')) return TRACK_TYPES.VIDEO;
    if (trackId.startsWith('image')) return TRACK_TYPES.IMAGE;
    if (trackId.startsWith('audio')) return TRACK_TYPES.AUDIO;
    if (trackId.startsWith('text')) return TRACK_TYPES.TEXT;
    if (trackId.startsWith('voice')) return TRACK_TYPES.VOICE;
    if (trackId.startsWith('bg')) return TRACK_TYPES.BACKGROUND;
    
    // 如果找不到匹配的前缀，尝试从tracks中查找
    const track = tracks.find(t => t.id === trackId);
    return track ? track.type : null;
  };

  // 处理素材点击
  const handleMaterialClick = (type, content) => {
    // 如果是视频类型，允许直接添加（因为这会创建新的区域片段）
    if (type === 'video') {
      // 获取对应类型
      const trackType = TRACK_TYPES.VIDEO;
      
      // 创建新的素材项
      const newItem = {
        id: `${type}-${Date.now()}`,
        start: 0,
        duration: 10,
        content: typeof content === 'string' ? content : content.name || '未命名内容',
      };
      
      // 根据类型设置src
      if (typeof content === 'object' && content.url) {
        newItem.src = content.url;
        newItem.name = content.name;
        newItem.duration = content.duration || 10;
        newItem.templateId = content.id;
        newItem.cover = content.cover;
      } else {
        newItem.src = 'http://kl-digital.oss-cn-shanghai.aliyuncs.com/synthesis/42/P13525239778T1741857143139RPYUV.mp4';
        newItem.cover = 'https://picsum.photos/300/200?random=' + Date.now();
      }
      // 获取当前视频轨道
      const videoTrack = tracks.find(track => track.type === TRACK_TYPES.VIDEO);

      // 在现有轨道中添加新片段
      if (videoTrack) {
        console.log('在现有视频轨道中添加新视频');
        
        // 更新轨道数据 - 向轨道中添加新视频片段
        const updatedTrack = {
          ...videoTrack,
          items: [newItem] // 替换现有视频
        };
        
        const newTracks = tracks.map(track => 
          track.id === videoTrack.id ? updatedTrack : track
        );
        
        // 更新状态
        setTracks(newTracks);
        handleTrackChange(newTracks);
        
        // 选中新添加的视频
        setSelectedVideoId(newItem.id);
        setSelectedTrackItem({
          trackId: videoTrack.id,
          type: trackType,
          itemId: newItem.id,
          isTrack: false
        });
      } else {
        // 如果没有视频轨道，创建新的
        console.log('创建新的视频轨道并添加视频');
        
        const newVideoTrack = {
          id: `video-track-${Date.now()}`,
          type: trackType,
          name: '视频轨道',
          items: [newItem]
        };
        
        const newTracks = [newVideoTrack, ...tracks.filter(track => track.type !== trackType)];
        
        // 更新状态
        setTracks(newTracks);
        handleTrackChange(newTracks);
        
        // 选中新添加的视频
        setSelectedVideoId(newItem.id);
        setSelectedTrackItem({
          trackId: newVideoTrack.id,
          type: trackType,
          itemId: newItem.id,
          isTrack: false
        });
      }
      
      // 重置播放状态
      setCurrentTime(0);
      setIsPlaying(false);
      
      message.success(`成功添加${type === 'video' ? '视频' : '数字人'}素材`);
      return;
    } else if (type === 'text') {
      // 处理文本类型
      const trackType = TRACK_TYPES.TEXT;
      
      // 创建新的文本项
      const newItem = {
        id: `${type}-${Date.now()}`,
        start: 0,
        duration: 10,
        content: content.content || '气泡文字',
        url: content.url,
        textStyle: content.textStyle || {
          color: "#FFFFFF",
          fontSize: 24,
          fontFamily: "MiSans",
          fontWeight: "normal",
          fontStyle: "normal",
          textAlign: "center",
          letterSpacing: 0,
          lineHeight: 1.5,
          WebkitTextStroke: "none",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
        }
      };

      // 获取或创建文本轨道
      let textTrack = tracks.find(track => track.type === TRACK_TYPES.TEXT);
      if (!textTrack) {
        textTrack = {
          id: `text-${Date.now()}`,
          type: TRACK_TYPES.TEXT,
          items: []
        };
        tracks.push(textTrack);
      }

      // 添加新文本项到轨道
      textTrack.items.push(newItem);

      // 更新状态
      setTracks([...tracks]);
      handleTrackChange(tracks);

      // 选中新添加的文本
      setSelectedTrackItem({
        trackId: textTrack.id,
        type: trackType,
        itemId: newItem.id,
        isTrack: false
      });

      message.success('成功添加气泡文本');
      return;
    }

    // 如果是背景类型，特殊处理
    if (type === 'background') {
      console.log('添加背景素材:', content);
      
      // 获取对应类型
      const trackType = TRACK_TYPES.BACKGROUND;
      
      // 如果轨道是收起状态，展开它
      if (isTimelineCollapsed) {
        setIsTimelineCollapsed(false);
        // 调整时间轴高度
        setTimelineHeight(200);
      }

      // 获取视频轨道和视频时长
      const videoTrack = tracks.find(track => track.type === TRACK_TYPES.VIDEO);
      const videoItem = videoTrack?.items[0];
      const videoDuration = videoItem?.duration || 10;
      
      // 创建新的背景素材项
      const newItem = {
        id: `background-${Date.now()}`,
        start: 0,
        duration: videoDuration, // 使用视频时长
        content: typeof content === 'string' ? content : content.name || '背景',
        isBackground: true, // 标记为背景
        width: content.width || 1080,
        height: content.height || 1920,
        zIndex: -1 // 确保背景在最底层
      };
      
      // 根据类型设置src
      if (typeof content === 'object' && content.url) {
        newItem.src = content.url;
        newItem.cover = content.cover || content.url;
      }
      
      // 检查是否已有背景轨道
      const backgroundTrack = tracks.find(track => track.type === trackType);
      let newTracks = [...tracks];
      
      if (backgroundTrack) {
        // 更新现有背景轨道 - 替换为新的背景（一次只能有一个背景）
        const updatedTrack = {
          ...backgroundTrack,
          items: [newItem] // 替换现有背景
        };
        
        newTracks = tracks.map(track => 
          track.id === backgroundTrack.id ? updatedTrack : track
        );
      } else {
        // 创建新的背景轨道
        const newBackgroundTrack = {
          id: `background-track-${Date.now()}`,
          type: trackType,
          name: '背景轨道',
          items: [newItem],
          isBackground: true
        };
        
        // 将背景轨道添加到最底部
        newTracks.push(newBackgroundTrack);
      }
      
      // 更新状态
      setTracks(newTracks);
      handleTrackChange(newTracks);
      
      // 选中添加的背景
      setSelectedTrackItem({
        trackId: backgroundTrack ? backgroundTrack.id : `background-track-${Date.now()}`,
        type: trackType,
        itemId: newItem.id,
        isTrack: false
      });

      // 触发轨道选中事件
      const trackSelectEvent = new CustomEvent('track-item-select', {
        detail: {
          itemId: newItem.id,
          trackId: backgroundTrack ? backgroundTrack.id : `background-track-${Date.now()}`,
          type: trackType,
          item: newItem
        }
      });
      document.dispatchEvent(trackSelectEvent);
      
      message.success('成功添加背景素材');
      return;
    }

    // 对于其他类型的素材，检查是否已选择区域
    // if (!selectedVideoId) {
    //   message.warning('请先选择一个区域片段');
    //   return;
    // }

    // 如果轨道是收起状态，展开它
    if (isTimelineCollapsed) {
      setIsTimelineCollapsed(false);
      // 调整时间轴高度
      setTimelineHeight(200);
    }

    // 获取对应类型
    const trackType = type === 'image' ? TRACK_TYPES.IMAGE :
                    type === 'audio' ? TRACK_TYPES.AUDIO :
                    type === 'text' ? TRACK_TYPES.TEXT : null;
    
    if (!trackType) {
      message.warning('不支持的素材类型');
      return;
    }

    // 创建新的素材项
    const newItem = {
      id: `${type}-${Date.now()}`,
      start: 0,
      duration: type === 'video' ? 10 : 5, // 视频10秒，其他5秒
      content: typeof content === 'string' ? content : content.name || '未命名内容',
    };
    
    // 根据类型设置src
    if (type === 'text') {
      // 如果是气泡对象，保存气泡的信息
      if (typeof content === 'object' && content.type === 'bubble') {
        newItem.bubbleStyle = {
          imageUrl: content.imageUrl,
          textColor: content.textColor,
          textAlign: content.textAlign,
          paddingVertical: content.paddingVertical,
          paddingHorizontal: content.paddingHorizontal,
          struct: content.struct,
          url: content.url,
          width: content.width,
          height: content.height
        };
        newItem.content = content.struct.textInfo.content;
      }
    } else if (type === 'image') {
      if (typeof content === 'object') {
        newItem.src = content.url || content.cover;
        newItem.cover = content.cover || content.url;
      }
    } else if (type === 'audio') {
      if (typeof content === 'object' && content.url) {
        newItem.src = content.url;
        newItem.duration = content.duration || 5;
        
        // 如果有视频轨道，则使用视频时长
        const videoTrack = tracks.find(track => track.type === TRACK_TYPES.VIDEO);
        if (videoTrack && videoTrack.items.length > 0) {
          const videoItem = videoTrack.items[0];
          newItem.duration = videoItem.duration || 10;
        }
      }
    }

    // 创建新轨道
    const newTrack = {
      id: `${type}-track-${Date.now()}`,
      type: trackType,
      name: type === 'video' ? '视频轨道' : 
            type === 'image' ? '图片轨道' : 
            type === 'audio' ? '音频轨道' : 
            type === 'text' ? '文本轨道' : '未知轨道',
      items: [newItem]
    };

    // 更新轨道列表，保留所有现有轨道
    setTracks(prevTracks => {
      // 保留所有现有轨道，新轨道添加到顶部
      const updatedTracks = [newTrack, ...prevTracks];
      handleTrackChange(updatedTracks);
      
      // 构建新元素对象
      const newElementItem = {
        ...newItem,
        trackId: newTrack.id,
        type: trackType,
        x: 50,
        y: 50,
        width: trackType === TRACK_TYPES.TEXT ? 30 : 20,
        height: 'auto',
        rotation: 0,
        scale: 1,
        opacity: 1,
        isNew: true
      };
      
      // 直接调用 handleItemSelect
      handleItemSelect(newElementItem);
      
      return updatedTracks;
    });
    
    // 选中添加的项目
    setSelectedTrackItem({
      trackId: newTrack.id,
      type: trackType,
      itemId: newItem.id,
      isTrack: false
    });

    // 触发轨道选中事件
    const trackSelectEvent = new CustomEvent('track-item-select', {
      detail: {
        itemId: newItem.id,
        trackId: newTrack.id,
        type: trackType,
        item: newItem
      }
    });
    document.dispatchEvent(trackSelectEvent);

    // 触发预览区域选中事件
    const previewSelectEvent = new CustomEvent('preview-element-select', {
      detail: {
        itemId: newItem.id,
        trackId: newTrack.id,
        type: trackType,
        item: newItem
      }
    });
    document.dispatchEvent(previewSelectEvent);
    
    // 确保更新编辑状态
    updateElementEditingState({
      ...newItem,
      type: trackType
    });
    
    // 延迟一下确保 DOM 已更新
    setTimeout(() => {
      const element = document.getElementById(`element-${newItem.id}`);
      if (element) {
        element.classList.add('selected');
      }
      
      const trackElement = document.querySelector(`[data-track-item-id="${newItem.id}"]`);
      if (trackElement) {
        trackElement.classList.add('selected');
      }
    }, 0);
    
    message.success(`成功添加${type === 'video' ? '视频' : type === 'image' ? '贴图' : type === 'audio' ? '音频' : '文本'}素材`);
  };

  // 更新时间轴拖拽处理逻辑
  const handleTimelineResize = useCallback((e) => {
    if (!isDraggingTimeline || !timelineResizeRef.current || isTimelineCollapsed) return;
    
    const containerHeight = window.innerHeight - 88;
    const minTimelineHeight = 120;
    const maxTimelineHeight = containerHeight * 0.8;
    
    requestAnimationFrame(() => {
      const newTimelineHeight = containerHeight - e.clientY + 88;
      const clampedHeight = Math.min(Math.max(newTimelineHeight, minTimelineHeight), maxTimelineHeight);
      
      setTimelineHeight(clampedHeight);
      const newContentHeight = `${((containerHeight - clampedHeight) / containerHeight) * 100}%`;
      setContentHeight(newContentHeight);
    });
  }, [isDraggingTimeline, isTimelineCollapsed]);

  const handleTimelineResizeStart = useCallback(() => {
    if (isTimelineCollapsed) return;
    setIsDraggingTimeline(true);
    document.body.style.cursor = 'ns-resize';
  }, [isTimelineCollapsed]);

  const handleTimelineResizeEnd = useCallback(() => {
    setIsDraggingTimeline(false);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isDraggingTimeline) {
      window.addEventListener('mousemove', handleTimelineResize);
      window.addEventListener('mouseup', handleTimelineResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleTimelineResize);
      window.removeEventListener('mouseup', handleTimelineResizeEnd);
    };
  }, [isDraggingTimeline, handleTimelineResize, handleTimelineResizeEnd]);

  // 处理轨道收起展开
  const handleToggleTracks = () => {
    const newCollapsed = !isTimelineCollapsed;
    
    // 如果是从收起状态展开
    if (newCollapsed === false) {
      console.log('展开轨道区域, 当前选中视频ID:', selectedVideoId);

      if (tracks.length === 0) {
        message.warning('请先添加素材再展开轨道');
        return;
      }
      
      // 如果有选中的视频ID且在areaTrackMap中有对应的轨道数据
      if (selectedVideoId && areaTrackMap[selectedVideoId]) {
        console.log(`加载区域 ${selectedVideoId} 的轨道数据`);
        // 加载该区域的轨道数据
        setTracks(JSON.parse(JSON.stringify(areaTrackMap[selectedVideoId])));
      } else {
        
        // 检查是否已有视频轨道
        const hasVideoTrack = tracks.some(track => 
          track.type === TRACK_TYPES.VIDEO
        );
        
        // 如果没有视频轨道，添加一个空的视频轨道
        if (!hasVideoTrack) {
          const emptyVideoTrack = {
            id: `video-track-${Date.now()}`,
            type: TRACK_TYPES.VIDEO,
            name: '视频轨道',
            items: []
          };
          setTracks(prev => [emptyVideoTrack, ...prev]);
        }
      }
    } else {
      // 如果是收起轨道区域，先保存当前轨道数据
      if (selectedVideoId) {
        console.log(`收起轨道时保存区域 ${selectedVideoId} 的轨道数据`);
        setAreaTrackMap(prevMap => ({
          ...prevMap,
          [selectedVideoId]: JSON.parse(JSON.stringify(tracks)) // 深拷贝确保数据独立
        }));
      }
    }
    
    // 更新折叠状态
    setIsTimelineCollapsed(newCollapsed);
    // 调整时间轴高度
    setTimelineHeight(newCollapsed ? 120 : 200);
  };

  // 处理视频ID变更
  const handleSelectedVideoIdChange = (videoId) => {
    console.log('Selected video ID changed to:', videoId);
    
    // 先保存当前选中区域的轨道数据（如果有）
    if (selectedVideoId) {
      console.log(`保存当前区域 ${selectedVideoId} 的轨道数据`);
      setAreaTrackMap(prevMap => ({
        ...prevMap,
        [selectedVideoId]: JSON.parse(JSON.stringify(tracks)) // 深拷贝确保数据独立
      }));
    }
    
    // 更新选中的视频ID
    setSelectedVideoId(videoId);
    
    // 如果是取消选择（videoId 为 null）
    if (!videoId) {
      console.log('取消选择区域片段');
      return;
    }
    
    // 从 areaTrackMap 中加载该区域的轨道数据（如果有）
    const areaTracksData = areaTrackMap[videoId];
    if (areaTracksData && areaTracksData.length > 0) {
      console.log(`加载区域 ${videoId} 的轨道数据:`, areaTracksData);
      // 使用该区域的轨道数据更新当前显示的轨道
      setTracks(JSON.parse(JSON.stringify(areaTracksData))); // 深拷贝确保数据独立
      return; // 已加载区域数据，不需要继续执行
    }
    
    // 如果该区域没有轨道数据，检查是否需要初始化
    // 查找当前轨道中是否已存在该视频项
    let existingVideoTrack = tracks.find(track => 
      track.type === TRACK_TYPES.VIDEO && 
      track.items.some(item => item.id === videoId)
    );
    
    // 如果该视频已经在轨道中，不需要做任何改变
    if (existingVideoTrack) {
      console.log('视频已在轨道中，无需添加');
      return;
    }
    
    // 如果视频不在当前轨道中，创建新的轨道集合
    // 查找视频项（可能是从其他区域的轨道中查找）
    let videoItem = null;
    Object.keys(areaTrackMap).forEach(areaId => {
      const areaTracks = areaTrackMap[areaId];
      if (areaTracks) {
        for (const track of areaTracks) {
          if (track.type === TRACK_TYPES.VIDEO) {
            const item = track.items.find(item => item.id === videoId);
            if (item) {
              videoItem = item;
              break;
            }
          }
        }
      }
    });
    
    if (videoItem) {
      // 为该区域创建一个全新的轨道集合，仅包含选中的视频
      const newVideoTrack = {
        id: `video-track-${Date.now()}`,
        type: TRACK_TYPES.VIDEO,
        name: '视频轨道',
        items: [{ ...videoItem }] // 添加找到的视频项
      };
      
      // 使用全新轨道数据替换当前轨道
      const newTracks = [newVideoTrack];
      setTracks(newTracks);
      
      // 同时更新区域轨道映射
      setAreaTrackMap(prevMap => ({
        ...prevMap,
        [videoId]: newTracks
      }));
    }
  };

  // 处理删除轨道项目
  const handleDeleteItem = (trackId, itemId) => {
    console.log('Deleting item:', { trackId, itemId });
    
    if (!trackId || !itemId) {
      console.error('Missing trackId or itemId for delete operation');
      return;
    }
    
    // 查找要删除的项目所在的轨道
    const targetTrack = tracks.find(track => track.id === trackId);
    if (!targetTrack) {
      console.error('Target track not found:', trackId);
      return;
    }
    
    // 查找项目在轨道中的索引
    const itemIndex = targetTrack.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.error('Item not found in track:', itemId);
      return;
    }
    
    // 确认这是否是该轨道的最后一个项目，且是视频轨道
    const isLastVideoItem = targetTrack.type === TRACK_TYPES.VIDEO && 
                          targetTrack.items.length === 1;
    
    // 如果是最后一个视频项目，不允许删除（至少保留一个视频轨道）
    if (isLastVideoItem) {
      message.warning('无法删除最后一个视频项目，至少需要保留一个视频');
      return;
    }
    
    // 创建更新后的轨道数据
    let updatedTracks = tracks.map(track => {
      if (track.id === trackId) {
        // 从轨道中删除该项目
        return {
          ...track,
          items: track.items.filter(item => item.id !== itemId)
        };
      }
      return track;
    });

    // 过滤掉空轨道（除了视频轨道）
    updatedTracks = updatedTracks.filter(track => {
      // 如果是视频轨道且有内容，保留
      if (track.type === TRACK_TYPES.VIDEO && track.items.length > 0) {
        return true;
      }
      // 如果是其他轨道，只有在有内容时才保留
      return track.items.length > 0;
    });
    
    // 如果是视频项目，还需要从areaTrackMap中也同步删除
    if (targetTrack.type === TRACK_TYPES.VIDEO) {
      // 如果当前选中的就是要删除的视频项目，取消选择
      if (itemId === selectedVideoId) {
        setSelectedVideoId(null);
        setSelectedTrackItem(null);
      }
      
      // 更新所有区域的轨道数据，将该视频项从所有区域中删除
      setAreaTrackMap(prevMap => {
        const newMap = { ...prevMap };
        
        // 检查所有区域，并从中删除该视频项
        Object.keys(newMap).forEach(areaId => {
          if (newMap[areaId]) {
            // 先删除项目
            let updatedAreaTracks = newMap[areaId].map(track => {
              if (track.type === TRACK_TYPES.VIDEO) {
                return {
                  ...track,
                  items: track.items.filter(item => item.id !== itemId)
                };
              }
              return track;
            });

            // 过滤掉空轨道（除了视频轨道）
            updatedAreaTracks = updatedAreaTracks.filter(track => {
              // 如果是视频轨道且有内容，保留
              if (track.type === TRACK_TYPES.VIDEO && track.items.length > 0) {
                return true;
              }
              // 如果是其他轨道，只有在有内容时才保留
              return track.items.length > 0;
            });
            
            // 如果删除的是该区域本身，则从映射中删除整个区域
            if (areaId === itemId) {
              delete newMap[areaId];
            } else {
              newMap[areaId] = updatedAreaTracks;
            }
          }
        });
        
        return newMap;
      });
    } else if (selectedVideoId) {
      // 如果不是视频项目，但有选中的视频区域，则只更新当前区域的轨道数据
      setAreaTrackMap(prevMap => {
        const currentAreaTracks = prevMap[selectedVideoId];
        if (!currentAreaTracks) return prevMap;
        
        // 先删除项目
        let updatedAreaTracks = currentAreaTracks.map(track => {
          if (track.id === trackId) {
            return {
              ...track,
              items: track.items.filter(item => item.id !== itemId)
            };
          }
          return track;
        });

        // 过滤掉空轨道（除了视频轨道）
        updatedAreaTracks = updatedAreaTracks.filter(track => {
          // 如果是视频轨道且有内容，保留
          if (track.type === TRACK_TYPES.VIDEO && track.items.length > 0) {
            return true;
          }
          // 如果是其他轨道，只有在有内容时才保留
          return track.items.length > 0;
        });
        
        return {
          ...prevMap,
          [selectedVideoId]: updatedAreaTracks
        };
      });
    }
    
    // 更新轨道数据
    setTracks(updatedTracks);
    
    // 如果删除的是当前选中的项目，取消选中状态
    if (selectedTrackItem?.itemId === itemId) {
      setSelectedTrackItem(null);
    }
    
    message.success('已删除素材');
  };

  // 播放/暂停音频
  const handleAudioPlay = (audioItem, e) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击事件
    
    if (playingAudioId === audioItem.id) {
      // 如果当前已经在播放，则暂停
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      // 如果播放不同的音频，需要先停止当前播放的
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      
      // 创建新的音频对象并播放
      audioPlayerRef.current = new Audio(audioItem.url);
      audioPlayerRef.current.play();
      setPlayingAudioId(audioItem.id);
      
      // 监听音频播放结束事件
      audioPlayerRef.current.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  // Get the active video source for the VideoPreview component
  const getActiveVideoSrc = () => {
    // Find the first video track
    const videoTracks = tracks.filter(track => track.type === 'video');
    if (videoTracks.length === 0) return null;
    
    // Find active video item at current time
    const activeVideoItems = videoTracks.flatMap(track => track.items)
      .filter(item => item.start <= currentTime && (item.start + item.duration) > currentTime)
      .sort((a, b) => b.start - a.start); // Sort by most recently started
    
    if (activeVideoItems.length === 0) return null;
    
    return activeVideoItems[0].src;
  };

  // Handle seeking in the timeline
  const handleSeek = (time) => {
    setCurrentTime(time);
  };

  // 在 VideoEdit 组件内添加新的状态
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [videoVolume, setVideoVolume] = useState(100);
  const [bgmVolume, setBgmVolume] = useState(80);
  const [elementOpacity, setElementOpacity] = useState(100);
  const [elementRotation, setElementRotation] = useState(0);
  const [elementTextContent, setElementTextContent] = useState('');
  const [elementTextColor, setElementTextColor] = useState('#000000');
  const [elementTextSize, setElementTextSize] = useState(16);

  // 更新元素编辑状态
  const updateElementEditingState = (item) => {
    if (!item) return;
    
    // 设置透明度
    setElementOpacity(item.opacity ? item.opacity * 100 : 100);
    
    // 设置旋转角度
    setElementRotation(item.rotation || 0);
    
    // 文本内容相关
    if (item.type === TRACK_TYPES.TEXT) {
      setElementTextContent(item.content || '');
      setElementTextColor(item.textColor || item.textStyle?.color || '#FFFFFF');
      setElementTextSize(parseInt(item.textSize || item.textStyle?.fontSize || 24));
    }
  };

  // 处理元素属性变更
  const handleElementPropertyChange = (property, value) => {
    if (!selectedTrackItem || !selectedTrackItem.itemId) return;
    
    // 查找所选元素
    const trackIndex = tracks.findIndex(track => track.id === selectedTrackItem.trackId);
    if (trackIndex === -1) return;
    
    const itemIndex = tracks[trackIndex].items.findIndex(item => item.id === selectedTrackItem.itemId);
    if (itemIndex === -1) return;
    
    // 创建新的轨道数据
    const newTracks = [...tracks];
    const updatedItem = { ...newTracks[trackIndex].items[itemIndex] };
    
    // 确保textStyle对象存在
    if (!updatedItem.textStyle) {
      updatedItem.textStyle = {};
    }
    
    // 根据属性类型更新元素
    switch (property) {
      case 'opacity':
        // 直接使用传入的 opacity 值，因为在 EditPanel 中已经做了转换
        updatedItem.opacity = value;
        break;
      case 'rotation':
        updatedItem.rotation = value;
        break;
      case 'content':
        updatedItem.content = value;
        break;
      case 'textStyle':
        // 直接更新整个textStyle对象
        updatedItem.textStyle = {
          ...updatedItem.textStyle,
          ...value
        };
        break;
      default:
        return; // 不更新未知属性
    }
    
    // 更新轨道中的元素
    newTracks[trackIndex].items[itemIndex] = updatedItem;
    
    // 更新轨道数据
    handleTrackChange(newTracks);
  };
  
  // 处理预览区域元素变更
  const handlePreviewItemChange = (updatedItem) => {
    if (!updatedItem || !updatedItem.id || !updatedItem.trackId) return;
    
    // 查找所选元素
    const trackIndex = tracks.findIndex(track => track.id === updatedItem.trackId);
    if (trackIndex === -1) return;
    
    const itemIndex = tracks[trackIndex].items.findIndex(item => item.id === updatedItem.id);
    if (itemIndex === -1) return;
    
    // 创建新的轨道数据
    const newTracks = [...tracks];
    
    // 保留现有属性，只更新拖拽、缩放、旋转相关属性
    newTracks[trackIndex].items[itemIndex] = {
      ...newTracks[trackIndex].items[itemIndex],
      x: updatedItem.x,
      y: updatedItem.y,
      width: updatedItem.width,
      height: updatedItem.height,
      rotation: updatedItem.rotation,
      scale: updatedItem.scale,
      opacity: updatedItem.opacity
    };
    
    // 更新轨道数据
    handleTrackChange(newTracks);
    
    // 更新编辑状态
    updateElementEditingState(updatedItem);
  };

  // 添加回被误删的函数
  const handleBack = () => {
    window.history.back();
  };

  // 处理导出对话框
  const handleExportClick = () => {
    if (!tracks || tracks.length === 0) {
      message.warning('请先添加素材再导出视频');
      return;
    }
    // 打印tracks
    console.log('tracks:', tracks);
  };

  // 监听视频时长变化，同步更新背景时长
  useEffect(() => {
    // 获取视频轨道和视频时长
    const videoTrack = tracks.find(track => track.type === TRACK_TYPES.VIDEO);
    const videoItem = videoTrack?.items[0];
    const videoDuration = videoItem?.duration || 10;

    // 获取背景轨道和音频轨道
    const backgroundTrack = tracks.find(track => track.type === TRACK_TYPES.BACKGROUND);
    const audioTrack = tracks.find(track => track.type === TRACK_TYPES.AUDIO);
    
    // 标记是否需要更新轨道
    let needsUpdate = false;
    
    // 创建新的轨道数据
    const newTracks = tracks.map(track => {
      // 更新背景轨道
      if (track.type === TRACK_TYPES.BACKGROUND && track.items.length > 0) {
        const backgroundItem = track.items[0];
        if (backgroundItem.duration !== videoDuration) {
          needsUpdate = true;
          return {
            ...track,
            items: track.items.map(item => ({
              ...item,
              duration: videoDuration
            }))
          };
        }
      }
      
      // 更新音频轨道
      if (track.type === TRACK_TYPES.AUDIO && track.items.length > 0) {
        const audioItem = track.items[0];
        if (audioItem.duration !== videoDuration) {
          needsUpdate = true;
          return {
            ...track,
            items: track.items.map(item => ({
              ...item,
              duration: videoDuration
            }))
          };
        }
      }
      
      return track;
    });
    
    // 如果有轨道需要更新，应用更新
    if (needsUpdate) {
      setTracks(newTracks);
      handleTrackChange(newTracks);
    }
  }, [tracks]);

  return (
    <div className="video-edit-page">
      <div className="video-edit-container">
        {/* 使用MaterialsPanel组件替换原来的侧边栏 */}
        <MaterialsPanel 
          onMaterialClick={handleMaterialClick}
          onBack={handleBack}
          playingAudioId={playingAudioId}
          onAudioPlay={handleAudioPlay}
        />

        {/* Main Content */}
        <div className="main-content">
          {/* 上部分：预览和编辑区域 */}
          <div 
            className="content-wrapper"
            ref={contentRef}
            style={{ height: contentHeight }}
          >
            {/* 左侧预览区域 */}
            <div className="preview-section">
              <div className="preview-header">
                <h3>视频预览</h3>
              </div>
              <div className="preview-container">
                <VideoPreview 
                  videoSrc={getActiveVideoSrc()}
                  tracks={tracks}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onPlay={() => {
                    console.log('Play requested');
                    setIsPlaying(true);
                  }}
                  onPause={() => {
                    console.log('Pause requested');
                    setIsPlaying(false);
                  }}
                  onSeek={(time) => {
                    console.log('Seek to:', time);
                    handleSeek(time);
                  }}
                  onItemSelect={handleItemSelect}
                  onItemChange={handlePreviewItemChange}
                />
              </div>
            </div>

            {/* 右侧编辑区域 */}
            <EditPanel
              selectedTrackItem={selectedTrackItem}
              showSubtitle={showSubtitle}
              setShowSubtitle={setShowSubtitle}
              videoVolume={videoVolume}
              setVideoVolume={setVideoVolume}
              bgmVolume={bgmVolume}
              setBgmVolume={setBgmVolume}
              elementOpacity={elementOpacity}
              setElementOpacity={setElementOpacity}
              elementRotation={elementRotation}
              setElementRotation={setElementRotation}
              elementTextContent={elementTextContent}
              setElementTextContent={setElementTextContent}
              elementTextColor={elementTextColor}
              setElementTextColor={setElementTextColor}
              elementTextSize={elementTextSize}
              setElementTextSize={setElementTextSize}
              handleElementPropertyChange={handleElementPropertyChange}
              trackTypes={TRACK_TYPES}
              onExportClick={handleExportClick}
            />
          </div>

          {/* 下部分：时间轴区域 */}
          <div 
            className={`timeline-section ${isTimelineCollapsed ? 'collapsed' : ''}`}
            style={{ 
              height: timelineHeight,
              backgroundColor: '#f0f2f5' // 添加较深的背景色
            }}
          >
            <TrackEditor 
              initialTracks={tracks} 
              onTrackChange={handleTrackChange}
              onCursorChange={handleCursorChange}
              onItemSelect={handleItemSelect}
              videoDuration={calculateTotalDuration()}
              isCollapsed={isTimelineCollapsed}
              onCollapsedChange={handleToggleTracks}
              selectedVideoId={selectedVideoId}
              onSelectedVideoIdChange={handleSelectedVideoIdChange}
              onDeleteItem={handleDeleteItem}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default VideoEdit;