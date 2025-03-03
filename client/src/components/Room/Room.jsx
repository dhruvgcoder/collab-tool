import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import Canvas from '../Canvas/Canvas';
import Toolbar from '../Toolbar/Toolbar';
import './Room.css';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connectToRoom, disconnectFromRoom } = useSocket();
  const { isAuthenticated, user } = useAuth();
  
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [canvasRef, setCanvasRef] = useState(null);
  
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }
    
    connectToRoom(roomId);
    
    // Listen for participants updates
    if (socket) {
      socket.on('participants', (data) => {
        setParticipants(data.participants);
      });
    }
    
    return () => {
      disconnectFromRoom();
      if (socket) {
        socket.off('participants');
      }
    };
  }, [roomId, socket, connectToRoom, disconnectFromRoom, navigate]);
  
  const clearCanvas = () => {
    if (canvasRef && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      if (socket) {
        socket.emit('clear-canvas', { roomId });
      }
    }
  };
  
  const handleUndo = () => {
    // Implement undo functionality
  };
  
  const handleRedo = () => {
    // Implement redo functionality
  };
  
  const copyRoomLink = () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(roomUrl)
      .then(() => {
        alert('Room link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy room link: ', err);
      });
  };
  
  return (
    <div className="room-container">
      <div className="room-header">
        <div className="room-info">
          <h2>Room: {roomId}</h2>
          <button onClick={copyRoomLink} className="copy-link-button">
            Copy Room Link
          </button>
        </div>
        
        <div className="participants-list">
          <h3>Participants ({participants.length})</h3>
          <div className="participants-avatars">
            {participants.map((participant, index) => (
              <div key={index} className="participant-avatar" title={participant.name || 'Anonymous'}>
                {participant.name ? participant.name[0].toUpperCase() : 'A'}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        clearCanvas={clearCanvas}
        undo={handleUndo}
        redo={handleRedo}
        setIsEraser={setIsEraser}
      />
      
      <Canvas
        ref={setCanvasRef}
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        isEraser={isEraser}
      />
      
      {!isAuthenticated && (
        <div className="login-prompt">
          <p>Sign in to save your drawings and collaborate with others.</p>
          <button onClick={() => navigate('/login')}>Sign In</button>
        </div>
      )}
    </div>
  );
};

export default Room;