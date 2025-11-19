import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState({});

  useEffect(() => {
    if (token) {
      const sock = connectSocket(token);
      setSocket(sock);

      sock.on('connection_success', () => {
        setConnected(true);
      });

      sock.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      sock.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      sock.on('receive_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        setUnreadCount(prev => ({
          ...prev,
          [msg.room || msg.sender]: (prev[msg.room || msg.sender] || 0) + 1
        }));
      });

      sock.on('user_typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      });

      sock.on('message_read', ({ messageId }) => {
        setMessages(prev => prev.map(m =>
          m._id === messageId ? { ...m, isRead: true } : m
        ));
      });

      sock.on('reaction_updated', (msg) => {
        setMessages(prev => prev.map(m =>
          m._id === msg._id ? msg : m
        ));
      });

      sock.on('user_joined_room', (data) => {
        if (currentRoom === data.roomId) {
          setMessages(prev => [...prev, {
            _id: Date.now(),
            text: `User joined the room`,
            isSystemMessage: true,
            createdAt: new Date()
          }]);
        }
      });

      return () => {
        sock.off('connection_success');
        sock.off('user_online');
        sock.off('user_offline');
        sock.off('receive_message');
        sock.off('user_typing');
        sock.off('message_read');
        sock.off('reaction_updated');
        sock.off('user_joined_room');
      };
    }

    return () => {
      disconnectSocket();
    };
  }, [token, currentRoom]);

  const sendMessage = (text, receiverId, roomId, file) => {
    if (socket && connected) {
      socket.emit('send_message', {
        text,
        receiverId,
        roomId,
        file
      });
    }
  };

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_room', roomId);
      setCurrentRoom(roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_room', roomId);
    }
  };

  const setTyping = (isTyping, receiverId, roomId) => {
    if (socket && connected) {
      socket.emit('typing', {
        isTyping,
        receiverId,
        roomId
      });
    }
  };

  const markMessageRead = (messageId) => {
    if (socket && connected) {
      socket.emit('message_read', messageId);
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && connected) {
      socket.emit('reaction', {
        messageId,
        emoji
      });
    }
  };

  const clearUnreadCount = (key) => {
    setUnreadCount(prev => {
      const newCount = { ...prev };
      delete newCount[key];
      return newCount;
    });
  };

  return (
    <ChatContext.Provider value={{
      socket,
      connected,
      rooms,
      setRooms,
      messages,
      setMessages,
      currentRoom,
      setCurrentRoom,
      currentUser,
      setCurrentUser,
      onlineUsers,
      typingUsers,
      unreadCount,
      sendMessage,
      joinRoom,
      leaveRoom,
      setTyping,
      markMessageRead,
      addReaction,
      clearUnreadCount
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
