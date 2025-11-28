
import React, { useState, useRef, useEffect } from 'react';
import type { User, ChatMessage } from '../types';

interface ResearchHubProps {
  user: User;
  messages: ChatMessage[];
  onAddMessage: (text: string) => void;
}

// Simple Markdown to HTML renderer component
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parseMarkdown = (text: string) => {
    // Escape HTML to prevent XSS
    let escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // **bold**
    escapedText = escapedText.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    // *italic*
    escapedText = escapedText.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    // [link text](url)
    escapedText = escapedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>');

    // Handle lists
    const lines = escapedText.split('\n');
    let inList = false;
    const processedLines = lines.map(line => {
      if (line.match(/^\s*-\s/)) {
        const itemContent = line.replace(/^\s*-\s/, '');
        if (!inList) {
          inList = true;
          return `<ul><li>${itemContent}</li>`;
        }
        return `<li>${itemContent}</li>`;
      } else {
        if (inList) {
          inList = false;
          return `</ul>${line}`;
        }
        return line;
      }
    });
    if (inList) {
        processedLines.push('</ul>');
    }

    return processedLines.join('\n').replace(/\n/g, '<br />');
  };

  const html = parseMarkdown(content);
  return <div className="text-sm text-slate-100" dangerouslySetInnerHTML={{ __html: html }} />;
};

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
      <div className="bg-slate-800 rounded-lg shadow-inner flex flex-col" style={{ height: '65vh' }}>
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
                    <MarkdownRenderer content={msg.text} />
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
              placeholder="Type your message or ask @ai..."
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
  );
};

export default ResearchHub;