import React, { useState, useRef, useEffect } from 'react';
import type { User, ChatMessage } from '../types';

interface ResearchHubProps {
  user: User;
  messages: ChatMessage[];
  onAddMessage: (text: string) => void;
}

const ResearchHub: React.FC<ResearchHubProps> = ({ user, messages, onAddMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onAddMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <section>
      <h1 className="text-4xl font-bold text-center text-slate-100 mb-2">Research Hub</h1>
      <p className="text-lg text-slate-400 text-center mb-10">Chat with fellow researchers, ask questions, and collaborate on your projects.</p>
      
      <div className="max-w-4xl mx-auto bg-slate-800 rounded-lg shadow-2xl flex flex-col" style={{ height: '70vh' }}>
        {/* Message Display Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-4 ${msg.user.email === user.email ? 'flex-row-reverse' : ''}`}
              >
                <img src={msg.user.picture} alt={msg.user.name} className="w-10 h-10 rounded-full" />
                <div
                  className={`flex flex-col ${msg.user.email === user.email ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-sm ${
                      msg.user.email === user.email
                        ? 'bg-blue-600 rounded-br-none'
                        : 'bg-slate-700 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm text-slate-100">{msg.text}</p>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    {msg.user.name}, {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input Area */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700">
          <form onSubmit={handleSendMessage} className="flex items-center gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-full py-2 px-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 flex-shrink-0 transition-colors"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ResearchHub;