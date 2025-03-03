import React, { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: false,
    });

    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Connect the socket
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
    };
  }, [socket]);

  // Join a room for collaboration
  const connectToRoom = useCallback((roomId) => {
    if (!socket || !roomId) return;

    setRoomId(roomId);
    
    const userData = user ? {
      userId: user._id,
      name: user.name,
      email: user.email
    } : {
      userId: socket.id,
      name: 'Anonymous',
    };

    socket.emit('join-room', { roomId, user: userData });
  }, [socket, user]);

  // Leave the current room
  const disconnectFromRoom = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('leave-room', { roomId });
    setRoomId(null);
  }, [socket, roomId]);

  // Create a new room
  const createRoom = useCallback(async () => {
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit('create-room', {}, (response) => {
        resolve(response.roomId);
      });
    });
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        roomId,
        connectToRoom,
        disconnectFromRoom,
        createRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};