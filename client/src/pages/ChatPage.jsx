import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import { roomAPI } from '../services/api';
import '../styles/layout.css';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await roomAPI.getAll();
      setLoading(false);
    } catch (err) {
      console.error('Failed to load initial data');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <Sidebar />
      <div className="chat-main">
        <div className="chat-header">
          <h2>Chat Room</h2>
          <div className="header-actions">
            <span className="user-info">
              <img src={user?.avatar} alt={user?.username} />
              <span>{user?.username}</span>
            </span>
            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <ChatBox />
      </div>
    </div>
  );
}
