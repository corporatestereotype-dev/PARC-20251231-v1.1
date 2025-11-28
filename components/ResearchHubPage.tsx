import React, { useState, useRef, useEffect } from 'react';
import type { User, ChatMessage, SyntheticUser } from '../types';

interface ResearchHubPageProps {
    user: User;
    messages: ChatMessage[];
    onAddMessage: (text: string) => void;
    onlineUsers: SyntheticUser[];
}

const ResearchHubPage: React.FC<ResearchHubPageProps> = ({ user, messages, onAddMessage, onlineUsers }) => {
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
            <h1 className="text-4xl font-bold text-center text-[var(--text-primary)] mb-2">Research Hub</h1>
            <p className="text-lg text-[var(--text-secondary)] text-center mb-10">Chat with fellow researchers, ask questions, and collaborate on your projects.</p>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Chat Component */}
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-lg shadow-2xl flex flex-col" style={{ height: '70vh' }}>
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
                                            className={`px-4 py-2 rounded-lg max-w-sm ${msg.user.email === user.email
                                                    ? 'bg-[var(--accent-primary)] rounded-br-none'
                                                    : 'bg-[var(--bg-tertiary)] rounded-bl-none'
                                                }`}
                                        >
                                            <p className="text-sm text-[var(--text-primary)]">{msg.text}</p>
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
                    <div className="p-4 bg-black/20 border-t border-[var(--border-primary)]">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full py-2 px-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                                aria-label="Chat message input"
                            />
                            <button
                                type="submit"
                                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-full p-3 flex-shrink-0 transition-colors"
                                aria-label="Send message"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Side Panels */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
                        <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Online Collaborators</h3>
                        <ul className="space-y-3">
                            <li key={user.email} className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full" />
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[var(--bg-secondary)]"></span>
                                </div>
                                <span className="text-sm font-medium text-[var(--text-primary)]">{user.name} (You)</span>
                            </li>
                            {onlineUsers.map(u => (
                                <li key={u.id} className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={u.avatarUrl} alt={u.name} className="w-9 h-9 rounded-full" />
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[var(--bg-secondary)]"></span>
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">{u.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
                        <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Shared Notes</h3>
                        <textarea
                            className="w-full h-48 bg-[var(--bg-tertiary)]/80 border border-[var(--border-primary)] rounded-md p-3 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            placeholder="Start typing shared notes here..."
                        ></textarea>
                        <p className="text-xs text-slate-500 mt-2">Conceptual demonstration of real-time shared notes.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResearchHubPage;