import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  AppstoreFilled,
  UserOutlined,
  CustomerServiceFilled,
  PictureFilled,
  FontSizeOutlined,
  BoxPlotFilled,
  FolderFilled,
  RightOutlined,
  LeftOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { Button, message, Switch, Slider, Input } from 'antd';
import './index.scss';
import logo from '../../assets/images/logo.png';
import TrackEditor from './trackEditor';
import ExportDialog from './components/ExportDialog';
import { TRACK_TYPES } from './constants';
import { avatars, avatarsByCategory } from './data/avatars';
import { templates, templatesByCategory } from './data/templates';
import { music, musicByCategory, formatDuration } from './data/music';
import { backgrounds, backgroundsByCategory } from './data/backgrounds';
import { bubblesByCategory } from './data/bubbles';
import VideoPreview from './components/VideoPreview';
import { elements, elementsByCategory } from './data/elements';

// Initial tracks configuration
const INITIAL_TRACKS = [
  {
    id: 'video-1',
    type: TRACK_TYPES.VIDEO,
    name: '数字人视频',
    items: [],
    locked: false,
    visible: true
  },
  {
    id: 'image-1',
    type: TRACK_TYPES.IMAGE,
    name: '图片轨道',
    items: [],
    locked: false,
    visible: true
  },
  {
    id: 'audio-1',
    type: TRACK_TYPES.AUDIO,
    name: '音频轨道',
    items: [],
    locked: false,
    visible: true
  },
  {
    id: 'text-1',
    type: TRACK_TYPES.TEXT,
    name: '文本轨道',
    items: [],
    locked: false,
    visible: true
  }
];

// 示例模板数据
const SAMPLE_TEMPLATES = [
  {
    id: 'template-1',
    title: '商务数字人介绍',
    cover: 'https://picsum.photos/300/200?random=2',
    duration: '00:30',
    type: 'video',
    src: 'http://kl-digital.oss-cn-shanghai.aliyuncs.com/synthesis/42/P13525239778T1741857143139RPYUV.mp4'
  },
  {
    id: 'template-2',
    title: '产品功能展示',
    cover: 'https://picsum.photos/300/200?random=2',
    duration: '00:45',
    type: 'video',
    src: 'http://kl-digital.oss-cn-shanghai.aliyuncs.com/synthesis/42/P13525239778T1741857143139RPYUV.mp4'
  },
  {
    id: 'template-3',
    title: '企业宣传视频',
    cover: 'https://picsum.photos/300/200?random=2',
    duration: '01:00',
    type: 'video',
    src: 'http://kl-digital.oss-cn-shanghai.aliyuncs.com/synthesis/42/P13525239778T1741857143139RPYUV.mp4'
  }
];

