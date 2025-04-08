import React, { useState, useEffect } from 'react';
import { Slider, Switch, Input, Button, Select, Tooltip } from 'antd';
import { ExportOutlined, BoldOutlined, ItalicOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined, PictureOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import './index.scss';

const { Option } = Select;

// 预设文本样式
const TEXT_PRESETS = [
  {
    id: 'preset1',
    name: '标准白色',
    style: {
      color: '#FFFFFF',
      fontSize: 24,
      fontFamily: 'MiSans',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.5,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    }
  },
  {
    id: 'preset2',
    name: '醒目黄色',
    style: {
      color: '#FFCC00',
      fontSize: 28,
      fontFamily: 'MiSans',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.5,
      textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
    }
  },
  {
    id: 'preset3',
    name: '艺术粉色',
    style: {
      color: '#FF66CC',
      fontSize: 26,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontStyle: 'italic',
      textAlign: 'center',
      letterSpacing: 2,
      lineHeight: 1.6,
      textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
    }
  },
  {
    id: 'preset4',
    name: '科技蓝色',
    style: {
      color: '#33CCFF',
      fontSize: 24,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      letterSpacing: 0,
      lineHeight: 1.4,
      textShadow: '2px 2px 6px rgba(0,0,0,0.6)'
    }
  },
  {
    id: 'preset5',
    name: '简约黑色',
    style: {
      color: '#000000',
      fontSize: 24,
      fontFamily: 'MiSans',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.5,
      textShadow: 'none'
    }
  },
  {
    id: 'preset6',
    name: '复古棕色',
    style: {
      color: '#996633',
      fontSize: 26,
      fontFamily: 'Times New Roman',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.4,
      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
    }
  },
  {
    id: 'preset7',
    name: '霓虹红色',
    style: {
      color: '#FF3366',
      fontSize: 28,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.5,
      textShadow: '0 0 10px #FF3366, 0 0 20px #FF3366'
    }
  },
  {
    id: 'preset8',
    name: '清新绿色',
    style: {
      color: '#66CC99',
      fontSize: 24,
      fontFamily: 'MiSans',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.5,
      textShadow: '1px 1px 3px rgba(0,0,0,0.4)'
    }
  }
];

const EditPanel = ({
  selectedTrackItem,
  showSubtitle,
  setShowSubtitle,
  videoVolume,
  setVideoVolume,
  bgmVolume,
  setBgmVolume,
  elementOpacity,
  setElementOpacity,
  elementRotation,
  setElementRotation,
  elementTextContent,
  setElementTextContent,
  elementTextColor,
  setElementTextColor,
  elementTextSize,
  setElementTextSize,
  handleElementPropertyChange,
  trackTypes,
  onExportClick
}) => {
  // 添加文本样式相关状态
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState('left');
  const [fontFamily, setFontFamily] = useState('MiSans');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineSpacing, setLineSpacing] = useState(0);
  const [borderColor, setBorderColor] = useState('#2A7FFB');
  const [borderWidth, setBorderWidth] = useState(5);
  const [activePreset, setActivePreset] = useState('');
  const [textShadow, setTextShadow] = useState('2px 2px 4px rgba(0,0,0,0.5)');

  // 当选中的元素变化时，更新当前界面的样式设置
  useEffect(() => {
    if (selectedTrackItem && selectedTrackItem.type === trackTypes.TEXT) {
      // 重置预设的激活状态
      setActivePreset('');
      
      // 从元素中提取文本样式
      const textStyle = selectedTrackItem.textStyle || {};
      
      // 更新各个状态
      setIsBold(textStyle.fontWeight === 'bold');
      setIsItalic(textStyle.fontStyle === 'italic');
      setTextAlign(textStyle.textAlign || 'left');
      setFontFamily(textStyle.fontFamily || 'MiSans');
      setLetterSpacing(textStyle.letterSpacing || 0);
      setLineSpacing(textStyle.lineHeight || 0);
      setBorderWidth(textStyle.borderWidth || 0);
      setBorderColor(textStyle.borderColor || '#2A7FFB');
      setTextShadow(textStyle.textShadow || '2px 2px 4px rgba(0,0,0,0.5)');
      
      // 设置透明度滑块值：将不透明度转换为透明度百分比
      const opacity = selectedTrackItem.opacity ?? 1;
      setElementOpacity((1 - opacity) * 100);
    }
  }, [selectedTrackItem, trackTypes.TEXT]);

  // 处理预设样式点击
  const handlePresetClick = (preset) => {
    setActivePreset(preset.id);
    
    // 更新所有状态
    setIsBold(preset.style.fontWeight === 'bold');
    setIsItalic(preset.style.fontStyle === 'italic');
    setTextAlign(preset.style.textAlign);
    setFontFamily(preset.style.fontFamily);
    setLetterSpacing(preset.style.letterSpacing);
    setLineSpacing(preset.style.lineHeight);
    setBorderWidth(0); // 预设通常不设置描边
    setElementTextColor(preset.style.color);
    setElementTextSize(preset.style.fontSize);
    setTextShadow(preset.style.textShadow || '');
    
    // 更新预览区域的样式
    handleElementPropertyChange('textStyle', {
      fontWeight: preset.style.fontWeight,
      fontStyle: preset.style.fontStyle,
      textAlign: preset.style.textAlign,
      fontFamily: preset.style.fontFamily,
      letterSpacing: preset.style.letterSpacing,
      lineHeight: preset.style.lineHeight,
      color: preset.style.color,
      fontSize: preset.style.fontSize,
      textShadow: preset.style.textShadow
    });
  };

  // 处理文本内容变化
  const handleTextContentChange = (e) => {
    const newContent = e.target.value;
    setElementTextContent(newContent);
    handleElementPropertyChange('content', newContent);
  };

  // 处理文本颜色变化
  const handleTextColorChange = (e) => {
    const newColor = e.target.value;
    setElementTextColor(newColor);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      color: newColor
    });
  };

  // 处理文本大小变化
  const handleTextSizeChange = (value) => {
    setElementTextSize(value);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      fontSize: value
    });
  };

  // 处理字间距变化
  const handleLetterSpacingChange = (value) => {
    setLetterSpacing(value);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      letterSpacing: value
    });
  };

  // 处理行间距变化
  const handleLineSpacingChange = (value) => {
    setLineSpacing(value);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      lineHeight: value
    });
  };

  // 处理描边颜色变化
  const handleBorderColorChange = (e) => {
    const newColor = e.target.value;
    setBorderColor(newColor);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      borderColor: newColor,
      WebkitTextStroke: borderWidth > 0 ? `${borderWidth}px ${newColor}` : 'none'
    });
  };

  // 处理描边宽度变化
  const handleBorderWidthChange = (value) => {
    setBorderWidth(value);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      borderWidth: value,
      WebkitTextStroke: value > 0 ? `${value}px ${borderColor}` : 'none'
    });
  };

  // 处理加粗点击
  const handleBoldClick = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      fontWeight: newBold ? 'bold' : 'normal'
    });
  };

  // 处理斜体点击
  const handleItalicClick = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      fontStyle: newItalic ? 'italic' : 'normal'
    });
  };

  // 处理对齐方式点击
  const handleAlignClick = (align) => {
    setTextAlign(align);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      textAlign: align
    });
  };

  // 处理字体变化
  const handleFontChange = (value) => {
    setFontFamily(value);
    handleElementPropertyChange('textStyle', {
      ...selectedTrackItem.textStyle,
      fontFamily: value
    });
  };

  // 渲染文字编辑区域
  const renderTextEditPanel = () => {
    return (
      <div className="edit-content-section">
        {/* 文本内容 */}
        <div className="setting-group">
          <div className="setting-label">文本内容</div>
          <Input.TextArea 
            className="custom-textarea"
            rows={4} 
            value={elementTextContent}
            onChange={handleTextContentChange}
            placeholder="输入文本内容"
          />
          <div className="text-count">{elementTextContent.length}/100</div>
        </div>
        
        {/* 预设样式 */}
        <div className="setting-group">
          <div className="setting-label">预设样式</div>
          <div className="preset-styles">
            {TEXT_PRESETS.map((preset) => (
              <Tooltip key={preset.id} title={preset.name}>
                <div 
                  className={`style-item ${activePreset === preset.id ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    background: preset.style.color === '#FFFFFF' ? '#333' : '#f5f5f5',
                    color: preset.style.color,
                    fontFamily: preset.style.fontFamily,
                    fontSize: '12px',
                    fontWeight: preset.style.fontWeight,
                    fontStyle: preset.style.fontStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textShadow: preset.style.textShadow
                  }}
                >
                  Aa
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* 基础调节 */}
        <div className="section-title">基础调节</div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">透明度</span>
            <span className="setting-value">{elementOpacity}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={elementOpacity} 
            onChange={(value) => {
              setElementOpacity(value);
              // 将透明度百分比转换为不透明度值
              handleElementPropertyChange('opacity', 1 - (value / 100));
            }}
            min={0}
            max={100}
            defaultValue={0}
            tooltip={{
              formatter: (value) => `${value}%`
            }}
          />
        </div>
        
        {/* 字符 */}
        <div className="section-title">字符</div>
        
        <div className="setting-group">
          <div className="setting-label">字体</div>
          <Select 
            className="full-width-select"
            value={fontFamily}
            onChange={handleFontChange}
            dropdownMatchSelectWidth={false}
          >
            <Option value="MiSans">MiSans</Option>
            <Option value="Arial">Arial</Option>
            <Option value="Helvetica">Helvetica</Option>
            <Option value="Times New Roman">Times New Roman</Option>
          </Select>
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">颜色</span>
          </div>
          <div className="color-picker-container">
            <input 
              type="color" 
              className="color-picker"
              value={elementTextColor}
              onChange={handleTextColorChange}
            />
            <Input 
              className="color-input"
              value={elementTextColor.toUpperCase()}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                  handleTextColorChange(e);
                }
              }}
            />
          </div>
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">字号</span>
            <span className="setting-value">{elementTextSize}</span>
          </div>
          <div className="font-size-control">
            <Slider 
              className="custom-slider"
              value={elementTextSize} 
              onChange={handleTextSizeChange}
              min={12}
              max={144}
            />
            <Input 
              className="size-input"
              type="number"
              value={elementTextSize}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 12 && value <= 144) {
                  handleTextSizeChange(value);
                }
              }}
            />
          </div>
        </div>
        
        <div className="setting-group">
          <div className="setting-label">样式</div>
          <div className="text-style-buttons">
            <Button 
              className={`style-button ${isBold ? 'active' : ''}`}
              icon={<BoldOutlined />}
              onClick={handleBoldClick}
            />
            <Button 
              className={`style-button ${isItalic ? 'active' : ''}`}
              icon={<ItalicOutlined />}
              onClick={handleItalicClick}
            />
          </div>
        </div>
        
        {/* 排列 */}
        <div className="section-title">排列</div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">字间距</span>
            <span className="setting-value">{letterSpacing}</span>
          </div>
          <div className="spacing-control">
            <Slider 
              className="custom-slider"
              value={letterSpacing} 
              onChange={handleLetterSpacingChange}
              min={0}
              max={50}
            />
            <Input 
              className="spacing-input"
              type="number"
              value={letterSpacing}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 50) {
                  handleLetterSpacingChange(value);
                }
              }}
            />
          </div>
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">行间距</span>
            <span className="setting-value">{lineSpacing}</span>
          </div>
          <div className="spacing-control">
            <Slider 
              className="custom-slider"
              value={lineSpacing} 
              onChange={handleLineSpacingChange}
              min={0}
              max={50}
            />
            <Input 
              className="spacing-input"
              type="number"
              value={lineSpacing}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 50) {
                  handleLineSpacingChange(value);
                }
              }}
            />
          </div>
        </div>
        
        <div className="setting-group">
          <div className="setting-label">对齐方式</div>
          <div className="text-alignment-buttons">
            <Button 
              className={`alignment-button ${textAlign === 'left' ? 'active' : ''}`}
              icon={<AlignLeftOutlined />}
              onClick={() => handleAlignClick('left')}
            />
            <Button 
              className={`alignment-button ${textAlign === 'center' ? 'active' : ''}`}
              icon={<AlignCenterOutlined />}
              onClick={() => handleAlignClick('center')}
            />
            <Button 
              className={`alignment-button ${textAlign === 'right' ? 'active' : ''}`}
              icon={<AlignRightOutlined />}
              onClick={() => handleAlignClick('right')}
            />
          </div>
        </div>
        
        {/* 描边 */}
        <div className="section-title">描边</div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">颜色</span>
          </div>
          <div className="color-picker-container">
            <input 
              type="color" 
              className="color-picker"
              value={borderColor}
              onChange={handleBorderColorChange}
            />
            <Input 
              className="color-input"
              value={borderColor.toUpperCase()}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                  handleBorderColorChange(e);
                }
              }}
            />
          </div>
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">粗细</span>
            <span className="setting-value">{borderWidth}</span>
          </div>
          <div className="spacing-control">
            <Slider 
              className="custom-slider"
              value={borderWidth} 
              onChange={handleBorderWidthChange}
              min={0}
              max={20}
            />
            <Input 
              className="spacing-input"
              type="number"
              value={borderWidth}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 20) {
                  handleBorderWidthChange(value);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // 渲染图片编辑区域
  const renderImageEditPanel = () => {
    return (
      <div className="edit-content-section">
        <div className="section-title">基础调节</div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">透明度</span>
            <span className="setting-value">{elementOpacity}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={elementOpacity} 
            onChange={(value) => {
              setElementOpacity(value);
              // 将透明度百分比转换为不透明度值
              handleElementPropertyChange('opacity', 1 - (value / 100));
            }}
            min={0}
            max={100}
          />
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">旋转角度</span>
            <span className="setting-value">{elementRotation}°</span>
          </div>
          <Slider 
            className="custom-slider"
            value={elementRotation} 
            onChange={(value) => {
              setElementRotation(value);
              handleElementPropertyChange('rotation', value);
            }}
            min={0}
            max={360}
          />
        </div>
      </div>
    );
  };

  // 渲染视频编辑区域
  const renderVideoEditPanel = () => {
    return (
      <div className="edit-content-section">
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">视频音量</span>
            <span className="setting-value">{videoVolume}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={videoVolume} 
            onChange={(value) => {
              setVideoVolume(value);
              handleElementPropertyChange('volume', value);
            }}
            min={0}
            max={100}
          />
        </div>
      </div>
    );
  };

  // 渲染背景音乐编辑面板
  const renderAudioEditPanel = () => {
    return (
      <div className="edit-content-section">
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">音乐音量</span>
            <span className="setting-value">{bgmVolume}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={bgmVolume} 
            onChange={(value) => {
              setBgmVolume(value);
              handleElementPropertyChange('volume', value);
            }}
            min={0}
            max={100}
          />
        </div>

        <div className="setting-group material-control-group">
          <div className="material-info">
            <span className="material-name">{selectedTrackItem?.content || '背景音乐'}</span>
            <span className="material-meta">{selectedTrackItem?.duration ? `${selectedTrackItem.duration.toFixed(1)}秒` : ''}</span>
          </div>
          <Button
            className="change-material-button"
            icon={<CustomerServiceOutlined />}
            onClick={() => {
              // 切换到素材面板的音频选项卡
              const selectMaterialEvent = new CustomEvent('select-material-tab', {
                detail: { tab: 'audio' }
              });
              document.dispatchEvent(selectMaterialEvent);
            }}
          >
            更换
          </Button>
        </div>
      </div>
    );
  };

  // 渲染背景图编辑面板
  const renderBackgroundEditPanel = () => {
    return (
      <div className="edit-content-section">
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">透明度</span>
            <span className="setting-value">{100 - elementOpacity}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={elementOpacity} 
            onChange={(value) => {
              setElementOpacity(value);
              handleElementPropertyChange('opacity', 1 - value / 100);
            }}
            min={0}
            max={100}
            tipFormatter={value => `${100 - value}%`}
          />
        </div>

        <div className="setting-group material-control-group">
          <div className="material-info">
            <span className="material-name">{selectedTrackItem?.content || '背景图片'}</span>
          </div>
          <Button
            className="change-material-button"
            icon={<PictureOutlined />}
            onClick={() => {
              // 切换到素材面板的背景选项卡
              const selectMaterialEvent = new CustomEvent('select-material-tab', {
                detail: { tab: 'background' }
              });
              document.dispatchEvent(selectMaterialEvent);
            }}
          >
            更换
          </Button>
        </div>
      </div>
    );
  };

  // 渲染默认设置区域
  const renderDefaultSettingsPanel = () => {
    return (
      <div className="edit-content-section">
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">显示字幕</span>
          </div>
          <div className="full-width-switch">
            <Switch 
              className="custom-switch"
              checked={showSubtitle} 
              onChange={setShowSubtitle} 
            />
          </div>
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">视频音量</span>
            <span className="setting-value">{videoVolume}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={videoVolume} 
            onChange={setVideoVolume}
            min={0}
            max={100}
          />
        </div>
        
        <div className="setting-group">
          <div className="setting-header">
            <span className="setting-label">背景音乐音量</span>
            <span className="setting-value">{bgmVolume}%</span>
          </div>
          <Slider 
            className="custom-slider"
            value={bgmVolume} 
            onChange={setBgmVolume}
            min={0}
            max={100}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="edit-section">
      <div className="edit-header">
        <h3>{selectedTrackItem ? '属性编辑' : '视频设置'}</h3>
        <Button 
          type="primary" 
          icon={<ExportOutlined />} 
          onClick={onExportClick}
          className="export-button"
        >
          导出视频
        </Button>
      </div>
      <div className="edit-content">
        {selectedTrackItem ? (
          // 根据选中元素类型显示不同的编辑面板
          selectedTrackItem.type === trackTypes.TEXT ? renderTextEditPanel() :
          selectedTrackItem.type === trackTypes.IMAGE ? renderImageEditPanel() :
          selectedTrackItem.type === trackTypes.VIDEO ? renderVideoEditPanel() :
          selectedTrackItem.type === trackTypes.AUDIO ? renderAudioEditPanel() :
          selectedTrackItem.type === trackTypes.BACKGROUND ? renderBackgroundEditPanel() :
          null
        ) : (
          // 如果没有选中元素，显示默认的视频设置
          renderDefaultSettingsPanel()
        )}
      </div>
    </div>
  );
};

export default EditPanel; 