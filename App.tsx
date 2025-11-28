

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import ProjectDirectory from './components/ProjectDirectory';
import MyWorkspace from './components/MyWorkspace';
import SettingsModal from './components/SettingsModal';
import PlatformStructure from './components/PlatformStructure';
import Feed from './components/Feed';
import SyntheticUsersWorkflow from './components/SyntheticUsersWorkflow';
import AutonomousMode from './components/AutonomousMode';
import AutonomousModeSetupModal from './components/AutonomousModeSetupModal';
import ResearchHubPage from './components/ResearchHubPage';
import MetaSwarmHubPage from './components/MetaSwarmHubPage';
import CommunitySetupWizard from './components/CommunitySetupWizard';
import CommunityManagerModal from './components/CommunityManagerModal';
import { MOCK_USER, AI_ASSISTANT_USER } from './constants';
import { generateProjectTeam } from './lib/ai';
import { applyTheme, DEFAULT_STYLE } from './lib/theme';
import type { User, Project, Settings, View, FeedItem, ChatMessage, AutonomousSimulationResult, Community, SandboxState } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('feed');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommunityManagerOpen, setIsCommunityManagerOpen] = useState(false);

  // Community State
  const [communities, setCommunities] = useState<Community[] | null>(null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  
  const [isAutonomySetupModalOpen, setIsAutonomySetupModalOpen] = useState(false);
  const [isAutonomousModeActive, setIsAutonomousModeActive] = useState(false);
  const [autonomousSimulation, setAutonomousSimulation] = useState<AutonomousSimulationResult | null>(null);
  const [autonomyEndTime, setAutonomyEndTime] = useState<number | null>(null);

  // Local Sandbox State
  const [sandboxState, setSandboxState] = useState<SandboxState>({ status: 'stopped', logs: [] });

  // Load communities from localStorage on initial boot
  useEffect(() => {
    try {
      const savedCommunities = localStorage.getItem('parc-communities');
      const savedActiveId = localStorage.getItem('parc-active-community-id');
      if (savedCommunities) {
        setCommunities(JSON.parse(savedCommunities));
        setActiveCommunityId(savedActiveId);
      } else {
        setCommunities([]); // First time user
      }
    } catch (error) {
      console.error("Failed to parse communities from localStorage", error);
      setCommunities([]);
    }
  }, []);

  const activeCommunity = useMemo(() => {
    if (!communities || !activeCommunityId) return null;
    return communities.find(c => c.id === activeCommunityId);
  }, [communities, activeCommunityId]);

  // Apply theme when active community changes
  useEffect(() => {
    if (activeCommunity) {
      applyTheme(activeCommunity.style);
    } else {
      applyTheme(DEFAULT_STYLE); // Apply default if no community is active
    }
  }, [activeCommunity]);

  useEffect(() => {
      try {
        const savedSim = localStorage.getItem('parc-autonomous-simulation');
        if (savedSim) {
            setAutonomousSimulation(JSON.parse(savedSim));
        }
      } catch (error) {
          console.error("Failed to parse autonomous simulation from localStorage", error);
          localStorage.removeItem('parc-autonomous-simulation');
      }
  }, []);

  // Settings are now global, not per-community
  const [settings, setSettings] = useState<Settings>(() => {
    const defaults: Settings = {
      aiProvider: 'gemini',
      ollamaModel: 'llama3',
      storageProvider: 'google-drive',
      storagePath: 'PARC_Data/',
      sandboxConfig: {
          imageName: 'us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.1.2',
          runCommand: 'docker run -d --name ASISafeSandbox -v "~/ASISafeSandbox:/" --user nobody --workdir ~/ASISafeSandbox us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.1.2 bash -c "echo \'Sandbox ready.\'; tail -f /dev/null"'
      }
    };
    try {
      const savedSettings = localStorage.getItem('parc-settings');
      return savedSettings ? { ...defaults, ...JSON.parse(savedSettings) } : defaults;
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
      return defaults;
    }
  });

  const updateCommunities = useCallback((updatedCommunities: Community[], newActiveId?: string) => {
    setCommunities(updatedCommunities);
    localStorage.setItem('parc-communities', JSON.stringify(updatedCommunities));
    if (newActiveId) {
      setActiveCommunityId(newActiveId);
      localStorage.setItem('parc-active-community-id', newActiveId);
    }
  }, []);
  
  const handleInitialSetupComplete = (newCommunity: Community) => {
    updateCommunities([newCommunity], newCommunity.id);
    setUser(MOCK_USER); // Automatically log in mock user after first setup
    setView('feed');
  };
  
  const handleCreateNewCommunity = (newCommunity: Community) => {
      if (!communities) return;
      updateCommunities([...communities, newCommunity], newCommunity.id);
      setIsCommunityManagerOpen(false);
      setView('feed');
  };

  const handleSwitchCommunity = (communityId: string) => {
      setActiveCommunityId(communityId);
      localStorage.setItem('parc-active-community-id', communityId);
      setIsCommunityManagerOpen(false);
      setView('feed'); // Reset to a safe default view on switch
  };

  const handleLogin = () => {
    setUser(MOCK_USER);
    if (!activeCommunityId && communities && communities.length > 0) {
      // If logged in without an active community, default to the first one
      setActiveCommunityId(communities[0].id);
    }
    setView('feed');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveCommunityId(null);
    localStorage.removeItem('parc-active-community-id');
    setView('platform-structure');
    setIsAutonomousModeActive(false); 
    localStorage.removeItem('parc-autonomous-simulation');
    setAutonomousSimulation(null);
    setAutonomyEndTime(null);
  };
  
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('parc-settings', JSON.stringify(newSettings));
  };

  const handleStartSandbox = () => {
      setSandboxState({ status: 'loading', logs: ['Attempting to start sandbox via local PARC bridge service...'] });
      setTimeout(() => {
          setSandboxState({ status: 'running', logs: ['Sandbox started successfully.', 'Container ID: mock-container-12345', 'Listening for commands...'] });
      }, 2000);
  };

  const handleStopSandbox = () => {
      setSandboxState({ status: 'loading', logs: [...sandboxState.logs, 'Stopping sandbox...'] });
      setTimeout(() => {
           setSandboxState({ status: 'stopped', logs: [] });
      }, 1500);
  };

  const updateActiveCommunity = useCallback((updater: (community: Community) => Community) => {
      setCommunities(prevCommunities => {
          if (!prevCommunities || !activeCommunityId) return prevCommunities;
          
          const newCommunities = prevCommunities.map(c => {
              if (c.id === activeCommunityId) {
                  return updater(c);
              }
              return c;
          });

          localStorage.setItem('parc-communities', JSON.stringify(newCommunities));
          return newCommunities;
      });
  }, [activeCommunityId]);

  const handleUpdateProject = (updatedProject: Project) => {
    updateActiveCommunity(community => ({
        ...community,
        projects: community.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    }));
  };
  
  const handleAutonomousSimulationUpdate = (result: AutonomousSimulationResult) => {
      setAutonomousSimulation(result);
      localStorage.setItem('parc-autonomous-simulation', JSON.stringify(result));
  };
  
  const handleResetAutonomousSimulation = () => {
      setAutonomousSimulation(null);
      localStorage.removeItem('parc-autonomous-simulation');
  };

  const handleAuthorizeAutonomy = (durationMs: number | null) => {
    if (durationMs) {
      setAutonomyEndTime(Date.now() + durationMs);
    } else {
      setAutonomyEndTime(null);
    }
    setIsAutonomousModeActive(true);
    setIsAutonomySetupModalOpen(false);
    setIsSettingsOpen(false);
  };
  
  const handleFinishAutonomy = useCallback(() => {
    setIsAutonomousModeActive(false);
    setAutonomyEndTime(null);
    setView('workspace');
  }, []);

  const handleAddProject = async (newProject: { title: string; description: string; imageUrl: string | null; tags: string[] }) => {
    if (!user || !activeCommunity) return;
    
    const initialMessage: ChatMessage = {
      id: `msg-initial-${Date.now()}`,
      user: AI_ASSISTANT_USER,
      text: `Welcome to the "${newProject.title}" project hub! I'm your context-aware AI assistant. How can I help you get started?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const project: Project = {
      id: `proj-${Date.now()}`,
      authorName: user.name,
      imageUrl: newProject.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/300`,
      messages: [initialMessage],
      simulations: [],
      simulationConfigs: [],
      syntheticUsers: [],
      collaborators: [user],
      pendingInvitations: [],
      title: newProject.title,
      description: newProject.description,
      tags: newProject.tags,
      createdAt: new Date().toISOString(),
    };

    const newFeedItem: FeedItem = {
      id: `feed-${Date.now()}`,
      type: 'new-project',
      user,
      project,
      summary: 'started a new project.',
      timestamp: 'Just now'
    };

    updateActiveCommunity(community => ({
        ...community,
        projects: [project, ...community.projects],
        feedItems: [newFeedItem, ...community.feedItems]
    }));
    
    setView('workspace');

    try {
        const generatedTeam = await generateProjectTeam({ 
            title: newProject.title, 
            description: newProject.description, 
            tags: newProject.tags 
        }, settings);
        
        const syntheticUsers = generatedTeam.map((u, i) => ({
            ...u,
            id: `su-${project.id}-${i}`,
            avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(u.name)}`
        }));
        
        updateActiveCommunity(community => ({
            ...community,
            projects: community.projects.map(p => 
                p.id === project.id ? { ...p, syntheticUsers } : p
            )
        }));
    } catch (error) {
        console.error("Failed to generate project team:", error);
    }
  };

  const handleAddGlobalMessage = (text: string) => {
    if (!user || !activeCommunity) return;
    const userMessage: ChatMessage = {
        id: `g-msg-${Date.now()}`,
        user,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateActiveCommunity(community => ({
        ...community,
        globalMessages: [...community.globalMessages, userMessage]
    }));

    // Mock AI response from a founding member
    setTimeout(() => {
        updateActiveCommunity(community => {
            const aiMember = community.foundingMembers[Math.floor(Math.random() * community.foundingMembers.length)];
            if (!aiMember) return community;

            const aiResponse: ChatMessage = {
                id: `g-msg-ai-${Date.now()}`,
                user: { // Create a User object from the SyntheticUser
                    name: aiMember.name,
                    email: `${aiMember.name.toLowerCase().replace(/\s/g, '.')}@parc.ai`,
                    picture: aiMember.avatarUrl,
                },
                text: `That's an interesting point, ${user.name}. Relating to my focus on ${aiMember.personaSummary.toLowerCase()}, I've found that... (this is a mock response)`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            return {
                ...community,
                globalMessages: [...community.globalMessages, aiResponse]
            };
        });
    }, 1500 + Math.random() * 2000);
  };

  const handleAcceptInvitation = (projectId: string) => {
      if (!user) return;
      const project = activeCommunity?.projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedProject: Project = {
          ...project,
          pendingInvitations: (project.pendingInvitations || []).filter(email => email !== user.email),
          collaborators: [...(project.collaborators || []), user],
      };
      handleUpdateProject(updatedProject);
      setView('workspace'); 
  };

  const handleDeclineInvitation = (projectId: string) => {
      if (!user) return;
       const project = activeCommunity?.projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedProject: Project = {
          ...project,
          pendingInvitations: (project.pendingInvitations || []).filter(email => email !== user.email),
      };
      handleUpdateProject(updatedProject);
  };

  const handleDeleteProject = (projectId: string) => {
      updateActiveCommunity(community => ({
          ...community,
          projects: community.projects.filter(p => p.id !== projectId),
          feedItems: community.feedItems.filter(item => item.project.id !== projectId)
      }));
  };


  if (isAutonomousModeActive) {
    return <AutonomousMode 
             settings={settings} 
             simulationResult={autonomousSimulation}
             onUpdate={handleAutonomousSimulationUpdate}
             onReset={handleResetAutonomousSimulation}
             isTimed={autonomyEndTime !== null}
             endTime={autonomyEndTime}
             onFinish={handleFinishAutonomy}
           />;
  }
  
  if (communities === null) {
      return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">Loading...</div>;
  }
  
  if (communities.length === 0) {
      return <CommunitySetupWizard onComplete={handleInitialSetupComplete} isInitialSetup={true} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }
  
  if (!activeCommunity) {
      // This can happen if user is logged in but active community was deleted or is invalid
      // We should show them the community manager to select a community
      return (
          <CommunityManagerModal 
            isOpen={true}
            onClose={() => {}}
            communities={communities}
            activeCommunityId={activeCommunityId}
            onSwitch={handleSwitchCommunity}
            onCreated={handleCreateNewCommunity}
          />
      )
  }

  const renderView = () => {
    const userProjects = activeCommunity.projects.filter(p => p.authorName === user.name || p.collaborators?.some(c => c.email === user.email));
    switch (view) {
      case 'platform-structure':
        return <PlatformStructure />;
      case 'synthetic-users':
        return <SyntheticUsersWorkflow settings={settings} community={activeCommunity} />;
      case 'research-hub':
        return <ResearchHubPage user={user} messages={activeCommunity.globalMessages} onAddMessage={handleAddGlobalMessage} onlineUsers={activeCommunity.foundingMembers} />;
      case 'metaswarm':
        return <MetaSwarmHubPage settings={settings} community={activeCommunity} />;
      case 'workspace':
        return <MyWorkspace 
                  user={user}
                  userProjects={userProjects} 
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  settings={settings}
                  onDeleteProject={handleDeleteProject}
                  communityTheme={activeCommunity.themeDescription}
                />;
      case 'projects':
        return <ProjectDirectory projects={activeCommunity.projects} />;
      case 'feed':
      default:
        return <Feed items={activeCommunity.feedItems} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Navbar
        user={user}
        setView={setView}
        onLogout={handleLogout}
        activeView={view}
        onOpenSettings={() => setIsSettingsOpen(true)}
        projects={activeCommunity.projects}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
      />
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
       <footer className="text-center mt-8 py-6 border-t border-[var(--border-primary)]">
          <p className="text-[var(--text-secondary)]">
            Polymath AI Research Community (PARC). A platform for collaborative research.
          </p>
        </footer>
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
          onEngageAutonomy={() => {
            setIsSettingsOpen(false);
            setIsAutonomySetupModalOpen(true);
          }}
          onOpenCommunityManager={() => {
              setIsSettingsOpen(false);
              setIsCommunityManagerOpen(true);
          }}
          sandboxState={sandboxState}
          onStartSandbox={handleStartSandbox}
          onStopSandbox={handleStopSandbox}
        />
        <CommunityManagerModal 
          isOpen={isCommunityManagerOpen}
          onClose={() => setIsCommunityManagerOpen(false)}
          communities={communities}
          activeCommunityId={activeCommunityId}
          onSwitch={handleSwitchCommunity}
          onCreated={handleCreateNewCommunity}
        />
        <AutonomousModeSetupModal
          isOpen={isAutonomySetupModalOpen}
          onClose={() => setIsAutonomySetupModalOpen(false)}
          onAuthorize={handleAuthorizeAutonomy}
        />
    </div>
  );
};

export default App;