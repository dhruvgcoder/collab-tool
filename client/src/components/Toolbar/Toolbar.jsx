import React from 'react';
import './Toolbar.css';
import { useSocket } from '../../hooks/useSocket';

const Toolbar = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  strokeWidth, 
  setStrokeWidth,
  clearCanvas,
  undo,
  redo,
  setIsEraser
}) => {
  const { isConnected } = useSocket();

  const tools = [
    { name: 'pencil', icon: '✏️' },
    { name: 'line', icon: '⟋' },
    { name: 'rectangle', icon: '□' },
    { name: 'circle', icon: '○' },
    { name: 'eraser', icon: '🧽' },
  ];

  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ];

  const handleToolChange = (selectedTool) => {
    setTool(selectedTool);
    if (selectedTool === 'eraser') {
      setIsEraser(true);
    } else {
      setIsEraser(false);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section tools">
        {tools.map((t) => (
          <button
            key={t.name}
            className={`tool-button ${tool === t.name ? 'active' : ''}`}
            onClick={() => handleToolChange(t.name)}
            title={t.name}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="toolbar-section colors">
        {colors.map((c) => (
          <button
            key={c}
            className={`color-button ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
      </div>

      <div className="toolbar-section stroke-width">
        <label htmlFor="stroke-width">Width:</label>
        <input
          id="stroke-width"
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
        />
        <span>{strokeWidth}px</span>
      </div>

      <div className="toolbar-section actions">
        <button onClick={undo} title="Undo">↩️</button>
        <button onClick={redo} title="Redo">↪️</button>
        <button onClick={clearCanvas} title="Clear Canvas">🗑️</button>
      </div>

      {isConnected && (
        <div className="connection-status connected">
          Connected
        </div>
      )}
      {!isConnected && (
        <div className="connection-status disconnected">
          Disconnected
        </div>
      )}
    </div>
  );
};

export default Toolbar;