
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { runAutonomousSimulation } from '../lib/ai';
import type { Settings, AutonomousSimulationResult, SyntheticUser, SimulationEvent, GraphNode, GraphLink } from '../types';
import CodeBlock from './CodeBlock';
import ResearcherDataExplorer from './ResearcherDataExplorer';
import { DRIVE_ICON } from '../constants';

type SimulationStatus = 'idle' | 'loading' | 'running' | 'paused' | 'finished';
type AutonomousView = 'simulation' | 'explorer';

interface AutonomousModeProps {
    settings: Settings;
    simulationResult: AutonomousSimulationResult | null;
    onUpdate: (result: AutonomousSimulationResult) => void;
    onReset: () => void;
    isTimed: boolean;
    endTime: number | null;
    onFinish: () => void;
}

const formatTime = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const dd = String(days).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    if (days > 0) return `${dd}:${hh}:${mm}:${ss}`;
    return `${hh}:${mm}:${ss}`;
};


const AutonomousMode: React.FC<AutonomousModeProps> = ({ settings, simulationResult, onUpdate, onReset, isTimed, endTime, onFinish }) => {
    const [status, setStatus] = useState<SimulationStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [simulationData, setSimulationData] = useState<AutonomousSimulationResult | null>(null);
    const [syntheticUsers, setSyntheticUsers] = useState<SyntheticUser[]>([]);
    const [activeView, setActiveView] = useState<AutonomousView>('simulation');
    
    const [currentEventIndex, setCurrentEventIndex] = useState(-1);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
    const nodeSelectionRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const linkSelectionRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const timerRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const runAndMergeSimulation = useCallback(async (previousResult: AutonomousSimulationResult | null) => {
        setStatus('loading');
        setError(null);
        try {
            const newChunk = await runAutonomousSimulation(settings, previousResult);
            
            let mergedResult: AutonomousSimulationResult;
            if (!previousResult) {
                mergedResult = newChunk;
            } else {
                mergedResult = {
                    ...previousResult,
                    simulationTimeline: [...previousResult.simulationTimeline, ...newChunk.simulationTimeline],
                    finalReport: newChunk.finalReport,
                };
            }
            
            onUpdate(mergedResult);
            setStatus('paused');
            setCurrentEventIndex(previousResult ? previousResult.simulationTimeline.length -1 : -1);

        } catch (err) {
            setError((err as Error).message);
            setStatus('idle');
        }
    }, [settings, onUpdate]);

    useEffect(() => {
        if (isTimed && endTime) {
            const updateTimer = () => {
                const remaining = endTime - Date.now();
                setRemainingTime(remaining);
                if (remaining <= 0) {
                    onFinish();
                }
            };
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [isTimed, endTime, onFinish]);

    useEffect(() => {
        if (isTimed && status !== 'loading' && (simulationData?.simulationTimeline.length || 0) < 100) { // Safety cap
            const runLoop = async () => {
                await runAndMergeSimulation(simulationData);
            };
            runLoop();
        }
    }, [isTimed, status, simulationData, runAndMergeSimulation]);

    useEffect(() => {
        setSimulationData(simulationResult);
        if (simulationResult) {
            const users = simulationResult.generatedUsers.map((u, i) => ({
                id: `su-${i}`,
                name: u.name,
                personaSummary: u.personaSummary,
                avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(u.name)}`
            }));
            setSyntheticUsers(users);
            
            if (status === 'idle') {
                 setStatus('paused');
            }
        } else {
            if(status === 'idle' && !isTimed) { // Only auto-start for supervised mode
                runAndMergeSimulation(null);
            }
        }
    }, [simulationResult, isTimed, runAndMergeSimulation, status]);


    const getLinkKey = useCallback((d: GraphLink): string => {
        const sourceId = typeof d.source === 'object' && d.source !== null ? (d.source as GraphNode).id : d.source as string;
        const targetId = typeof d.target === 'object' && d.target !== null ? (d.target as GraphNode).id : d.target as string;
        return `${sourceId}-${targetId}`;
    }, []);

    const drag = useCallback((simulation: d3.Simulation<GraphNode, GraphLink>) => {
        function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, any>, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x!;
            d.fy = d.y!;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, any>, d: GraphNode) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, any>, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag<SVGGElement, GraphNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }, []);
    
    useEffect(() => {
        if (activeView !== 'simulation' || !svgRef.current) return;

        simulationRef.current?.stop();

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svg.node()!.parentElement!.clientWidth || 800;
        const height = svg.node()!.parentElement!.clientHeight || 600;
        svg.attr('viewBox', [-width / 2, -height / 2, width, height]);

        const container = svg.append('g');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
            });
        svg.call(zoom);

        linkSelectionRef.current = container.append('g').attr('stroke-opacity', 0.6);
        nodeSelectionRef.current = container.append('g').attr('stroke', '#fff').attr('stroke-width', 1.5);
        
        const simulation = d3.forceSimulation<GraphNode, GraphLink>()
            .force('link', d3.forceLink<GraphNode, GraphLink>().id((d: GraphNode) => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(0, 0));

        simulation.on('tick', () => {
            linkSelectionRef.current?.selectAll('line')
                .attr('x1', d => ((d as d3.SimulationLinkDatum<GraphNode>).source as GraphNode).x!)
                .attr('y1', d => ((d as d3.SimulationLinkDatum<GraphNode>).source as GraphNode).y!)
                .attr('x2', d => ((d as d3.SimulationLinkDatum<GraphNode>).target as GraphNode).x!)
                .attr('y2', d => ((d as d3.SimulationLinkDatum<GraphNode>).target as GraphNode).y!);
            
            nodeSelectionRef.current?.selectAll('g').attr('transform', d => `translate(${(d as GraphNode).x}, ${(d as GraphNode).y})`);
        });

        simulationRef.current = simulation;

        return () => {
            simulationRef.current?.stop();
        };
    }, [activeView]);

    useEffect(() => {
        const simulation = simulationRef.current;
        if (activeView !== 'simulation' || !simulation || !nodeSelectionRef.current || !linkSelectionRef.current) return;

        if (!simulationData) {
            nodeSelectionRef.current?.selectAll('*').remove();
            linkSelectionRef.current?.selectAll('*').remove();
            return;
        }

        const allNodes: GraphNode[] = [];
        const allLinks: GraphLink[] = [];
        const nodeIds = new Set<string>();

        simulationData.researchDomains.forEach(d => {
            if(!nodeIds.has(d)) {
                allNodes.push({ id: d, label: d, domain: d });
                nodeIds.add(d);
            }
        });
        simulationData.simulationTimeline.forEach(event => {
            event.graphChanges.newNodes?.forEach(n => {
                if (!nodeIds.has(n.id)) {
                    allNodes.push(n);
                    nodeIds.add(n.id);
                }
            });
        });
        
        const linkIds = new Set<string>();
        simulationData.simulationTimeline.forEach(event => {
            event.graphChanges.newLinks?.forEach(l => {
                const sourceId = l.source as string;
                const targetId = l.target as string;

                if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
                    const key = getLinkKey(l);
                    if (!linkIds.has(key)) {
                        allLinks.push(l);
                        linkIds.add(key);
                    }
                } else {
                    console.warn(`Skipping link with missing node(s): source='${sourceId}', target='${targetId}'`);
                }
            });
        });

        linkSelectionRef.current?.selectAll('line')
            .data(allLinks, getLinkKey as any)
            .join('line')
            .attr('stroke', '#475569')
            .attr('stroke-width', 1.5);
        
        const nodeUpdate = nodeSelectionRef.current?.selectAll('g')
            .data(allNodes, (d: any) => d.id)
            .join(
              enter => {
                const g = enter.append('g').attr('class', 'cursor-pointer group');
                g.append('circle').attr('r', 8).attr('fill', '#1e293b').attr('stroke', '#3b82f6').attr('stroke-width', 2).attr('class', 'transition-all');
                g.append('text').text(d => d.label).attr('x', 12).attr('y', 4).attr('fill', '#cbd5e1').style('font-size', '10px').attr('class', 'opacity-0 group-hover:opacity-100 transition-opacity');
                
                g.on('click', (event, d) => {
                    event.stopPropagation();
                    const circle = d3.select(event.currentTarget as SVGGElement).select('circle');
                    const currentR = circle.attr('r');
                    circle.transition().duration(150).attr('r', Number(currentR) + 4)
                          .transition().duration(300).attr('r', currentR);
                });

                return g;
              }
            );

        if (nodeUpdate) {
            nodeUpdate.call(drag(simulation) as any);
        }
        
        simulation.nodes(allNodes);
        (simulation.force('link') as d3.ForceLink<GraphNode, GraphLink> | undefined)?.links(allLinks);
        simulation.alpha(1).restart();

    }, [simulationData, activeView, drag, getLinkKey]);


     const processEvent = useCallback((index: number) => {
        if (!simulationData || index < 0 || index >= simulationData.simulationTimeline.length) return;
        
        const event = simulationData.simulationTimeline[index];
        const { newNodes = [] } = event.graphChanges;

        nodeSelectionRef.current?.selectAll('g')
            .select('circle')
            .transition().duration(500)
            .attr('r', (d: any) => newNodes.some(n => n.id === d.id) ? 12 : 8)
            .attr('fill', (d: any) => newNodes.some(n => n.id === d.id) ? '#3b82f6' : '#1e293b');
            
    }, [simulationData]);
    
     useEffect(() => {
        if (status !== 'running') {
            if (timerRef.current) window.clearInterval(timerRef.current);
            return;
        }

        timerRef.current = window.setInterval(() => {
            setCurrentEventIndex(prev => {
                const nextIndex = prev + 1;
                if (!simulationData || nextIndex >= simulationData.simulationTimeline.length) {
                    setStatus('finished');
                    return prev;
                }
                processEvent(nextIndex);
                return nextIndex;
            });
        }, 2000 / playbackSpeed);

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };

    }, [status, simulationData, playbackSpeed, processEvent]);


    const handlePlayPause = () => {
        if (status === 'running') {
            setStatus('paused');
        } else if (status === 'paused' || status === 'finished') {
            if (status === 'finished') {
                setCurrentEventIndex(-1);
                 nodeSelectionRef.current?.selectAll('g')
                    .select('circle').transition().duration(250).attr('r', 8).attr('fill', '#1e293b');
            }
            setStatus('running');
        }
    };
    
     const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!simulationData) return;
        const newIndex = parseInt(event.target.value, 10);
        setStatus('paused');

        if (newIndex >= 0) {
            const { newNodes = [] } = simulationData.simulationTimeline[newIndex].graphChanges;
            nodeSelectionRef.current?.selectAll('g')
                .select('circle')
                .transition().duration(250)
                .attr('r', (d: any) => newNodes.some(n => n.id === d.id) ? 12 : 8)
                .attr('fill', (d: any) => newNodes.some(n => n.id === d.id) ? '#3b82f6' : '#1e293b');
        } else {
             nodeSelectionRef.current?.selectAll('g')
                .select('circle')
                .transition().duration(250)
                .attr('r', 8)
                .attr('fill', '#1e293b');
        }
        setCurrentEventIndex(newIndex);
    };
    
    const handleExport = () => {
        if (!simulationData) return;
        const dataStr = JSON.stringify(simulationData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        link.download = `parc-simulation-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const parsedData = JSON.parse(result) as AutonomousSimulationResult;
                    if (parsedData.simulationTitle && parsedData.simulationTimeline && parsedData.generatedUsers) {
                        onUpdate(parsedData);
                        setStatus('paused');
                        setCurrentEventIndex(-1);
                    } else {
                        throw new Error("Invalid simulation file format.");
                    }
                }
            } catch (err) {
                setError(`Failed to import file: ${(err as Error).message}`);
            }
        };
        reader.onerror = () => setError("Failed to read the selected file.");
        reader.readAsText(file);
        event.target.value = '';
    };

    const currentEvent = simulationData && currentEventIndex >= 0 ? simulationData.simulationTimeline[currentEventIndex] : null;

    if (isTimed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
                <div className="flex items-center mb-6">
                    {DRIVE_ICON}
                    <h1 className="text-4xl font-bold text-slate-100">AI Autonomy Engaged</h1>
                </div>
                <p className="text-xl text-slate-400 mb-8">{simulationData?.simulationTitle}</p>
                <div className="font-mono text-7xl font-bold tracking-wider text-blue-400 bg-black/20 p-8 rounded-lg mb-8">
                    {remainingTime !== null ? formatTime(remainingTime) : 'Calculating...'}
                </div>
                 {status === 'loading' && (
                     <div className="flex items-center text-lg text-slate-300 mb-4">
                        <svg className="animate-spin h-6 w-6 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI is processing...
                    </div>
                )}
                <div className="text-center text-slate-500 max-w-lg">
                    <p>The AI is operating continuously. You can close this window; the process will continue on the server. You will be returned to your workspace when the timer is complete.</p>
                     {error && <p className="mt-4 text-red-400">Error: {error}. The simulation has been paused.</p>}
                </div>
                <button onClick={onFinish} className="mt-8 bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Cancel Autonomous Session
                </button>
            </div>
        );
    }
    
    if (!simulationData || (status === 'loading' && !simulationData.simulationTimeline.length)) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
                 <div className="flex items-center mb-6">
                    {DRIVE_ICON}
                    <h1 className="text-4xl font-bold text-slate-100">PARC Autonomous Mode</h1>
                </div>
                <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg text-slate-300">
                    {simulationResult ? 'Continuing simulation...' : 'Engaging Polymath AI Conductor...'}
                </p>
                <p className="text-slate-500">
                   {simulationResult ? 'Building upon previous discoveries...' : 'Generating research parameters and instantiating synthetic users.'}
                </p>
                 {error && <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-2xl">{error}</div>}
            </div>
        );
    }
    
    const ViewToggleButton: React.FC<{view: AutonomousView, label: string}> = ({view, label}) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === view ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
            {label}
        </button>
    );

    return (
      <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
        <header className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm p-3 flex justify-between items-center border-b border-slate-700">
             <div className="flex items-center">
              {DRIVE_ICON}
              <span className="text-xl font-bold text-slate-100 ml-2">PARC Autonomous Workflow</span>
            </div>
            <h2 className="text-lg font-semibold text-blue-400 hidden md:block">{simulationData?.simulationTitle}</h2>
            <div className="flex items-center gap-2">
                <ViewToggleButton view="simulation" label="Simulation"/>
                <ViewToggleButton view="explorer" label="Data Explorer"/>
            </div>
        </header>
        
        {activeView === 'simulation' ? (
            <>
                <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
                    <aside className="col-span-2 space-y-4 overflow-y-auto pr-2">
                        <h3 className="text-lg font-bold">Researchers ({syntheticUsers.length})</h3>
                        {syntheticUsers.map(user => (
                            <div key={user.id} className={`p-2 rounded-lg transition-all duration-300 ${currentEvent?.triggeredBy === user.name ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-800'}`}>
                                <div className="flex items-center gap-2">
                                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm font-medium">{user.name}</span>
                                </div>
                            </div>
                        ))}
                    </aside>
                    
                    <div className="col-span-7 flex flex-col bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                        <h3 className="text-lg font-bold p-3 border-b border-slate-700">Knowledge Graph</h3>
                        <div className="flex-1 relative">
                            <svg ref={svgRef} className="w-full h-full"></svg>
                        </div>
                    </div>

                    <aside className="col-span-3 flex flex-col space-y-4 overflow-y-auto">
                        <h3 className="text-lg font-bold">Timeline ({simulationData?.simulationTimeline.length} Events)</h3>
                        <div className="flex-1 space-y-3 pr-2">
                        {simulationData?.simulationTimeline.map((event, index) => (
                            <div key={index} className={`p-3 rounded-lg border-l-4 transition-all duration-300 ${index === currentEventIndex ? 'bg-slate-700 border-blue-400' : 'bg-slate-800 border-slate-600'}`}>
                                <p className="font-bold text-sm">{event.summary}</p>
                                <p className="text-xs text-slate-400">T{event.timestamp}:00 by {event.triggeredBy}</p>
                            </div>
                        ))}
                        </div>
                    </aside>
                </main>
                
                <footer className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm p-3 border-t border-slate-700 space-y-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => runAndMergeSimulation(simulationData)} disabled={status === 'loading'} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {status === 'loading' ? 'Running...' : 'Continue Simulation'}
                        </button>
                        <div className="flex-1 flex items-center gap-2">
                            <button onClick={handlePlayPause} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
                                {status === 'running' ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/></svg> :
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
                                }
                            </button>
                            <span className="text-xs font-mono w-28 text-center">{currentEvent ? `T${currentEvent.timestamp}:00` : 'Start'}</span>
                            <input 
                                type="range" 
                                min="-1"
                                max={simulationData ? simulationData.simulationTimeline.length - 1 : 0}
                                value={currentEventIndex}
                                onChange={handleSeek}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                     <div className="flex items-center gap-4 pt-3 mt-3 border-t border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-400">Data Management:</h3>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden"/>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 text-sm rounded-md transition-colors">Import</button>
                        <button onClick={handleExport} disabled={!simulationData} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 text-sm rounded-md transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed">Export</button>
                        <button onClick={() => { if (window.confirm('This will delete all progress. Are you sure?')) { onReset(); setStatus('idle'); } }} disabled={status === 'loading'} className="bg-red-800 hover:bg-red-700 text-white font-semibold py-2 px-4 text-sm rounded-md transition-colors disabled:bg-slate-600">Reset</button>
                         {error && <p className="text-red-400 text-xs text-center flex-1">{error}</p>}
                    </div>

                    {status === 'finished' && simulationData && (
                        <div className="p-4 bg-slate-900/50 rounded-lg">
                            <h3 className="text-xl font-bold mb-2">Simulation Complete: Final Report</h3>
                            <CodeBlock title="Summary" content={simulationData.finalReport} language="markdown" />
                        </div>
                    )}
                </footer>
            </>
        ) : (
            <ResearcherDataExplorer
                simulationData={simulationData}
                syntheticUsers={syntheticUsers}
            />
        )}
      </div>
    );
};

export default AutonomousMode;
