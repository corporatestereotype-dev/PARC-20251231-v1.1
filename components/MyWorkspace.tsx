
import React, { useState } from 'react';
import ExhibitionCard from './ExhibitionCard';
import ProjectForm from './ProjectForm';
import ResearchHub from './ResearchHub';
import MetaSwarmHub from './MetaSwarmHub';
import ProjectTasks from './ProjectTasks';
import { HUB_ICON, METASWARM_ICON, TASKS_ICON, AI_ASSISTANT_USER } from '../constants';
import { getAIResponse } from '../lib/ai';
import type { Project, User, Settings, ChatMessage, MetaSwarmSimulation, Task } from '../types';

interface MyWorkspaceProps {
  user: User;
  userProjects: Project[];
  onAddProject: (project: { title: string; description: string; imageUrl: string | null; tags: string[] }) => Promise<void>;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  settings: Settings;
  communityTheme: string;
}

const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
      isActive
        ? 'border-blue-500 text-white'
        : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ProjectDetailView: React.FC<{
  project: Project;
  user: User;
  settings: Settings;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onClose: () => void;
  communityTheme: string;
}> = ({ project, user, settings, onUpdateProject, onDeleteProject, onClose, communityTheme }) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'metaswarm' | 'tasks'>('hub');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project.title);
  const [editedDescription, setEditedDescription] = useState(project.description);
  const isAuthor = project.authorName === user.name;

  const handleSaveEdit = () => {
    onUpdateProject({ ...project, title: editedTitle, description: editedDescription });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(project.title);
    setEditedDescription(project.description);
    setIsEditing(false);
  };

  const handleDelete = () => {
      if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
          onDeleteProject(project.id);
      }
  };

  const handleExportProjectData = () => {
    // Tasks are stored separately in localStorage, so we need to fetch them.
    const storageKey = `parc-tasks-${project.id}`;
    const savedTasksRaw = localStorage.getItem(storageKey);
    const tasks = savedTasksRaw ? JSON.parse(savedTasksRaw) : [];

    const exportData = {
      ...project,
      tasks,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    link.download = `parc-project-${project.title.replace(/\s/g, '_')}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddMessage = async (text: string) => {
    if (!user || text.trim() === '') return;
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      user,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    let updatedMessages = [...project.messages, userMessage];

    if (text.toLowerCase().startsWith('@ai')) {
      const prompt = text.substring(3).trim();
      const thinkingId = `msg-ai-thinking-${Date.now()}`;
      const thinkingMessage: ChatMessage = {
        id: thinkingId,
        user: AI_ASSISTANT_USER,
        text: 'Thinking...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updatedMessages.push(thinkingMessage);
      onUpdateProject({ ...project, messages: updatedMessages });

      try {
        const storageKey = `parc-tasks-${project.id}`;
        const savedTasksRaw = localStorage.getItem(storageKey);
        const tasks: Task[] = savedTasksRaw ? JSON.parse(savedTasksRaw) : [];

        const aiResponseText = await getAIResponse(prompt, settings, { 
            title: project.title, 
            description: project.description,
            messages: project.messages,
            tasks,
        });
        const aiMessage: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          user: AI_ASSISTANT_USER,
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        onUpdateProject({ ...project, messages: updatedMessages.map(m => (m.id === thinkingId ? aiMessage : m)) });
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: `msg-ai-error-${Date.now()}`,
          user: AI_ASSISTANT_USER,
          text: `Sorry, I encountered an error. ${(err as Error).message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        onUpdateProject({ ...project, messages: updatedMessages.map(m => (m.id === thinkingId ? errorMessage : m)) });
      }
    } else {
        onUpdateProject({ ...project, messages: updatedMessages });
    }
  };
  
  const handleRunSimulation = async (metaprompt: string, log: string, script: string, report: string) => {
      const newSimulation: MetaSwarmSimulation = {
        id: `sim-${Date.now()}`,
        metaprompt,
        script,
        log,
        report,
        timestamp: new Date().toISOString(),
      };
      const updatedSimulations = [newSimulation, ...project.simulations];
      onUpdateProject({ ...project, simulations: updatedSimulations });
  };


  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="flex justify-between items-start mb-4">
        {isEditing ? (
          <div className="flex-grow space-y-4">
            <input
              type="text"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-3xl font-bold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <textarea
              value={editedDescription}
              onChange={e => setEditedDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        ) : (
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-slate-100">{project.title}</h2>
            <p className="text-slate-400 mt-1">{project.description}</p>
          </div>
        )}
        <div className="flex-shrink-0 ml-6 text-right space-y-2">
            <div className="flex gap-2 justify-end">
                {isEditing ? (
                    <>
                        <button onClick={handleSaveEdit} className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Save</button>
                        <button onClick={handleCancelEdit} className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Cancel</button>
                    </>
                ) : (
                    isAuthor && (
                        <>
                            <button onClick={handleExportProjectData} className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Export</button>
                            <button onClick={() => setIsEditing(true)} className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Edit</button>
                            <button onClick={handleDelete} className="text-sm bg-red-800 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">Delete</button>
                        </>
                    )
                )}
            </div>
            <button onClick={onClose} className="text-sm text-blue-400 hover:underline">&larr; Back to Workspace</button>
        </div>
      </div>

       {project.tags && project.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="bg-slate-700 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

      {project.collaborators && project.collaborators.length > 0 && (
        <div className="my-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Collaborators</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-4">
            {project.collaborators.map(c => (
                <div key={c.email} className="text-center w-20" title={c.name}>
                <img src={c.picture} alt={c.name} className="w-16 h-16 rounded-full mx-auto mb-2 ring-2 ring-slate-600" />
                <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
                </div>
            ))}
            </div>
        </div>
      )}

      {project.syntheticUsers && project.syntheticUsers.length > 0 && (
        <div className="my-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Project Team (AI)</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-4">
            {project.syntheticUsers.map(su => (
                <div key={su.id} className="text-center w-20" title={`${su.name}: ${su.personaSummary}`}>
                <img src={su.avatarUrl} alt={su.name} className="w-16 h-16 rounded-full mx-auto mb-2 ring-2 ring-slate-600 transition-transform hover:scale-110" />
                <p className="text-sm font-medium text-slate-200 truncate">{su.name}</p>
                </div>
            ))}
            </div>
        </div>
      )}

      <div className="border-b border-slate-700 flex items-center mb-4">
        <TabButton icon={HUB_ICON} label="Research Hub" isActive={activeTab === 'hub'} onClick={() => setActiveTab('hub')} />
        <TabButton icon={METASWARM_ICON} label="MetaSwarm Hub" isActive={activeTab === 'metaswarm'} onClick={() => setActiveTab('metaswarm')} />
        <TabButton icon={TASKS_ICON} label="Project Tasks" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
      </div>

      <div>
        {activeTab === 'hub' && <ResearchHub user={user} messages={project.messages} onAddMessage={handleAddMessage} />}
        {activeTab === 'metaswarm' && <MetaSwarmHub project={project} settings={settings} onRunSimulation={handleRunSimulation} onUpdateProject={onUpdateProject} communityTheme={communityTheme} />}
        {activeTab === 'tasks' && <ProjectTasks projectId={project.id} />}
      </div>
    </div>
  );
};

