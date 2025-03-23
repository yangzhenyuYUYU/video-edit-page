import React, { useState } from 'react';
import SplitLine from './SplitLine';
import TimeLine from './item/trackItem/TimeLine';

// Example component showing how to use the SplitLine component
const ExampleUsage = () => {
  // State for panel dimensions
  const [panelWidth, setPanelWidth] = useState(300);
  const [panelHeight, setPanelHeight] = useState(200);
  
  // Handler for width updates 
  const handleUpdateWidth = (newWidth) => {
    setPanelWidth(newWidth);
  };
  
  // Handler for height updates
  const handleUpdateHeight = (newHeight) => {
    setPanelHeight(newHeight);
  };
  
  return (
    <div className="editor-container" style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Main content area */}
      <div className="main-content" style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top panel with timeline */}
        <div className="top-panel" style={{ 
          height: `${panelHeight}px`, 
          width: '100%', 
          backgroundColor: '#f5f5f5',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <TimeLine 
            width="100%" 
            height={30}
            start={0}
            step={30}
            focusPosition={{ start: 10, end: 20 }}
            onSelectFrame={(frame) => console.log('Selected frame:', frame)}
          />
          
          {/* Horizontal split line */}
          <SplitLine 
            newHeight={panelHeight}
            onUpdateNewHeight={handleUpdateHeight}
            direction="horizontal"
            limitSize={{
              minHeight: 100,
              maxHeight: 500,
              minWidth: 0,
              maxWidth: 999999
            }}
            className="bottom-resize-handle"
          />
        </div>
        
        {/* Bottom area with split panel */}
        <div className="bottom-area" style={{ 
          flex: 1, 
          display: 'flex', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Left panel */}
          <div className="left-panel" style={{ 
            width: `${panelWidth}px`, 
            height: '100%', 
            backgroundColor: '#e0e0e0',
            position: 'relative'
          }}>
            <div className="panel-content">
              Left Panel Content
            </div>
            
            {/* Vertical split line */}
            <SplitLine 
              newWidth={panelWidth}
              onUpdateNewWidth={handleUpdateWidth}
              direction="vertical"
              limitSize={{
                minHeight: 0,
                maxHeight: 999999,
                minWidth: 200,
                maxWidth: 600
              }}
              className="right-resize-handle"
              style={{
                right: 0,
                top: 0
              }}
            />
          </div>
          
          {/* Right panel */}
          <div className="right-panel" style={{ 
            flex: 1, 
            height: '100%', 
            backgroundColor: '#d0d0d0'
          }}>
            <div className="panel-content">
              Right Panel Content
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage; 