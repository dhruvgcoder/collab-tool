import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Header from './components/Header/Header';
import Canvas from './components/Canvas/Canvas';
import Toolbar from './components/Toolbar/Toolbar';
import Room from './components/Room/Room';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

const App = () => {
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving drawing...');
  };

  const handleLoad = () => {
    // Implement load functionality
    console.log('Loading drawing...');
  };

  const handleNew = () => {
    // Implement new drawing functionality
    console.log('Creating new drawing...');
  };

  const handleExport = (format) => {
    // Implement export functionality
    console.log(`Exporting as ${format}...`);
  };

  const clearCanvas = () => {
    // This will be passed to the Canvas component
    console.log('Clearing canvas...');
  };

  const undo = () => {
    // Implement undo functionality
    console.log('Undo action...');
  };

  const redo = () => {
    // Implement redo functionality
    console.log('Redo action...');
  };

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/room/:roomId" element={<Room />} />
              <Route
                path="/draw"
                element={
                  <>
                    <Header
                      onSave={handleSave}
                      onLoad={handleLoad}
                      onNew={handleNew}
                      onExport={handleExport}
                    />
                    <Toolbar
                      tool={tool}
                      setTool={setTool}
                      color={color}
                      setColor={setColor}
                      strokeWidth={strokeWidth}
                      setStrokeWidth={setStrokeWidth}
                      clearCanvas={clearCanvas}
                      undo={undo}
                      redo={redo}
                      setIsEraser={setIsEraser}
                    />
                    <Canvas
                      tool={tool}
                      color={color}
                      strokeWidth={strokeWidth}
                      isEraser={isEraser}
                    />
                  </>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;