import React, { useState, useRef } from 'react';
import {
  AppstoreFilled,
  UserOutlined,
  CustomerServiceFilled,
  PictureFilled,
  FontSizeOutlined,
  BoxPlotFilled,
  FolderFilled,
  LeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import './index.scss';
import logo from '../../../assets/images/logo.png';

// 导入素材数据
import { templates, templatesByCategory } from '../data/templates';
import { music, musicByCategory } from '../data/music';
import { bubblesByCategory } from '../data/bubbles';
import { elements, elementsByCategory } from '../data/elements';
import { backgrounds, backgroundsByCategory, backgroundCategories } from '../data/background';

// 格式化时长为 mm:ss 格式
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
};

const MaterialsPanel = ({
  onMaterialClick,
  onBack,
  playingAudioId,
  onAudioPlay
}) => {
  const [activeNav, setActiveNav] = useState('template');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMyMaterialTab, setActiveMyMaterialTab] = useState('template');
  
  // 音频播放相关
  const audioPlayerRef = useRef(null);

  // 导航菜单项
  const navItems = [
    { key: 'template', label: '模板', icon: <AppstoreFilled /> },
    // { key: 'avatar', label: '人像', icon: <UserOutlined /> },
    { key: 'audio', label: '音频', icon: <CustomerServiceFilled /> },
    { key: 'background', label: '背景', icon: <PictureFilled /> },
    { key: 'text', label: '文本', icon: <FontSizeOutlined /> },
    { key: 'element', label: '元素', icon: <BoxPlotFilled /> },
    { key: 'material', label: '我的素材', icon: <FolderFilled /> }
  ];

  // 根据不同素材类型定义分类
  const materialCategories = {
    template: [
      { key: 'all', label: '全部' },
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
    audio: [
      { key: 'all', label: '全部' },
      { key: 'popular', label: '热门音乐' },
      { key: 'sales', label: '带货音乐' },
      { key: 'emotion', label: '情感音乐' },
      { key: 'classical', label: '古典清幽' },
      { key: 'festive', label: '节日喜庆' }
    ],
    background: [
      { key: 'all', label: '全部' },
      ...backgroundCategories.map(category => ({
        key: category.name,
        label: category.name
      }))
    ],
    text: [
      { key: 'all', label: '全部' },
      { key: 'title', label: '标题模板' },
      { key: 'subtitle', label: '字幕模板' },
      { key: 'caption', label: '说明文字' },
      { key: 'end', label: '片尾字幕' }
    ],
    element: [
      { key: 'all', label: '全部' },
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

  // 处理音频播放
  const handleAudioPlay = (audioItem, e) => {
    if (onAudioPlay) {
      onAudioPlay(audioItem, e);
      return;
    }

    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击事件
    
    if (playingAudioId === audioItem.id) {
      // 如果当前已经在播放，则暂停
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    } else {
      // 如果播放不同的音频，需要先停止当前播放的
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      
      // 创建新的音频对象并播放
      audioPlayerRef.current = new Audio(audioItem.url);
      audioPlayerRef.current.play();
    }
  };

  return (
    <>
      {/* Fixed Navigation */}
      <div className="fixed-navigation" data-active={activeNav}>
        <div className="logo-section">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <div className="brand-wrapper" onClick={onBack}>
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
          {/* 形象素材 */}
          {activeNav === 'template' && (() => {
            // 获取基于当前分类的模板数据
            let displayTemplates = templates || [];
            
            if (activeCategory !== 'all' && templatesByCategory && templatesByCategory[activeCategory]) {
              displayTemplates = templatesByCategory[activeCategory];
            }
            
            return displayTemplates.map((template) => (
              <div 
                key={template.id} 
                className="material-card template"
                onClick={() => onMaterialClick('video', template)}
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
                    }}>{template.categories && template.categories.length > 0 ? template.categories[0].name : '未分类'}</div>
                  </div>
                </div>
              </div>
            ));
          })()}

          {/* 音频素材 */}
          {activeNav === 'audio' && (() => {
            // 获取基于当前分类的音乐数据
            let displayMusic = music || [];
            
            if (activeCategory !== 'all' && musicByCategory && musicByCategory[activeCategory]) {
              displayMusic = musicByCategory[activeCategory];
            }
            
            return (
              <>
                {displayMusic.map((audioItem) => (
                  <div 
                    key={audioItem.id} 
                    className="material-card audio"
                    onClick={() => onMaterialClick('audio', audioItem)}
                  >
                    <div className="material-card-content">
                      <div className="icon">
                        <CustomerServiceFilled />
                      </div>
                      <div className="audio-info">
                        <div className="name">{audioItem.name}</div>
                        <div className="duration">{formatDuration ? formatDuration(audioItem.duration) : `${audioItem.duration}秒`}</div>
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

          {/* 文本素材 */}
          {activeNav === 'text' && (
            <>
              {activeCategory === 'all' ? (
                // 显示所有分类的气泡
                Object.entries(bubblesByCategory || {}).map(([category, categoryBubbles]) => (
                  <React.Fragment key={category}>
                    <div className="category-title">{category}</div>
                    <div className="bubbles-grid">
                      {categoryBubbles.map((bubble) => (
                        <div 
                          key={bubble.id} 
                          className="material-card bubble"
                          onClick={() => onMaterialClick('text', bubble)}
                        >
                          <div 
                            className="bubble-content"
                            style={{
                              backgroundImage: `url(${bubble.url || bubble.imageUrl})`,
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))
              ) : (
                // 显示选中分类的气泡
                <div className="bubbles-grid">
                  {bubblesByCategory && bubblesByCategory[activeCategory]?.map((bubble) => (
                    <div 
                      key={bubble.id} 
                      className="material-card bubble"
                      onClick={() => onMaterialClick('text', bubble)}
                    >
                      <div 
                        className="bubble-content"
                        style={{
                          backgroundImage: `url(${bubble.url || bubble.imageUrl})`,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 贴图素材 */}
          {activeNav === 'element' && (() => {
            let displayElements = elements || [];
            
            if (activeCategory !== 'all' && elementsByCategory) {
              displayElements = elements.filter(element => 
                element.categories && element.categories.some(cat => cat.name === activeCategory)
              );
            }
            
            return displayElements.map((element) => (
              <div 
                key={element.id} 
                className="material-card element"
                onClick={() => onMaterialClick('image', element)}
              >
                <div className="material-card-content">
                  <img 
                    src={element.cover || element.url} 
                    alt={element.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            ));
          })()}
          
          {/* 背景素材 */}
          {activeNav === 'background' && (() => {
            // 获取基于当前分类的背景数据
            let displayBackgrounds = backgrounds || [];
            
            if (activeCategory !== 'all' && backgroundsByCategory) {
              displayBackgrounds = backgroundsByCategory[activeCategory] || [];
            }
            
            return displayBackgrounds.map((background) => (
              <div 
                key={background.id} 
                className="material-card background"
                onClick={() => onMaterialClick('background', background)}
              >
                <div className="material-card-content">
                  <img 
                    src={background.cover || background.url} 
                    alt={background.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="background-info" style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '6px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                  }}>
                    <div className="background-title" style={{
                      color: '#fff',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center'
                    }}>{background.name}</div>
                    {background.categories && background.categories.length > 0 && (
                      <div className="background-category" style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '10px',
                        textAlign: 'center'
                      }}>{background.categories[0].name}</div>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}

          {/* 我的素材 */}
          {activeNav === 'material' && (
            <>
              <div className="my-material-tabs">
                {[
                  { key: 'template', label: '形象' },
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
                            <img src={`https://picsum.photos/300/200?random=${index}`} alt={`形象 ${index + 1}`} />
                          </div>
                          <div className="my-material-info">
                            <div className="my-material-title">我的形象 {index + 1}</div>
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
    </>
  );
};

export default MaterialsPanel;
