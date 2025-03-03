import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { createRoom } = useSocket();
  const { isAuthenticated, user } = useAuth();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const roomId = await createRoom();
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    navigate(`/room/${roomIdInput.trim()}`);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>DrawCollab</h1>
        <p>A collaborative drawing tool inspired by Excalidraw</p>
      </div>
      
      <div className="home-actions">
        <div className="action-card">
          <h2>Start Drawing</h2>
          <p>Create a new drawing board and start drawing right away.</p>
          <button onClick={() => navigate('/draw')} className="primary-button">
            Start Drawing
          </button>
        </div>
        
        <div className="action-card">
          <h2>Collaborate</h2>
          <p>Create a room to collaborate with others in real-time.</p>
          <button 
            onClick={handleCreateRoom} 
            className="primary-button"
            disabled={isCreatingRoom}
          >
            {isCreatingRoom ? 'Creating Room...' : 'Create Room'}
          </button>
          
          <div className="join-room">
            <p>Or join an existing room:</p>
            <div className="join-room-form">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
              />
              <button onClick={handleJoinRoom}>Join</button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      </div>
      
      {!isAuthenticated && (
        <div className="auth-prompt">
          <p>Sign in to save your drawings and access them from anywhere.</p>
          <div className="auth-buttons">
            <button onClick={() => navigate('/login')} className="secondary-button">
              Sign In
            </button>
            <button onClick={() => navigate('/register')} className="secondary-button">
              Sign Up
            </button>
          </div>
        </div>
      )}
      
      {isAuthenticated && (
        <div className="user-drawings">
          <h2>Your Drawings</h2>
          <div className="drawings-grid">
            <div className="empty-state">
              <p>You don't have any saved drawings yet.</p>
            </div>
          </div>
        </div>
      )}
      
      <footer className="home-footer">
        <p>All your data is saved locally in your browser unless you choose to save it to the cloud.</p>
      </footer>
    </div>
  );
};

export default HomePage;