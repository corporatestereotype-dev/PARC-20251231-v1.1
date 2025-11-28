import React, { useState, useCallback } from 'react';
import Header from './Header';
import CodeBlock from './CodeBlock';
import { SYNTHETIC_USERS_ICON } from '../constants';
import { runSyntheticUserWorkflow } from '../lib/ai';
import type { Settings, SyntheticUser, SyntheticUserWorkflowResult, Community } from '../types';

const DOMAINS = [
  { id: 'neuroscience', name: 'Neuroscience', x: 100, y: 50 },
  { id: 'ai-ethics', name: 'AI Ethics', x: 250, y: 50 },
  { id: 'quantum-computing', name: 'Quantum Computing', x: 400, y: 50 },
  { id: 'complex-systems', name: 'Complex Systems', x: 100, y: 150 },
  { id: 'materials-science', name: 'Materials Science', x: 250, y: 150 },
  { id: 'drug-discovery', name: 'Drug Discovery', x: 400, y: 150 },
  { id: 'climate-modeling', name: 'Climate Modeling', x: 250, y: 250 },
];

const CONNECTIONS = [
  { from: 'neuroscience', to: 'ai-ethics' },
  { from: 'neuroscience', to: 'complex-systems' },
  { from: 'ai-ethics', to: 'complex-systems' },
  { from: 'quantum-computing', to: 'materials-science' },
  { from: 'quantum-computing', to: 'complex-systems' },
  { from: 'materials-science', to: 'drug-discovery' },
  { from: 'complex-systems', to: 'climate-modeling' },
  { from: 'complex-systems', to: 'materials-science' },
];

const DomainGraph: React.FC<{
  selectedDomains: string[];
  onToggleDomain: (domainId: string) => void;
}> = ({ selectedDomains, onToggleDomain }) => {
  const domainMap = new Map(DOMAINS.map(d => [d.id, d]));
  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
        <svg viewBox="0 0 500 300" className="w-full h-auto">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                </marker>
            </defs>
            {CONNECTIONS.map(({ from, to }, index) => {
                const fromNode = domainMap.get(from);
                const toNode = domainMap.get(to);
                if (!fromNode || !toNode) return null;
                return (
                    <line
                        key={index}
                        x1={fromNode.x} y1={fromNode.y}
                        x2={toNode.x} y2={toNode.y}
                        stroke="#475569"
                        strokeWidth="1.5"
                    />
                );
            })}
            {DOMAINS.map(domain => {
                const isSelected = selectedDomains.includes(domain.id);
                return (
                    <g
                        key={domain.id}
                        transform={`translate(${domain.x}, ${domain.y})`}
                        onClick={() => onToggleDomain(domain.id)}
                        className="cursor-pointer group"
                        aria-label={`Select domain: ${domain.name}`}
                        role="button"
                    >
                        <circle
                            r="12"
                            fill={isSelected ? '#3b82f6' : '#1e293b'}
                            stroke={isSelected ? '#60a5fa' : '#334155'}
                            strokeWidth="2"
                            className="transition-all"
                        />
                        <text
                            textAnchor="middle"
                            y="28"
                            className="text-xs font-semibold fill-slate-300 group-hover:fill-white transition-all"
                        >
                            {domain.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    </div>
  );
};

const UserCard: React.FC<{ user: SyntheticUser }> = ({ user }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center text-center">
        <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full mb-3 ring-2 ring-slate-600" />
        <h4 className="font-bold text-slate-100">{user.name}</h4>
        <p className="text-sm text-slate-400 mt-1">{user.personaSummary}</p>
    </div>
);


interface SyntheticUsersWorkflowProps {
    settings: Settings;
    community: Community | null;
}

const SyntheticUsersWorkflow: React.FC<SyntheticUsersWorkflowProps> = ({ settings, community }) => {
    const [userCount, setUserCount] = useState<number>(50);
    const [duration, setDuration] = useState<number>(240);
    const [selectedDomains, setSelectedDomains] = useState<string[]>(['ai-ethics', 'complex-systems']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SyntheticUserWorkflowResult | null>(null);

    const handleToggleDomain = useCallback((domainId: string) => {
        setSelectedDomains(prev =>
            prev.includes(domainId)
                ? prev.filter(id => id !== domainId)
                : [...prev, domainId]
        );
    }, []);

    const handleRun = async () => {
        if (selectedDomains.length === 0) {
            setError("Please select at least one research domain.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const { users, report } = await runSyntheticUserWorkflow(
                userCount,
                duration,
                selectedDomains,
                settings,
                community?.themeDescription
            );
            
            const generatedUsers: SyntheticUser[] = users.map((u, i) => ({
                ...u,
                id: `su-${Date.now()}-${i}`,
                avatarUrl: `https://i.pravatar.cc/150?u=${u.name.replace(/\s/g, '')}`
            }));

            setResult({
                id: `res-${Date.now()}`,
                timestamp: new Date().toISOString(),
                settings: { userCount, duration, domains: selectedDomains },
                generatedUsers,
                report
            });

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section className="max-w-7xl mx-auto">
            <Header
                icon={SYNTHETIC_USERS_ICON}
                title="Synthetic User Genesis Workflow"
                subtitle="Define parameters to generate a cohort of synthetic researchers and simulate their interaction with the core AI to uncover insights and drive improvements."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-slate-800 p-8 rounded-lg shadow-lg space-y-6">
                    <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-3">1. Configure Simulation</h2>
                     {community && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400">
                                This simulation will run within the context of your active community: <strong className="text-blue-400">{community.name}</strong>.
                            </p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="user-count" className="block text-sm font-medium text-slate-300 mb-2">Number of Synthetic Users: <span className="font-bold text-blue-400">{userCount}</span></label>
                        <input
                            id="user-count"
                            type="range"
                            min="10"
                            max="1000"
                            step="10"
                            value={userCount}
                            onChange={e => setUserCount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-2">Simulation Duration (minutes)</label>
                        <input
                            type="number"
                            id="duration"
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="e.g., 240"
                        />
                    </div>
                     <button
                        onClick={handleRun}
                        disabled={isLoading || selectedDomains.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                        {isLoading ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running Genesis Workflow...
                            </>
                        ) : "Start Genesis Workflow"}
                    </button>
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white">2. Select Research Domains</h2>
                    <DomainGraph selectedDomains={selectedDomains} onToggleDomain={handleToggleDomain} />
                </div>
            </div>

            {error && (
                <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                    <p className="font-bold">An Error Occurred</p>
                    <p>{error}</p>
                </div>
            )}
            
            {isLoading && (
                 <div className="mt-8 text-center">
                    <p className="text-slate-400">Spawning synthetic researchers, building persona models, and initiating interactions...</p>
                    <p className="text-sm text-slate-500">This may take a moment.</p>
                </div>
            )}

            {result && (
                <div className="mt-12 space-y-8 bg-slate-800/40 p-8 rounded-lg border border-slate-700">
                    <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Workflow Results</h2>
                    
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4">Generated Researchers ({result.generatedUsers.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {result.generatedUsers.map(user => (
                                <UserCard key={user.id} user={user} />
                            ))}
                        </div>
                    </div>
                    
                    <div>
                         <h3 className="text-2xl font-bold text-white mb-4">Workflow Summary Report</h3>
                         <CodeBlock title={`Report ID: ${result.id}`} content={result.report} language="markdown" />
                    </div>
                </div>
            )}
        </section>
    );
};

export default SyntheticUsersWorkflow;