const MyWorkspace: React.FC<MyWorkspaceProps> = ({ user, userProjects, onAddProject, onUpdateProject, onDeleteProject, settings, communityTheme }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = userProjects.find(p => p.id === selectedProjectId);

  if (selectedProject) {
    return (
      <ProjectDetailView 
        project={selectedProject}
        user={user}
        settings={settings}
        onUpdateProject={onUpdateProject}
        onDeleteProject={onDeleteProject}
        onClose={() => setSelectedProjectId(null)}
        communityTheme={communityTheme}
      />
    );
  }

  return (
    <section>
      <h1 className="text-4xl font-bold text-center text-slate-100 mb-10">My Workspace</h1>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-1">
           <ProjectForm onAddProject={onAddProject} settings={settings} />
        </div>

        <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Your Projects ({userProjects.length})</h2>
             {userProjects.length > 0 ? (
                <div className="space-y-4">
                {userProjects.map(project => (
                  <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className="w-full text-left hover:bg-slate-800/50 rounded-lg transition-colors">
                    <ExhibitionCard project={project} />
                  </button>
                ))}
                </div>
            ) : (
                <div className="text-center bg-slate-800 p-8 rounded-lg">
                    <p className="text-slate-400">You haven't created any projects yet. Use the form to start your first one!</p>
                </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default MyWorkspace;
