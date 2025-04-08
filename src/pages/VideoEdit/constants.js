// 轨道类型常量定义
export const TRACK_TYPES = {
  VIDEO: 'video',      // 视频轨道
  PERSON: 'person',    // 数字人轨道
  IMAGE: 'image',      // 图片轨道
  AUDIO: 'audio',      // 音频轨道
  TEXT: 'text',        // 文本轨道
  VOICE: 'voice',      // 语音轨道
  BACKGROUND: 'background', // 背景音乐轨道
  EFFECT: 'effect',    // 特效轨道
  FILTER: 'filter',    // 滤镜轨道
  TRANSITION: 'transition' // 转场轨道
};

// 轨道项目类型
export const ITEM_TYPES = {
  VIDEO: 'video',      // 视频项目
  PERSON: 'person',    // 数字人项目
  IMAGE: 'image',      // 图片项目
  AUDIO: 'audio',      // 音频项目
  TEXT: 'text',        // 文本项目
  VOICE: 'voice',      // 语音项目
  BACKGROUND: 'background', // 背景音乐项目
  EFFECT: 'effect',    // 特效项目
  FILTER: 'filter',    // 滤镜项目
  TRANSITION: 'transition' // 转场项目
};

// 素材分类
export const MATERIAL_CATEGORIES = {
  TEMPLATE: 'template', // 模板
  AVATAR: 'avatar',     // 人像
  AUDIO: 'audio',       // 音频
  BACKGROUND: 'background', // 背景
  TEXT: 'text',         // 文本
  ELEMENT: 'element',   // 元素
  MATERIAL: 'material'  // 素材
};

// 默认时长（秒）
export const DEFAULT_DURATIONS = {
  VIDEO: 10,       // 视频默认10秒
  PERSON: 10,      // 数字人默认10秒
  IMAGE: 5,        // 图片默认5秒
  AUDIO: 5,        // 音频默认5秒
  TEXT: 3,         // 文本默认3秒
  VOICE: 5,        // 语音默认5秒
  BACKGROUND: 10,  // 背景音乐默认10秒
  EFFECT: 3,       // 特效默认3秒
  FILTER: 3,       // 滤镜默认3秒
  TRANSITION: 1    // 转场默认1秒
};

// 轨道项的默认属性
export const DEFAULT_TRACK_ITEM_PROPS = {
  // 基础属性
  id: '',
  start: 0,
  duration: 2,
  
  // 位置和尺寸
  x: 50.0, // 默认水平居中，精确的百分比值
  y: 50.0, // 默认垂直居中，精确的百分比值
  width: 30, // 宽度百分比
  height: 'auto', // 高度自适应
  rotation: 0, // 旋转角度
  scale: 1, // 缩放比例
  
  // 样式
  opacity: 1,
  zIndex: 0,
  
  // 文本特有属性
  textStyle: {
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'normal',
    letterSpacing: 0,
    lineHeight: 1.5,
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  
  // 气泡特有属性
  bubbleStyle: {
    imageUrl: '',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8
  }
}; 