import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { roomAPI, userAPI } from '../services/api';
import '../styles/sidebar.css';

export default function Sidebar() {
  const { rooms, setRooms, currentRoom, setCurrentRoom, currentUser, setCurrentUser, joinRoom, onlineUsers, unreadCount, clearUnreadCount } = useChat();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [activeTab, setActiveTab] = useState('rooms');

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data.filter(u => u._id !== user?._id));
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const res = await roomAPI.create(roomName, 'public', '');
      setRooms([...rooms, res.data]);
      setRoomName('');
      setShowCreateRoom(false);
    } catch (err) {
      alert('Failed to create room');
    }
  };

  const handleSelectRoom = (room) => {
    setCurrentRoom(room._id);
    setCurrentUser(null);
    joinRoom(room._id);
    clearUnreadCount(room._id);
  };

  const handleSelectUser = (selectedUser) => {
    setCurrentUser(selectedUser);
    setCurrentRoom(null);
    clearUnreadCount(selectedUser._id);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Chat</h1>
        <div className="sidebar-actions">
          <button className="btn-icon" onClick={() => setShowCreateRoom(!showCreateRoom)}>
            ➕
          </button>
        </div>
      </div>

      {showCreateRoom && (
        <form className="create-room-form" onSubmit={handleCreateRoom}>
          <input
            type="text"
            placeholder="Room name..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            autoFocus
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-sm btn-primary">Create</button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setShowCreateRoom(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="sidebar-tabs">
        <button
          className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="sidebar-list">
        {activeTab === 'rooms' && (
          <div className="items-list">
            {rooms.map((room) => (
              <div
                key={room._id}
                className={`list-item ${currentRoom === room._id ? 'active' : ''}`}
                onClick={() => handleSelectRoom(room)}
              >
                <div className="list-item-content">
                  <p className="list-item-name">#{room.name}</p>
                  <p className="list-item-count">{room.members.length} members</p>
                </div>
                {unreadCount[room._id] > 0 && (
                  <span className="badge">{unreadCount[room._id]}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="items-list">
            {users.map((selectedUser) => (
              <div
                key={selectedUser._id}
                className={`list-item ${currentUser?._id === selectedUser._id ? 'active' : ''}`}
                onClick={() => handleSelectUser(selectedUser)}
              >
                <div className="list-item-content">
                  <div className="user-info">
                    <img src={selectedUser.avatar} alt={selectedUser.username} />
                    <div>
                      <p className="list-item-name">{selectedUser.username}</p>
                      <p className={`list-item-status ${selectedUser.isOnline ? 'online' : ''}`}>
                        {selectedUser.isOnline ? '● Online' : '● Offline'}
                      </p>
                    </div>
                  </div>
                </div>
                {unreadCount[selectedUser._id] > 0 && (
                  <span className="badge">{unreadCount[selectedUser._id]}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
