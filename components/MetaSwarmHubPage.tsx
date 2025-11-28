import React, { useState } from 'react';
import Header from './Header';
import CodeBlock from './CodeBlock';
import FeatureCard from './FeatureCard';
import UseCaseCard from './UseCaseCard';
import { METASWARM_ICON } from '../constants';
import { generateSimulationScript, generateSwarmReport, generateSimulationLog } from '../lib/ai';
import type { Settings, Community } from '../types';

const useCases = [
    {
        title: "Optimize a trading algorithm for high-volatility crypto markets",
        prompt: "Design and test a robust trading algorithm that leverages the FOZ-Adaptive Controller to minimize risk and maximize returns during periods of high volatility in the cryptocurrency market, specifically for BTC and ETH."
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

interface MetaSwarmHubPageProps {
    settings: Settings;
    community: Community | null;
}

const MetaSwarmHubPage: React.FC<MetaSwarmHubPageProps> = ({ settings, community }) => {
    const [metaprompt, setMetaprompt] = useState<string>('');
    const [simulationScript, setSimulationScript] = useState<string>('');
    const [simulationLog, setSimulationLog] = useState<string>('');
    const [report, setReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunSimulation = async () => {
        if (!metaprompt) return;
        setIsLoading(true);
        setError(null);
        setSimulationScript('');
        setSimulationLog('');
        setReport('');

        try {
            const communityTheme = community?.themeDescription;
            // Step 1: Generate Simulation Script
            const script = await generateSimulationScript(metaprompt, '', settings, undefined, communityTheme);
            setSimulationScript(script);

            // Step 2: "Run" simulation (generate mock log)
            const log = await generateSimulationLog(metaprompt, script, settings, communityTheme);
            setSimulationLog(log);

            // Step 3: Generate Report
            const finalReport = await generateSwarmReport(metaprompt, log, settings, undefined, communityTheme);
            setReport(finalReport);

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseCaseClick = (prompt: string) => {
        setMetaprompt(prompt);
        // Clear previous results when a new use case is selected
        setSimulationScript('');
        setSimulationLog('');
        setReport('');
        setError(null);
    }

    return (
        <section>
            <Header
                icon={<div className="w-8 h-8">{METASWARM_ICON}</div>}
                title="Polymath AI MetaSwarm Hub"
                subtitle="An interactive environment for designing, analyzing, and optimizing complex AI systems using the FOZ framework. Define your objective and let the MetaSwarm build a plan."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <FeatureCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75l.75-1.313M6 19.5l.75-1.313M2.25 10.5l4.125 7.146M21.75 10.5l-4.125 7.146m0 0l-1.292 2.236M17.625 17.646l-1.292 2.236m6.375-10.354l-4.125-7.146M12 21.75l-1.292-2.236M7.875 17.646L6.583 19.5m12-2.25l-1.292-2.236M12 2.25l-1.292 2.236" /></svg>}
                    title="Self-Improving Systems"
                    description="Leverages an Accumulation Pattern where each simulation refines the system's state, driven by feedback loops."
                />
                <FeatureCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.092 1.21-.138 2.43-.138 3.662v.512c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.21.138-2.43.138-3.662v-.512z" /></svg>}
                    title="FOZ Stabilization"
                    description="Applies a universal stability framework to tame singularities and paradoxes, ensuring robust operation in complex domains."
                />
                <FeatureCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.73-.664 1.206-.861a7.5 7.5 0 10-9.362 9.362c.198.475.477.89.861 1.206l3.03-2.496z" /></svg>}
                    title="Meta-Learning"
                    description="A design-time experimentation loop where insights from reports inform adjustments to future metaprompts."
                />
            </div>

            <div className="bg-slate-800/40 p-8 rounded-lg border border-slate-700">
                 {community && (
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                        <p className="text-sm text-slate-400">
                            Active Community Context: <strong className="text-blue-400">{community.name}</strong>. The MetaSwarm will operate within this theme.
                        </p>
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-2">1. Define Metaprompt</h2>
                <p className="text-slate-400 mb-4">Start by defining a high-level objective or a problem for the MetaSwarm to analyze. Or, select a use-case below.</p>
                <div className="mb-4">
                    <textarea
                        value={metaprompt}
                        onChange={(e) => setMetaprompt(e.target.value)}
                        placeholder="e.g., 'Develop a strategy to stabilize a chaotic financial market model using an adaptive epsilon.'"
                        className="w-full h-32 bg-slate-700 border border-slate-600 rounded-md p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                        aria-label="Metaprompt Input"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {useCases.map(uc => <UseCaseCard key={uc.title} title={uc.title} onClick={() => handleUseCaseClick(uc.prompt)} />)}
                </div>

                <button
                    onClick={handleRunSimulation}
                    disabled={isLoading || !metaprompt}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Running Simulation...
                        </>
                    ) : (
                        "Run MetaSwarm Simulation"
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-6 bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg">
                    <p><strong>Error:</strong> {error}</p>
                </div>
            )}

            {(simulationScript || simulationLog || report) && (
                <div className="mt-12 space-y-8">
                    <h2 className="text-3xl font-bold text-center">Simulation Results</h2>
                    {simulationScript && <CodeBlock title="Generated Simulation Script" content={simulationScript} language="markdown" />}
                    {simulationLog && <CodeBlock title="Simulation Log" content={simulationLog} />}
                    {report && <CodeBlock title="Final Swarm Report" content={report} language="markdown" />}
                </div>
            )}
        </section>
    );
};

export default MetaSwarmHubPage;