import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { fileAPI } from '../services/api';
import MessageItem from './MessageItem';
import '../styles/chat.css';

export default function ChatBox() {
  const { messages, setMessages, currentRoom, currentUser, sendMessage, setTyping, connected } = useChat();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !connected) return;

    setSending(true);
    setTyping(false, currentUser?._id, currentRoom);

    try {
      sendMessage(
        text,
        currentUser?._id,
        currentRoom,
        null
      );
      setText('');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await fileAPI.upload(file);
      sendMessage(
        `[File: ${file.name}]`,
        currentUser?._id,
        currentRoom,
        res.data
      );
    } catch (err) {
      alert('File upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTyping = (value) => {
    setText(value);
    setTyping(true, currentUser?._id, currentRoom);
    setTimeout(() => {
      setTyping(false, currentUser?._id, currentRoom);
    }, 3000);
  };

  if (!currentRoom && !currentUser) {
    return (
      <div className="chat-box empty">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="messages-container">
        {messages.map((msg) => (
          <MessageItem key={msg._id} message={msg} isOwn={msg.sender?._id === user?._id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            disabled={!connected || sending}
          />
          <button
            type="button"
            className="btn-icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !connected}
          >

            <img src="/icons/paper-clip.png" width="14" height="14" alt="Attach" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileUpload}
          />
          <button
            type="submit"
            className="bg-blue-600! p-2 rounded-xl text-white hover:bg-blue-700! px-6! py-2!"
            disabled={!text.trim() || !connected || sending}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
