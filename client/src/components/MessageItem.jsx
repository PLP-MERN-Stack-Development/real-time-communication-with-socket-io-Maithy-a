import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import '../styles/message.css';

export default function MessageItem({ message, isOwn }) {
  const { addReaction } = useChat();
  const [showReactions, setShowReactions] = useState(false);

  const emojis = ['👍', '❤️', '😂', '😮', '😢'];

  const handleReaction = (emoji) => {
    addReaction(message._id, emoji);
    setShowReactions(false);
  };

  if (message.isSystemMessage) {
    return (
      <div className="message-system">
        <p>{message.text}</p>
      </div>
    );
  }

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {!isOwn && message.sender && (
          <img
            src={message.sender.avatar}
            alt={message.sender.username}
            className="message-avatar"
          />
        )}
        <div className="message-bubble">
          {!isOwn && message.sender && (
            <p className="message-sender">{message.sender.username}</p>
          )}
          <p className="message-text">{message.text}</p>
          <p className="message-time">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {message.isRead && isOwn && (
            <span className="read-receipt">✓✓</span>
          )}
        </div>
        {isOwn && message.sender && (
          <img
            src={message.sender.avatar}
            alt={message.sender.username}
            className="message-avatar"
          />
        )}
      </div>

      {message.reactions && message.reactions.length > 0 && (
        <div className="reactions">
          {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
            <span
              key={emoji}
              className="reaction"
              onClick={() => handleReaction(emoji)}
            >
              {emoji} {message.reactions.filter(r => r.emoji === emoji).length}
            </span>
          ))}
        </div>
      )}

      <div className="message-actions">
        <div className="reactions-popup" style={{ display: showReactions ? 'flex' : 'none' }}>
          {emojis.map(emoji => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          className="btn-icon"
          onClick={() => setShowReactions(!showReactions)}
        >
          😊
        </button>
      </div>
    </div>
  );
}
