

import React from 'react';
import type { User, Project, ChatMessage, FeedItem } from './types';

export const MOCK_USER: User = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  picture: 'https://i.pravatar.cc/150?u=alexdoe',
};

export const AI_ASSISTANT_USER: User = {
  name: 'Polymath AI Assistant',
  email: 'ai-assistant@science-fair.com',
  picture: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-cpu"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,
};

const otherUser1: User = { name: 'Jamie Lane', email: 'jamie@example.com', picture: 'https://i.pravatar.cc/150?u=jamie' };
const otherUser2: User = { name: 'Casey Smith', email: 'casey@example.com', picture: 'https://i.pravatar.cc/150?u=casey' };


export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj1',
    title: 'Neural Network for Plant Disease Detection',
    description: 'Using convolutional neural networks to identify common diseases in tomato plants from leaf images. Achieved 98% accuracy on a dataset of 10,000 images.',
    authorName: 'Jamie Lane',
    imageUrl: 'https://picsum.photos/seed/plants/400/300',
    messages: [
      { id: 'msg1', user: otherUser1, text: 'This is the dedicated chat for the Plant Disease project. Let\'s discuss our findings here.', timestamp: '10:30 AM' },
      { id: 'msg5', user: AI_ASSISTANT_USER, text: 'Hello! As the Polymath AI assistant for this project, I can help. Ask me a question relevant to plant diseases by starting your message with `@ai`.', timestamp: '10:37 AM'},
    ],
    simulations: [],
    simulationConfigs: [],
    syntheticUsers: [],
    collaborators: [],
    pendingInvitations: ['alex.doe@example.com'], // Invitation for MOCK_USER
    // FIX: Added missing 'createdAt' property to conform to the Project type.
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj2',
    title: 'AI-Powered Music Generation',
    description: 'A recurrent neural network (RNN) trained on classical music compositions to generate new, original pieces in the style of Bach.',
    authorName: 'Casey Smith',
    imageUrl: 'https://picsum.photos/seed/music/400/300',
    messages: [
       { id: 'msg-p2-1', user: AI_ASSISTANT_USER, text: 'Welcome to the AI Music Generation project hub! You can ask me questions like `@ai what are the key differences between RNNs and LSTMs?`', timestamp: '11:00 AM'},
    ],
    simulations: [],
    simulationConfigs: [],
    syntheticUsers: [],
    collaborators: [],
    pendingInvitations: [],
    // FIX: Added missing 'createdAt' property to conform to the Project type.
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj3',
    title: 'Optimizing Traffic Flow with Reinforcement Learning',
    description: 'A simulation where an AI agent learns to control traffic lights to minimize congestion in a city grid. Reduces average wait times by 35%.',
    authorName: 'Taylor Riley',
    imageUrl: 'https://picsum.photos/seed/traffic/400/300',
    messages: [
       { id: 'msg-p3-1', user: AI_ASSISTANT_USER, text: 'Welcome to the Traffic Flow Optimization project hub! I am contextually aware of this project. How can I assist?', timestamp: '12:00 PM'},
    ],
    simulations: [],
    simulationConfigs: [],
    syntheticUsers: [],
    collaborators: [],
    pendingInvitations: [],
    // FIX: Added missing 'createdAt' property to conform to the Project type.
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: 'feed1',
    type: 'new-project',
    user: otherUser2,
    project: MOCK_PROJECTS[1],
    summary: 'started a new project.',
    timestamp: '2 hours ago',
  },
  {
    id: 'feed2',
    type: 'discussion',
    user: otherUser1,
    project: MOCK_PROJECTS[0],
    summary: 'posted in their project hub: "Has anyone found a good open-source dataset for potato leaf diseases?"',
    timestamp: '5 hours ago',
  },
  {
    id: 'feed3',
    type: 'milestone',
    user: { name: 'Taylor Riley', email: 'taylor@example.com', picture: 'https://i.pravatar.cc/150?u=taylor' },
    project: MOCK_PROJECTS[2],
    summary: 'reached a milestone: "Completed initial model training with 25% reduction in wait times."',
    timestamp: 'Yesterday',
  },
   {
    id: 'feed4',
    type: 'new-project',
    user: MOCK_USER,
    project: {
      id: 'proj4',
      title: 'Real-Time Language Translation with Transformers',
      description: 'Developing a lightweight transformer model for on-device translation.',
      authorName: 'Alex Doe',
      imageUrl: 'https://picsum.photos/seed/language/400/300',
      messages: [
        { id: 'msg-p4-1', user: AI_ASSISTANT_USER, text: 'Welcome to the Real-Time Language Translation project! How can I assist you?', timestamp: 'Just now'},
      ],
      simulations: [],
      simulationConfigs: [],
      syntheticUsers: [],
      collaborators: [],
      pendingInvitations: [],
      // FIX: Added missing 'createdAt' property to conform to the Project type.
      createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    summary: 'started a new project.',
    timestamp: 'Yesterday',
  },
];


export const DRIVE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 384 332.4" className="mr-3">
    <g>
      <path fill="#0066da" d="M256 0l128 221.6-64 110.8-128-221.6z"/>
      <path fill="#ffde00" d="M128 0L0 221.6l64 110.8L192 110.8z"/>
      <path fill="#26a65b" d="M85.4 243.6l-42.6 73.8L192 332.4l64-110.8-128-221.6-42.8 73.6z"/>
    </g>
  </svg>
);

export const FEED_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h9M7 16h6M7 12h6M7 8h6" />
    </svg>
);


export const EXHIBITION_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

export const PROJECTS_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

export const HUB_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V10a2 2 0 012-2h8z" />
    </svg>
);

export const PLATFORM_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

export const METASWARM_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

export const TASKS_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export const SYNTHETIC_USERS_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);


export const SETTINGS_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const NOTIFICATION_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export const SANDBOX_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm4 2a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);
