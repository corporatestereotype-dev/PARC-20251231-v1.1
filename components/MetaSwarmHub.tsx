import React, { useState } from 'react';
import CodeBlock from './CodeBlock';
import UseCaseCard from './UseCaseCard';
import { generateSimulationScript, generateSwarmReport, generateSimulationLog } from '../lib/ai';
import type { Settings, Project, SimulationConfig } from '../types';

const useCases = [
    {
        title: "Design a framework for ethical AI decision-making",
        prompt: "Hypothesize a multi-layered framework for an AI system that can make ethical decisions under uncertainty. The framework should include components for value alignment, consequence prediction, and explainability. Generate a simulation plan to test the framework's robustness."
    },
    {
        title: "Analyze circular dependencies in a complex software project",
        prompt: "Model a large-scale software project with multiple microservices as a knowledge graph. Use the Iterative Knowledge Graph Construction to identify hidden circular dependencies and critical path instabilities. Propose a refactoring plan to improve system stability."
    },
    {
        title: "Simulate population dynamics with predator-prey fractal insights",
        prompt: "Simulate a predator-prey ecosystem using the Lorenz attractor model. Use the ChaosTheoryModule to identify chaotic patterns and apply FOZ stabilization to forecast population changes. The goal is to find stable states for both populations."
    }
]

interface MetaSwarmHubProps {
    project: Project;
    settings: Settings;
    onRunSimulation: (metaprompt: string, log: string, script: string, report: string) => void;
    onUpdateProject: (project: Project) => void;
    communityTheme: string;
}

