import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Radio, Slider, Select, Button, Progress, message } from 'antd';
import { CloudUploadOutlined, DownloadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import './index.scss';

const { Option } = Select;

// 视频分辨率选项
const RESOLUTION_OPTIONS = [
  { value: '1080p', label: '1080p (1920x1080)', width: 1920, height: 1080 },
  { value: '720p', label: '720p (1280x720)', width: 1280, height: 720 },
  { value: '480p', label: '480p (854x480)', width: 854, height: 480 },
  { value: '360p', label: '360p (640x360)', width: 640, height: 360 },
];

// 视频格式选项
const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4 (推荐)' },
  { value: 'webm', label: 'WebM' },
  { value: 'mov', label: 'MOV' },
];

// 帧率选项
const FPS_OPTIONS = [
  { value: 30, label: '30 FPS' },
  { value: 25, label: '25 FPS' },
  { value: 24, label: '24 FPS' },
  { value: 60, label: '60 FPS' },
];

const ExportDialog = ({ 
  visible, 
  onClose, 
  onExport,
  tracks = [], 
  duration = 0,
  darkMode = true // 默认使用暗色模式，与视频编辑页面保持一致
}) => {
  const [form] = Form.useForm();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(darkMode);
  
  // 检测应用的主题
  useEffect(() => {
    // 可以根据父元素或 body 上的暗色主题类来检测
    const isDark = document.body.classList.contains('dark-theme') || darkMode;
    setIsDarkTheme(isDark);
  }, [darkMode, visible]);
  
  // 初始表单值
  const initialValues = {
    name: '我的视频作品',
    description: '使用数字人视频编辑器创建',
    resolution: '720p',
    format: 'mp4',
    fps: 30,
    quality: 80
  };
  
  // 处理导出过程
  const handleExport = async (values) => {
    if (!tracks.length) {
      message.error('没有可导出的内容，请先添加素材');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    setExportStage('正在准备导出...');
    
    try {
      // 模拟导出进度
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 5) + 1;
          
          if (progress <= 30) {
            setExportStage('正在合成视频轨道...');
          } else if (progress <= 60) {
            setExportStage('正在合成音频轨道...');
          } else if (progress <= 90) {
            setExportStage('正在添加特效和转场...');
          } else {
            setExportStage('正在完成导出...');
          }
          
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // 导出完成
            setTimeout(() => {
              setIsExporting(false);
              setExportProgress(0);
              
              // 调用导出完成回调
              if (onExport) {
                onExport({
                  ...values,
                  duration,
                  trackCount: tracks.length,
                  exportTime: new Date().toISOString()
                });
              }
              
              message.success('视频导出成功！');
              
              // 延迟关闭弹窗
              setTimeout(() => {
                onClose();
              }, 1000);
            }, 1000);
          }
          
          setExportProgress(progress);
        }, 200);
      };
      
      // 延迟开始模拟进度，模拟准备过程
      setTimeout(simulateProgress, 800);
      
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
      setIsExporting(false);
    }
  };
  
  // 取消导出
  const handleCancel = () => {
    if (isExporting) {
      Modal.confirm({
        title: '确认取消导出？',
        content: '导出过程将被中断，已处理的内容将丢失。',
        onOk: () => {
          setIsExporting(false);
          onClose();
        }
      });
    } else {
      onClose();
    }
  };
  
  // 渲染导出进度
  const renderExportProgress = () => {
    return (
      <div className="export-progress">
        <VideoCameraOutlined className="export-icon" />
        <h3>正在导出视频</h3>
        <p className="export-stage">{exportStage}</p>
        <Progress percent={exportProgress} status="active" />
        <p className="export-tip">导出过程中请勿关闭窗口</p>
      </div>
    );
  };
  
  // 渲染导出设置表单
  const renderExportForm = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleExport}
      >
        <div className="form-section">
          <h3>基本信息</h3>
          <Form.Item
            name="name"
            label="视频名称"
            rules={[{ required: true, message: '请输入视频名称' }]}
          >
            <Input placeholder="输入视频名称" maxLength={50} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="视频描述"
          >
            <Input.TextArea 
              placeholder="添加视频描述" 
              rows={2} 
              maxLength={200}
              showCount
            />
          </Form.Item>
        </div>
        
        <div className="form-section">
          <h3>视频设置</h3>
          <Form.Item
            name="resolution"
            label="视频分辨率"
          >
            <Select>
              {RESOLUTION_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="format"
            label="视频格式"
          >
            <Radio.Group>
              {FORMAT_OPTIONS.map(option => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="fps"
            label="帧率"
          >
            <Select>
              {FPS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="quality"
            label={`视频质量: ${form.getFieldValue('quality') || initialValues.quality}%`}
          >
            <Slider min={20} max={100} step={5} />
          </Form.Item>
        </div>
        
        <div className="form-section">
          <h3>保存选项</h3>
          <Form.Item
            name="saveOption"
            initialValue="cloud"
          >
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="cloud">
                <CloudUploadOutlined /> 上传到云端
              </Radio.Button>
              <Radio.Button value="local">
                <DownloadOutlined /> 保存到本地
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <div className="video-info">
            <p>视频时长：{formatDuration(duration)}</p>
            <p>轨道数量：{tracks.length}</p>
            <p>预计文件大小：{calculateFileSize(
              form.getFieldValue('resolution') || initialValues.resolution,
              form.getFieldValue('quality') || initialValues.quality,
              duration
            )}</p>
          </div>
        </div>
      </Form>
    );
  };
  
  return (
    <Modal
      title="导出视频"
      open={visible}
      onCancel={handleCancel}
      width={600}
      className={`export-dialog ${isDarkTheme ? 'dark-theme' : ''}`}
      footer={
        !isExporting ? [
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button 
            key="export" 
            type="primary" 
            onClick={() => form.submit()}
            disabled={!tracks.length}
          >
            开始导出
          </Button>
        ] : [
          <Button key="cancel" onClick={handleCancel}>
            取消导出
          </Button>
        ]
      }
    >
      {isExporting ? renderExportProgress() : renderExportForm()}
    </Modal>
  );
};

// 格式化时长
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 计算预计文件大小
const calculateFileSize = (resolution, quality, duration) => {
  // 简单算法估算文件大小
  const resolutionMap = {
    '1080p': 1920 * 1080,
    '720p': 1280 * 720,
    '480p': 854 * 480,
    '360p': 640 * 360
  };
  
  const pixelCount = resolutionMap[resolution] || resolutionMap['720p'];
  const qualityFactor = quality / 100;
  
  // 估算每秒约 0.15MB 每百万像素在100%质量下
  const bytesPerSecond = (pixelCount / 1000000) * 0.15 * 1024 * 1024 * qualityFactor;
  const totalBytes = bytesPerSecond * duration;
  
  // 格式化文件大小
  if (totalBytes < 1024 * 1024) {
    return `${(totalBytes / 1024).toFixed(2)} KB`;
  } else if (totalBytes < 1024 * 1024 * 1024) {
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

export default ExportDialog; 