

export interface User {
  name: string;
  email: string;
  picture: string;
}

export interface MetaSwarmSimulation {
  id: string;
  metaprompt: string;
  script: string;
  log: string;
  report: string;
  timestamp: string;
}

export interface SimulationConfig {
  id:string;
  name: string;
  metaprompt: string;
  agentRoles: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  authorName: string;
  imageUrl: string;
  messages: ChatMessage[];
  simulations: MetaSwarmSimulation[];
  simulationConfigs: SimulationConfig[];
  syntheticUsers?: SyntheticUser[];
  collaborators?: User[];
  pendingInvitations?: string[]; // Array of user emails
  tags?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id:string;
  user: User;
  text: string;
  timestamp: string;
}

export type AIProvider = 'gemini' | 'ollama';
export type StorageProvider = 'google-drive' | 'local-storage' | 'dropbox' | 'one-drive';

// New types for the local Docker sandbox
export type SandboxStatus = 'stopped' | 'running' | 'loading' | 'error';

export interface SandboxState {
  status: SandboxStatus;
  logs: string[];
}

export interface SandboxConfig {
  imageName: string;
  runCommand: string;
}

export interface Settings {
  aiProvider: AIProvider;
  ollamaModel: string;
  storageProvider: StorageProvider;
  storagePath: string;
  sandboxConfig: SandboxConfig;
}

export type FeedItemType = 'new-project' | 'discussion' | 'milestone';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  user: User;
  project: Project;
  summary: string;
  timestamp: string;
}


export type View = 'platform-structure' | 'feed' | 'projects' | 'workspace' | 'synthetic-users' | 'research-hub' | 'metaswarm';

export interface SyntheticUser {
  id: string;
  name: string;
  avatarUrl: string;
  personaSummary: string;
}

export interface SyntheticUserWorkflowResult {
  id:string;
  timestamp: string;
  settings: {
    userCount: number;
    duration: number;
    domains: string[];
  };
  generatedUsers: SyntheticUser[];
  report: string;
}

// Types for Autonomous Simulation
// FIX: Add d3-force properties to GraphNode to make it compatible with d3.SimulationNodeDatum
export interface GraphNode {
  id: string;
  label: string;
  domain: string;
  // d3-force properties
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

// FIX: Allow source and target to be string or GraphNode for d3 simulation
export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

export interface GraphChange {
  newNodes?: GraphNode[];
  newLinks?: GraphLink[];
}

// Types for Researcher Repositories
export type RepositoryFileType = 'script' | 'dataset' | 'report' | 'code' | 'document' | 'image' | 'audio' | 'video';

export interface RepositoryFile {
  path: string; // e.g., "experiments/run_simulation.py"
  content: string;
  type: RepositoryFileType;
}

export interface RepositoryCommit {
  message: string;
  files: RepositoryFile[];
}

export interface SimulationEvent {
  timestamp: number;
  summary: string;
  details: string;
  triggeredBy: string; // Name of the synthetic user
  affectedDomains: string[];
  graphChanges: GraphChange;
  repositoryCommit?: RepositoryCommit;
}

export interface AutonomousSimulationResult {
  simulationTitle: string;
  researchDomains: string[];
  generatedUsers: Omit<SyntheticUser, 'id' | 'avatarUrl'>[];
  simulationTimeline: SimulationEvent[];
  finalReport: string;
}

// Types for Project Tasks
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string; // Stored as 'YYYY-MM-DD'
}


// New types for Community Configuration
export interface CommunityStyle {
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-tertiary': string;
  '--border-primary': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-accent': string;
  '--accent-primary': string;
  '--accent-primary-hover': string;
}

export interface Community {
  id: string;
  name: string;
  themeDescription: string;
  style: CommunityStyle;
  // State that was previously global
  projects: Project[];
  feedItems: FeedItem[];
  globalMessages: ChatMessage[];
  foundingMembers: SyntheticUser[]; // Community-level AI users
}