const MetaSwarmHub: React.FC<MetaSwarmHubProps> = ({ project, settings, onRunSimulation, onUpdateProject, communityTheme }) => {
    const [metaprompt, setMetaprompt] = useState<string>('');
    const [agentRoles, setAgentRoles] = useState<string>('');
    const [configName, setConfigName] = useState<string>('');
    const [simulationScript, setSimulationScript] = useState<string>('');
    const [simulationLog, setSimulationLog] = useState<string>('');
    const [report, setReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSaveConfig = () => {
        if (!configName.trim() || !metaprompt.trim()) return;

        const newConfig: SimulationConfig = {
            id: `config-${Date.now()}`,
            name: configName.trim(),
            metaprompt: metaprompt.trim(),
            agentRoles: agentRoles.trim(),
        };
        const updatedConfigs = [...(project.simulationConfigs || []), newConfig];
        onUpdateProject({ ...project, simulationConfigs: updatedConfigs });
        setConfigName('');
    };

    const handleLoadConfig = (config: SimulationConfig) => {
        setMetaprompt(config.metaprompt);
        setAgentRoles(config.agentRoles);
    };

    const handleDeleteConfig = (configId: string) => {
        if (window.confirm('Are you sure you want to delete this configuration?')) {
            const updatedConfigs = (project.simulationConfigs || []).filter(c => c.id !== configId);
            onUpdateProject({ ...project, simulationConfigs: updatedConfigs });
        }
    };

    const handleRunSimulation = async () => {
        if (!metaprompt) return;
        setIsLoading(true);
        setError(null);
        setSimulationScript('');
        setSimulationLog('');
        setReport('');

        try {
            const projectContext = { title: project.title, description: project.description };
            
            const script = await generateSimulationScript(metaprompt, agentRoles, settings, projectContext, communityTheme);
            setSimulationScript(script);

            const log = await generateSimulationLog(metaprompt, script, settings, communityTheme);
            setSimulationLog(log);

            const finalReport = await generateSwarmReport(metaprompt, log, settings, projectContext, communityTheme);
            setReport(finalReport);
            
            onRunSimulation(metaprompt, log, script, finalReport);

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseCaseClick = (prompt: string) => {
        setMetaprompt(prompt);
        setAgentRoles('');
        setSimulationScript('');
        setSimulationLog('');
        setReport('');
        setError(null);
    }
    
    return (
        <section>
            <div className="bg-slate-800/40 p-8 rounded-lg border border-slate-700">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">1. Define Metaprompt</h2>
                        <p className="text-slate-400 mb-4">Define a high-level objective for the MetaSwarm to analyze within the context of your project, or select a use-case.</p>
                        <textarea
                            value={metaprompt}
                            onChange={(e) => setMetaprompt(e.target.value)}
                            placeholder="e.g., 'Develop a strategy to stabilize a chaotic financial market model using an adaptive epsilon.'"
                            className="w-full h-32 bg-slate-700 border border-slate-600 rounded-md p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                            aria-label="Metaprompt Input"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {useCases.map(uc => <UseCaseCard key={uc.title} title={uc.title} onClick={() => handleUseCaseClick(uc.prompt)} />)}
                        </div>
                    </div>

                    <div>
                         <h2 className="text-2xl font-bold mb-2">2. Define Agent Roles (Optional)</h2>
                         <p className="text-slate-400 mb-4">Specify the roles and responsibilities for different agents in the simulation.</p>
                         <textarea
                            value={agentRoles}
                            onChange={(e) => setAgentRoles(e.target.value)}
                            placeholder="e.g., 'Agent 1: Data Analyst - Responsible for fetching and cleaning market data.&#10;Agent 2: Risk Assessor - Evaluates potential risks based on data.'"
                            className="w-full h-24 bg-slate-700 border border-slate-600 rounded-md p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                            aria-label="Agent Roles Input"
                        />
                    </div>
                    
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">Manage Configurations</h3>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <input
                                type="text"
                                value={configName}
                                onChange={(e) => setConfigName(e.target.value)}
                                placeholder="New Configuration Name"
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                aria-label="Configuration name"
                            />
                            <button
                                onClick={handleSaveConfig}
                                disabled={!configName || !metaprompt}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                Save Current
                            </button>
                        </div>
                        {project.simulationConfigs && project.simulationConfigs.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-300 mb-2">Load Saved Configuration</h4>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                    {project.simulationConfigs.map(config => (
                                        <div key={config.id} className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex justify-between items-center gap-2">
                                            <p className="font-medium text-slate-200 truncate" title={config.name}>{config.name}</p>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => handleLoadConfig(config)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Load</button>
                                                <button onClick={() => handleDeleteConfig(config.id)} className="text-sm bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold mb-2">3. Run Simulation</h2>
                         <button
                            onClick={handleRunSimulation}
                            disabled={isLoading || !metaprompt}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8
 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Running Simulation...
                                </>
                            ) : (
                               "Run MetaSwarm Simulation" 
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-6 bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg">
                    <p><strong>Error:</strong> {error}</p>
                </div>
            )}

            {(simulationScript || simulationLog || report) && (
                 <div className="mt-12 space-y-8">
                     <h2 className="text-3xl font-bold text-center">Latest Simulation Run</h2>
                    {simulationScript && <CodeBlock title="Generated Simulation Script" content={simulationScript} language="markdown" />}
                    {simulationLog && <CodeBlock title="Simulation Log" content={simulationLog} />}
                    {report && <CodeBlock title="Final Swarm Report" content={report} language="markdown"/>}
                </div>
            )}
            
            {project.simulations.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-2xl font-bold mb-4">Simulation History</h3>
                    <div className="space-y-4">
                        {project.simulations.map(sim => (
                             <div key={sim.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                <p className="text-sm font-mono text-slate-500">ID: {sim.id}</p>
                                <p className="font-semibold text-slate-200 mt-2">{sim.metaprompt}</p>
                                <p className="text-xs text-slate-400 mt-1">Ran at: {new Date(sim.timestamp).toLocaleString()}</p>
                             </div>
                        ))}
                    </div>
                </div>
            )}
            
        </section>
    );
};

export default MetaSwarmHub;