const VideoEdit = () => {
  const [activeNav, setActiveNav] = useState('template');
  const [activeMyMaterialTab, setActiveMyMaterialTab] = useState('template');
  const [selectedTemplate] = useState(null);
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  
  // Track-related state
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
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
  
  // 导出对话框状态
  const [exportDialogVisible, setExportDialogVisible] = useState(false);

  // 计算视频总时长
  const calculateTotalDuration = useCallback(() => {
    const videoTrack = tracks.find(track => track.type === 'video');
    if (!videoTrack || !videoTrack.items.length) return 0;
    
    return videoTrack.items.reduce((maxEnd, item) => {
      const itemEnd = item.start + item.duration;
      return Math.max(maxEnd, itemEnd);
    }, 0);
  }, [tracks]);

  // 处理轨道变化
  const handleTrackChange = (newTracks) => {
    console.log('handleTrackChange called with:', newTracks);
    
    // 过滤掉空轨道（没有项目的轨道），但始终保留视频轨道
    const processedTracks = newTracks.filter(track => 
      // 保留视频轨道或有内容的轨道
      track.type === TRACK_TYPES.VIDEO || track.items.length > 0
    );
    
    // 确保至少保留一个视频轨道，即使它是空的
    const hasVideoTrack = processedTracks.some(track => track.type === TRACK_TYPES.VIDEO);
    if (!hasVideoTrack) {
      const emptyVideoTrack = {
        id: `video-track-${Date.now()}`,
        type: TRACK_TYPES.VIDEO,
        name: '视频轨道',
        items: []
      };
      processedTracks.unshift(emptyVideoTrack);
    }
    
    console.log('Processed tracks for update:', processedTracks);
    
    // 更新当前显示的轨道状态 - 使用深拷贝确保数据独立
    setTracks([...processedTracks]);
    
    // 如果有选中的视频区域，更新区域轨道映射
    if (selectedVideoId) {
      console.log(`Updating tracks for video area: ${selectedVideoId}`);
      
      // 保持当前选中区域的轨道数据与当前显示的轨道数据同步 - 使用深拷贝确保数据独立
      setAreaTrackMap(prevMap => {
        // 创建新的映射对象，而不是修改原对象
        const newMap = { ...prevMap };
        // 为当前选中的区域设置深拷贝的轨道数据
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
    console.log('handleItemSelect called with:', item);
    
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

    // Otherwise we're selecting an item
    console.log('Item selected:', item);
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
    console.log('handleMaterialClick called with:', { type, content });

    // 获取对应类型
    const trackType = type === 'video' ? TRACK_TYPES.VIDEO :
                    type === 'image' ? TRACK_TYPES.IMAGE :
                    type === 'audio' ? TRACK_TYPES.BACKGROUND :
                    type === 'text' ? TRACK_TYPES.TEXT :
                    type === 'person' ? TRACK_TYPES.VIDEO : null;
    
    if (!trackType) {
      message.warning('不支持的素材类型');
      return;
    }

    // 如果轨道是收起状态，展开它
    if (isTimelineCollapsed) {
      setIsTimelineCollapsed(false);
      // 调整时间轴高度
      setTimelineHeight(200);
    }

    // 创建新的素材项
    const newItem = {
      id: `${type}-${Date.now()}`,
      start: 0,
      duration: type === 'video' || type === 'person' ? 10 : 5, // 视频和数字人10秒，其他5秒
      content: typeof content === 'string' ? content : content.name || '未命名内容',
    };
    
    // 根据类型设置src
    if (type === 'video') {
      // 如果content是完整的模板对象
      if (typeof content === 'object' && content.preview_video) {
        newItem.src = content.preview_video;
        newItem.name = content.name;
        newItem.duration = content.duration || 10;
        newItem.templateId = content.id;
        newItem.cover = content.cover; // 保存封面图
      } else {
        // 默认视频
        newItem.src = 'http://kl-digital.oss-cn-shanghai.aliyuncs.com/synthesis/42/P13525239778T1741857143139RPYUV.mp4';
        newItem.cover = 'https://picsum.photos/300/200?random=' + Date.now(); // 添加默认封面图
      }
    } else if (type === 'text') {
      // 如果是气泡对象，保存气泡的信息
      if (typeof content === 'object' && content.type === 'bubble') {
        newItem.bubbleStyle = {
          imageUrl: content.imageUrl,
          textColor: content.textColor,
          textAlign: content.textAlign,
          paddingVertical: content.paddingVertical,
          paddingHorizontal: content.paddingHorizontal,
          struct: content.struct,
          preview_url: content.preview_url,
          width: content.width,
          height: content.height
        };
        newItem.content = content.name;
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
      }
    } else if (type === 'person') {
      if (typeof content === 'object') {
        newItem.src = content.src || content.preview_video || 'https://res.chanjing.cc/chanjing/dp/output/2024-12-03/1733251200000-avatar1.png';
        newItem.avatarId = content.id;
        newItem.avatarName = content.name;
        newItem.isHuman = true;
        newItem.cover = content.cover || content.src; // 保存封面图
      }
    }

    // 创建新轨道
    const newTrack = {
      id: `${type}-track-${Date.now()}`,
      type: trackType,
      name: type === 'video' ? '视频轨道' : 
            type === 'image' ? '图片轨道' : 
            type === 'audio' ? '背景音乐' :
            type === 'person' ? '数字人轨道' : '未知轨道',
      items: [newItem]
    };

    // 更新轨道列表，保留所有现有轨道
    setTracks(prevTracks => {
      // 保留所有现有轨道，新轨道添加到顶部
      const updatedTracks = [newTrack, ...prevTracks];
      return updatedTracks;
    });
    
    // 选中添加的项目
    setSelectedTrackItem({
      trackId: newTrack.id,
      type: trackType,
      itemId: newItem.id,
      isTrack: false
    });
    
    message.success(`成功添加${type === 'video' ? '视频' : type === 'image' ? '背景图片' : type === 'person' ? '数字人' : type === 'audio' ? '音频' : '文本'}素材`);
  };

  // 添加 useEffect 来监控 selectedTrackItem 的变化
  useEffect(() => {
    console.log('selectedTrackItem changed:', selectedTrackItem);
  }, [selectedTrackItem]);

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

  // 根据不同素材类型定义分类
  const materialCategories = {
    template: [
      { key: 'knowledge', label: '知识口播' },
      { key: 'emotion', label: '情感口播' },
      { key: 'trending', label: '节目热点' },
      { key: 'law', label: '法律科普' },
      { key: 'health', label: '养生保健' },
      { key: 'sales', label: '实货营销' },
      { key: 'education', label: '教育培训' },
      { key: 'ad', label: '广告宣传' },
      { key: 'news', label: '新闻资讯' },
      { key: 'material', label: '素材配音' },
      { key: 'digital', label: '数字人推广' }
    ],
    avatar: [
      { key: 'business', label: '商务精英' },
      { key: 'intellectual', label: '知性' },
      { key: 'traditional', label: '国风' },
      { key: 'casual', label: '休闲' },
      { key: 'male', label: '男性形象' },
      { key: 'female', label: '女性形象' }
    ],
    audio: [
      { key: 'popular', label: '热门音乐' },
      { key: 'sales', label: '带货音乐' },
      { key: 'emotion', label: '情感音乐' },
      { key: 'classical', label: '古典清幽' },
      { key: 'festive', label: '节日喜庆' }
    ],
    background: [
      { key: '中式', label: '中式' },
      { key: '户外', label: '户外' },
      { key: '生活', label: '生活' },
      { key: '抽象', label: '抽象' },
      { key: '科技', label: '科技' }
    ],
    text: [
      { key: 'title', label: '标题模板' },
      { key: 'subtitle', label: '字幕模板' },
      { key: 'caption', label: '说明文字' },
      { key: 'end', label: '片尾字幕' }
    ],
    element: [
      { key: 'shape', label: '形状' },
      { key: 'plant', label: '植物' },
      { key: 'border', label: '边框' },
      { key: 'furniture', label: '桌椅' },
      { key: 'butterflyLogo', label: '蝴蝶logo' },
      { key: 'mask', label: '遮挡' },
      { key: 'festival', label: '节日' },
      { key: 'guide', label: '指引' },
      { key: 'social', label: '点赞关注' }
    ]
  };

  const [activeCategory, setActiveCategory] = useState(materialCategories[activeNav]?.[0]?.key || '');

  const navItems = [
    { key: 'template', label: '模板', icon: <AppstoreFilled /> },
    { key: 'avatar', label: '人像', icon: <UserOutlined /> },
    { key: 'audio', label: '音频', icon: <CustomerServiceFilled /> },
    { key: 'background', label: '背景', icon: <PictureFilled /> },
    { key: 'text', label: '文本', icon: <FontSizeOutlined /> },
    { key: 'element', label: '元素', icon: <BoxPlotFilled /> },
    { key: 'material', label: '我的素材', icon: <FolderFilled /> }
  ];

  const handleBack = () => {
    window.history.back();
  };
  
  // 处理导出对话框
  const handleExportClick = () => {
    if (!tracks || tracks.length === 0) {
      message.warning('请先添加素材再导出视频');
      return;
    }
    setExportDialogVisible(true);
  };
  
  const handleExportClose = () => {
    setExportDialogVisible(false);
  };
  
  const handleExportSubmit = (exportData) => {
    console.log('导出视频:', exportData);
    message.success('视频正在导出中，完成后将通知您');
    // TODO: 调用实际的导出 API
  };

  // 处理轨道收起展开
  const handleToggleTracks = () => {
    const newCollapsed = !isTimelineCollapsed;
    
    // 如果是从收起状态展开
    if (newCollapsed === false) {
      console.log('展开轨道区域, 当前选中视频ID:', selectedVideoId);
      
      // 如果有选中的视频ID且在areaTrackMap中有对应的轨道数据
      if (selectedVideoId && areaTrackMap[selectedVideoId]) {
        console.log(`加载区域 ${selectedVideoId} 的轨道数据`);
        // 加载该区域的轨道数据
        setTracks(JSON.parse(JSON.stringify(areaTrackMap[selectedVideoId])));
      } else {
        // 如果没有选中的视频ID，但存在视频轨道数据，不需要显示警告
        const hasVideoTrackItems = tracks.some(track => 
          track.type === TRACK_TYPES.VIDEO && track.items.length > 0
        );
        
        // 只有当没有选中的视频ID且没有视频轨道项目时，才显示警告
        if (!selectedVideoId && !hasVideoTrackItems) {
          message.warning('请先选择一个区域片段');
        }
        
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
    const updatedTracks = tracks.map(track => {
      if (track.id === trackId) {
        // 从轨道中删除该项目
        return {
          ...track,
          items: track.items.filter(item => item.id !== itemId)
        };
      }
      return track;
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
            const updatedAreaTracks = newMap[areaId].map(track => {
              if (track.type === TRACK_TYPES.VIDEO) {
                return {
                  ...track,
                  items: track.items.filter(item => item.id !== itemId)
                };
              }
              return track;
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
        
        // 在该区域的轨道数据中也删除这个项目
        const updatedAreaTracks = currentAreaTracks.map(track => {
          if (track.id === trackId) {
            return {
              ...track,
              items: track.items.filter(item => item.id !== itemId)
            };
          }
          return track;
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
    
    message.success('项目已删除');
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
    const videoTracks = tracks.filter(track => track.type === 'video' || track.type === 'person');
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
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [videoVolume, setVideoVolume] = useState(100);
  const [bgmVolume, setBgmVolume] = useState(80);

  return (
    <div className="video-edit-page">
      <div className="video-edit-container">
        {/* Fixed Navigation */}
        <div className="fixed-navigation" data-active={activeNav}>
          <div className="logo-section">
            <div className="logo">
              <img src={logo} alt="Logo" />
            </div>
            <div className="brand-wrapper" onClick={handleBack}>
              <div className="back-button">
                <LeftOutlined />
              </div>
              <span className="brand-text">剪辑</span>
            </div>
          </div>
          <div className="nav-items">
            {navItems.map(item => (
              <div
                key={item.key}
                className={`nav-item ${activeNav === item.key ? 'active' : ''}`}
                onClick={() => setActiveNav(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Categories Header */}
          <div className="categories-header">
            <div className="category-section">
              <div className="section-header">
                <span className="title">{`选择${navItems.find(item => item.key === activeNav)?.label || ''}素材`}</span>
              </div>
              <div className="category-list">
                {materialCategories[activeNav]?.map(cat => (
                  <div 
                    key={cat.key}
                    className={`category-item ${activeCategory === cat.key ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    {cat.label}
                  </div>
                )) || (
                  <div className="empty-tip">暂无分类</div>
                )}
              </div>
            </div>
          </div>

          {/* Material Grid */}
          <div className="template-grid">
            {/* 模板素材 */}
            {activeNav === 'template' && (() => {
              // 获取基于当前分类的模板数据
              let displayTemplates = templates;
              
              if (activeCategory && templatesByCategory[activeCategory]) {
                displayTemplates = templatesByCategory[activeCategory];
              }
              
              return displayTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="material-card template"
                  onClick={() => handleMaterialClick('video', template)}
                >
                  <div className="material-card-content">
                    <img 
                      src={template.cover} 
                      alt={template.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="template-info" style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                    }}>
                      <div className="template-title" style={{
                        color: '#fff',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '4px'
                      }}>{template.name}</div>
                      <div className="template-category" style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '10px',
                      }}>{template.categories.length > 0 ? template.categories[0].name : '未分类'}</div>
                    </div>
                  </div>
                </div>
              ));
            })()}

            {/* 人像素材 */}
            {activeNav === 'avatar' && (() => {
              // 获取基于当前分类的人像数据
              let displayAvatars = avatars;
              
              if (activeCategory && avatarsByCategory[activeCategory]) {
                displayAvatars = avatarsByCategory[activeCategory];
              }
              
              return displayAvatars.map((avatar) => (
                <div 
                  key={avatar.id} 
                  className="material-card avatar"
                  onClick={() => handleMaterialClick('person', avatar)}
                >
                  <div className="material-card-content">
                    <img 
                      src={avatar.cover} 
                      alt={avatar.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="avatar-info" style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                    }}>
                      <div className="avatar-name" style={{
                        color: '#fff',
                        fontSize: '12px',
                        textAlign: 'center',
                      }}>{avatar.name}</div>
                      <div className="avatar-type" style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '10px',
                        textAlign: 'center',
                      }}>{avatar.style} · {avatar.pose}</div>
                    </div>
                  </div>
                </div>
              ));
            })()}

            {/* 音频素材 */}
            {activeNav === 'audio' && (() => {
              // 获取基于当前分类的音乐数据
              let displayMusic = music;
              
              if (activeCategory && musicByCategory[activeCategory]) {
                displayMusic = musicByCategory[activeCategory];
              }
              
              return (
                <>
                  {displayMusic.map((audioItem) => (
                    <div 
                      key={audioItem.id} 
                      className="material-card audio"
                      onClick={() => handleMaterialClick('audio', audioItem)}
                    >
                      <div className="material-card-content">
                        <div className="icon">
                          <CustomerServiceFilled />
                        </div>
                        <div className="audio-info">
                          <div className="name">{audioItem.name}</div>
                          <div className="duration">{formatDuration(audioItem.duration)}</div>
                        </div>
                        <div 
                          className="play-button"
                          onClick={(e) => handleAudioPlay(audioItem, e)}
                          style={{ 
                            marginLeft: 'auto',
                            fontSize: '22px',
                            color: '#1890ff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            transition: 'all 0.3s',
                          }}
                        >
                          {playingAudioId === audioItem.id ? 
                            <PauseCircleOutlined /> : 
                            <PlayCircleOutlined />
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            {/* 背景素材 */}
            {activeNav === 'background' && (() => {
              // 获取基于当前分类的背景数据
              let displayBackgrounds = backgrounds;
              
              if (activeCategory && backgroundsByCategory[activeCategory]) {
                displayBackgrounds = backgroundsByCategory[activeCategory];
              }
              
              return displayBackgrounds.map((background) => (
                <div 
                  key={background.id} 
                  className="material-card background"
                  onClick={() => handleMaterialClick('image', background)}
                >
                  <div className="material-card-content">
                    <img 
                      src={background.cover} 
                      alt={background.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="background-info" style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                    }}>
                      <div className="background-category" style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '10px',
                        textAlign: 'center',
                      }}>{background.categories?.[0]?.name || '未分类'}</div>
                    </div>
                  </div>
                </div>
              ));
            })()}

            {/* 文本素材 */}
            {activeNav === 'text' && (
              <>
                {Object.entries(bubblesByCategory).map(([category, categoryBubbles]) => (
                  <React.Fragment key={category}>
                    <div className="category-title">{category}</div>
                    <div className="bubbles-grid">
                      {categoryBubbles.map((bubble) => (
                        <div 
                          key={bubble.id} 
                          className="material-card bubble"
                          onClick={() => handleMaterialClick('text', bubble)}
                        >
                          <div 
                            className="bubble-content"
                            style={{
                              backgroundImage: `url(${bubble.preview_url || bubble.imageUrl})`,
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))}
              </>
            )}

            {/* 元素素材 */}
            {activeNav === 'element' && elements.map((element) => (
              <div 
                key={element.id} 
                className="material-card element"
                onClick={() => handleMaterialClick('image', element)}
              >
                <div className="material-card-content">
                  <img 
                    src={element.cover || element.url} 
                    alt={element.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            ))}

            {/* 我的素材 */}
            {activeNav === 'material' && (
              <>
                <div className="my-material-tabs">
                  {[
                    { key: 'template', label: '模板' },
                    { key: 'video', label: '视频' },
                    { key: 'audio', label: '音频' },
                    { key: 'image', label: '贴图' }
                  ].map(tab => (
                    <div
                      key={tab.key}
                      className={`my-material-tab ${activeMyMaterialTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveMyMaterialTab(tab.key)}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
                <div className="my-material-content">
                  {Array(6).fill(null).map((_, index) => (
                    <div key={index} className="material-card my-material-item">
                      <div className="material-card-content">
                        {activeMyMaterialTab === 'template' && (
                          <>
                            <div className="my-material-cover">
                              <img src={`https://picsum.photos/300/200?random=${index}`} alt={`模板 ${index + 1}`} />
                            </div>
                            <div className="my-material-info">
                              <div className="my-material-title">我的模板 {index + 1}</div>
                              <div className="my-material-duration">00:30</div>
                            </div>
                          </>
                        )}
                        {activeMyMaterialTab === 'video' && (
                          <>
                            <div className="my-material-cover">
                              <img src={`https://picsum.photos/300/200?random=${index + 10}`} alt={`视频 ${index + 1}`} />
                            </div>
                            <div className="my-material-info">
                              <div className="my-material-title">我的视频 {index + 1}</div>
                              <div className="my-material-duration">00:15</div>
                            </div>
                          </>
                        )}
                        {activeMyMaterialTab === 'audio' && (
                          <>
                            <div className="my-material-icon">
                              <CustomerServiceFilled />
                            </div>
                            <div className="my-material-info">
                              <div className="my-material-title">我的音频 {index + 1}</div>
                              <div className="my-material-duration">00:30</div>
                            </div>
                            <div className="my-material-play">
                              <PlayCircleOutlined />
                            </div>
                          </>
                        )}
                        {activeMyMaterialTab === 'image' && (
                          <>
                            <div className="my-material-cover">
                              <img src={`https://picsum.photos/300/300?random=${index + 20}`} alt={`贴图 ${index + 1}`} />
                            </div>
                            <div className="my-material-info">
                              <div className="my-material-title">我的贴图 {index + 1}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

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
                <div className="header-actions">
                  <button 
                    className={`action-button ${!canUndo ? 'disabled' : ''}`}
                    onClick={() => {/* 实现撤销功能 */}}
                    disabled={!canUndo}
                  >
                    <UndoOutlined />
                    撤销
                  </button>
                  <button 
                    className={`action-button ${!canRedo ? 'disabled' : ''}`}
                    onClick={() => {/* 实现重做功能 */}}
                    disabled={!canRedo}
                  >
                    <RedoOutlined />
                    重做
                  </button>
                  <Button 
                    type="primary" 
                    icon={<ExportOutlined />} 
                    onClick={handleExportClick}
                    className="export-button"
                  >
                    导出视频
                  </Button>
                </div>
              </div>
              <div className="preview-container">
                {tracks.length === 0 ? (
                  <div className="preview-wrapper">
                    <div className="preview-aspect-ratio">
                      <div className="preview-content">
                        <div className="empty-state">
                          <p>开始创建您的视频</p>
                          <p>从左侧素材库中选择素材，添加到时间轴，创建精彩视频。</p>
                          <p>可以添加视频、图片、文字、气泡文字、音效等元素。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="preview-wrapper">
                    <div className="preview-aspect-ratio">
                      <div className="preview-content">
                        <VideoPreview 
                          videoSrc={getActiveVideoSrc()}
                          tracks={tracks}
                          currentTime={currentTime}
                          isPlaying={isPlaying}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onSeek={handleSeek}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧编辑区域 */}
            <div className="edit-section">
              <div className="edit-header">
                <h3>{selectedTrackItem ? '编辑元素' : '视频设置'}</h3>
              </div>
              <div className="edit-content">
                {selectedTrackItem ? (
                  // 如果选中了元素，显示元素编辑选项
                  <>
                    <div className="edit-item">
                      <div className="item-header">
                        <span className="item-title">基础设置</span>
                      </div>
                      <div className="item-content">
                        {/* 根据选中元素类型显示不同的编辑选项 */}
                        {selectedTrackItem.type === TRACK_TYPES.TEXT && (
                          <div className="setting-group">
                            <div className="setting-label">文本内容</div>
                            <Input.TextArea 
                              rows={4} 
                              value={selectedTrackItem.content}
                              onChange={(e) => {/* 处理文本更改 */}}
                            />
                          </div>
                        )}
                        {selectedTrackItem.type === TRACK_TYPES.VIDEO && (
                          <div className="setting-group">
                            <div className="setting-label">视频音量</div>
                            <Slider 
                              value={videoVolume} 
                              onChange={setVideoVolume}
                              min={0}
                              max={100}
                            />
                          </div>
                        )}
                        {/* 添加更多元素类型的编辑选项 */}
                      </div>
                    </div>
                  </>
                ) : (
                  // 如果没有选中元素，显示默认的视频设置
                  <>
                    <div className="edit-item">
                      <div className="item-header">
                        <span className="item-title">字幕设置</span>
                      </div>
                      <div className="item-content">
                        <div className="setting-group">
                          <div className="setting-label">显示字幕</div>
                          <div className="setting-control">
                            <Switch checked={showSubtitle} onChange={setShowSubtitle} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="edit-item">
                      <div className="item-header">
                        <span className="item-title">音频设置</span>
                      </div>
                      <div className="item-content">
                        <div className="setting-group">
                          <div className="setting-label">视频音量</div>
                          <div className="setting-control">
                            <Slider 
                              value={videoVolume} 
                              onChange={setVideoVolume}
                              min={0}
                              max={100}
                            />
                          </div>
                        </div>
                        <div className="setting-group">
                          <div className="setting-label">背景音乐音量</div>
                          <div className="setting-control">
                            <Slider 
                              value={bgmVolume} 
                              onChange={setBgmVolume}
                              min={0}
                              max={100}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 下部分：时间轴区域 */}
          <div 
            className={`timeline-section ${isTimelineCollapsed ? 'collapsed' : ''}`}
            style={{ 
              height: timelineHeight,
              backgroundColor: '#f0f2f5' // 添加较深的背景色
            }}
          >
            {!isTimelineCollapsed && (
              <div 
                className="timeline-resize-handle" 
                onMouseDown={handleTimelineResizeStart}
                ref={timelineResizeRef}
              />
            )}
            <TrackEditor 
              initialTracks={JSON.parse(JSON.stringify(tracks))} 
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
            <Button 
              className="toggle-tracks-button"
              type="text"
              icon={isTimelineCollapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={handleToggleTracks}
            >
              {isTimelineCollapsed ? '编辑轨道' : '收起轨道'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Export Dialog */}
      <ExportDialog
        visible={exportDialogVisible}
        onClose={handleExportClose}
        onExport={handleExportSubmit}
        tracks={tracks}
        duration={20}
        darkMode={true}
      />
    </div>
  );
};

export default VideoEdit;