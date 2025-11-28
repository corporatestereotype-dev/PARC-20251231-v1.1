


import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { AutonomousSimulationResult, SyntheticUser, RepositoryFile, RepositoryFileType } from '../types';
import CodeBlock from './CodeBlock';
import FileIcon from './FileIcon';

interface ResearcherDataExplorerProps {
  simulationData: AutonomousSimulationResult | null;
  syntheticUsers: SyntheticUser[];
}

interface FileNode {
  name: string;
  path: string;
  file?: RepositoryFile;
  children?: Map<string, FileNode>;
}

const buildFileTree = (files: RepositoryFile[]): Map<string, FileNode> => {
  const root = new Map<string, FileNode>();
  files.forEach(file => {
    const pathParts = file.path.split('/');
    let currentMap = root;
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!currentMap.has(part)) {
        currentMap.set(part, { name: part, path: currentPath });
      }
      const node = currentMap.get(part)!;
      if (index === pathParts.length - 1) {
        node.file = file;
      } else {
        if (!node.children) {
          node.children = new Map();
        }
        currentMap = node.children;
      }
    });
  });
  return root;
};

interface FileTreeItem {
    path: string;
    name: string;
    level: number;
    isDir: boolean;
    file?: RepositoryFile;
}

const FileTree: React.FC<{
    node: Map<string, FileNode>;
    onFileSelect: (file: RepositoryFile) => void;
}> = ({ node, onFileSelect }) => {
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['experiments', 'data', 'reports'])); // Default open
    const [focusedPath, setFocusedPath] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLElement | null>>(new Map());

    const flatTree = useMemo((): FileTreeItem[] => {
        const result: FileTreeItem[] = [];
        const recurse = (n: Map<string, FileNode>, level: number) => {
            const sortedNodes = Array.from(n.values()).sort((a, b) => {
                if (!!a.children !== !!b.children) return a.children ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            for (const child of sortedNodes) {
                result.push({ path: child.path, name: child.name, level, isDir: !!child.children, file: child.file });
                if (child.children && openFolders.has(child.path)) {
                    recurse(child.children, level + 1);
                }
            }
        };
        recurse(node, 0);
        return result;
    }, [node, openFolders]);

    useEffect(() => {
        if (flatTree.length > 0 && !focusedPath) {
            setFocusedPath(flatTree[0].path);
        } else if (focusedPath && !flatTree.some(item => item.path === focusedPath)) {
            setFocusedPath(flatTree.length > 0 ? flatTree[0].path : null);
        }
    }, [flatTree, focusedPath]);
    
    useEffect(() => {
        const focusedElement = itemRefs.current.get(focusedPath || '');
        focusedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [focusedPath]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const currentIndex = flatTree.findIndex(item => item.path === focusedPath);
        if (currentIndex === -1) return;
        
        const currentItem = flatTree[currentIndex];

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) setFocusedPath(flatTree[currentIndex - 1].path);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < flatTree.length - 1) setFocusedPath(flatTree[currentIndex + 1].path);
                break;
            case 'ArrowRight':
                if (currentItem.isDir && !openFolders.has(currentItem.path)) {
                    e.preventDefault();
                    setOpenFolders(prev => new Set(prev).add(currentItem.path));
                }
                break;
            case 'ArrowLeft':
                if (currentItem.isDir && openFolders.has(currentItem.path)) {
                     e.preventDefault();
                     setOpenFolders(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(currentItem.path);
                        return newSet;
                    });
                }
                break;
            case 'Home':
                e.preventDefault();
                if (flatTree.length > 0) {
                    setFocusedPath(flatTree[0].path);
                }
                break;
            case 'End':
                e.preventDefault();
                if (flatTree.length > 0) {
                    setFocusedPath(flatTree[flatTree.length - 1].path);
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (currentItem.isDir) {
                    setOpenFolders(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(currentItem.path)) newSet.delete(currentItem.path);
                        else newSet.add(currentItem.path);
                        return newSet;
                    });
                } else if (currentItem.file) {
                    onFileSelect(currentItem.file);
                }
                break;
            default:
                break; // Do not prevent default for other keys
        }
    };
    
    const renderNode = (item: FileTreeItem) => {
        const isFocused = item.path === focusedPath;
        const itemContent = (
            <>
                <FileIcon type={item.file?.type || (item.isDir ? 'report' : 'document')} className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-300 truncate">{item.name}</span>
            </>
        );

        return (
            <div
                key={item.path}
                ref={el => { itemRefs.current.set(item.path, el); }}
                role="treeitem"
                aria-expanded={item.isDir ? openFolders.has(item.path) : undefined}
                aria-selected={isFocused}
                tabIndex={-1}
                style={{ paddingLeft: `${item.level}rem` }}
                className={`flex items-center gap-2 py-1 px-2 rounded outline-none cursor-pointer ${isFocused ? 'bg-blue-900/60 ring-1 ring-blue-500' : 'hover:bg-slate-700/50'}`}
                onClick={() => {
                  setFocusedPath(item.path);
                  if (item.isDir) {
                     setOpenFolders(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(item.path)) newSet.delete(item.path);
                        else newSet.add(item.path);
                        return newSet;
                    });
                  } else if (item.file) {
                    onFileSelect(item.file);
                  }
                }}
            >
                {itemContent}
            </div>
        );
    };

    return (
        <div ref={containerRef} onKeyDown={handleKeyDown} tabIndex={0} role="tree" aria-label="File explorer" className="outline-none focus:ring-1 focus:ring-blue-600 rounded">
            {flatTree.map(renderNode)}
        </div>
    );
};


const FILE_TYPES: RepositoryFileType[] = ['script', 'dataset', 'report', 'code', 'document', 'image', 'audio', 'video'];

const ResearcherDataExplorer: React.FC<ResearcherDataExplorerProps> = ({ simulationData, syntheticUsers }) => {
    const [selectedUser, setSelectedUser] = useState<SyntheticUser | null>(null);
    const [selectedFile, setSelectedFile] = useState<RepositoryFile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [fileContentSearchTerm, setFileContentSearchTerm] = useState('');
    const [isRunningExperiment, setIsRunningExperiment] = useState(false);
    const [experimentOutput, setExperimentOutput] = useState('');
    const [activeFilters, setActiveFilters] = useState<Set<RepositoryFileType>>(new Set());
    const experimentIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (syntheticUsers.length > 0 && !selectedUser) {
            setSelectedUser(syntheticUsers[0]);
        }
    }, [syntheticUsers, selectedUser]);
    
     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedFile(currentFile => {
                    // Only close if there is a file open
                    if (currentFile) {
                        return null;
                    }
                    return currentFile;
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const userRepositories = useMemo(() => {
        const repos = new Map<string, RepositoryFile[]>();
        if (!simulationData) return repos;

        simulationData.simulationTimeline.forEach(event => {
            if (event.repositoryCommit) {
                const userName = event.triggeredBy;
                if (!repos.has(userName)) repos.set(userName, []);
                const userFiles = repos.get(userName)!;
                event.repositoryCommit.files.forEach(file => {
                    const existingIndex = userFiles.findIndex(f => f.path === file.path);
                    if (existingIndex > -1) userFiles[existingIndex] = file;
                    else userFiles.push(file);
                });
            }
        });
        return repos;
    }, [simulationData]);

    const selectedUserFileTree = useMemo(() => {
        if (!selectedUser) return new Map();
        let files = userRepositories.get(selectedUser.name) || [];
        
        const filteredFiles = files.filter(file => {
             const typeMatch = activeFilters.size === 0 || activeFilters.has(file.type);
             return typeMatch;
        });

        return buildFileTree(filteredFiles);
    }, [selectedUser, userRepositories, activeFilters]);
    
    const handleFileSelect = useCallback((file: RepositoryFile) => {
        setSelectedFile(file);
        setFileContentSearchTerm('');
    }, []);

    const handleFilterToggle = (type: RepositoryFileType) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) newSet.delete(type);
            else newSet.add(type);
            return newSet;
        });
    };
    
    const streamOutput = (lines: string[], onFinished: () => void) => {
        if (experimentIntervalRef.current) clearInterval(experimentIntervalRef.current);
        setExperimentOutput('');
        let i = 0;
        experimentIntervalRef.current = window.setInterval(() => {
            if (i < lines.length) {
                setExperimentOutput(prev => prev + lines[i] + '\n');
                i++;
            } else {
                clearInterval(experimentIntervalRef.current!);
                onFinished();
            }
        }, 150);
    };

    const handleRunExperiment = () => {
        if (!selectedFile) return;
        setIsRunningExperiment(true);

        if (selectedFile.type === 'script') {
            const mockErrors = [
                `[ERROR] Traceback (most recent call last):\n  File "${selectedFile.path}", line ${Math.floor(Math.random() * 20) + 5}\n    result = model.predict(invalid_data)\n  File "/venv/lib/python3.9/site-packages/sklearn/base.py", line 450, in predict\n    return self._predict(X)\nValueError: Mock simulation error: Input contains NaN.`,
                `[ERROR] Traceback (most recent call last):\n  File "${selectedFile.path}", line ${Math.floor(Math.random() * 15) + 3}\n    import non_existent_module\nImportError: No module named 'non_existent_module'`,
                `[ERROR] MemoryError: Unable to allocate 8.00 GiB for an array with shape (1000000000,) and data type float64. Killing process.`
            ];
            const hasError = Math.random() > 0.8; // 20% chance of error
            const lines = [
                `[INFO] Initializing virtual environment for ${selectedFile.path}...`,
                `[INFO] Found requirements.txt, installing dependencies...`,
                `---> Installing pandas==1.3.3... Done.`,
                `---> Installing numpy==1.21.2... Done.`,
                `[INFO] All dependencies satisfied.`,
                `[RUN] Executing script with process ID ${Math.floor(Math.random() * 9000) + 1000}...`,
                `[RUN] ---------------------------------`,
            ];

            selectedFile.content.split('\n')
                .filter(line => line.trim().startsWith('print'))
                .forEach(line => {
                    lines.push(`[OUTPUT] > Simulating output for: ${line.trim()}`);
                    lines.push(`[OUTPUT] > Result: ${(Math.random() * 100).toFixed(5)}`);
                });
                
            lines.push(`[RUN] ---------------------------------`);

            if (hasError) {
                lines.push(mockErrors[Math.floor(Math.random() * mockErrors.length)]);
            } else {
                lines.push(`[SUCCESS] Script finished successfully. Total execution time: ${(Math.random() * 5 + 1).toFixed(2)}s.`);
            }
            
            streamOutput(lines, () => {});
        } else if (selectedFile.type === 'dataset') {
             const rawLines = selectedFile.content.split('\n').filter(l => l.trim() !== '');
            if (rawLines.length < 2) {
                streamOutput([`[ERROR] Dataset file '${selectedFile.path}' is empty or contains no data rows.`], () => {});
                return;
            }
            const header = rawLines[0].split(',').map(h => h.trim());
            const rows = rawLines.slice(1).map(r => r.split(',').map(c => c.trim()));
            
            const lines = [
                `[INFO] Starting analysis of ${selectedFile.path}...`,
                `[INFO] Reading ${rows.length} data rows with ${header.length} columns.`,
                `[INFO] Performing data quality checks... Done.`,
                `[STATS] Generating column-wise summary statistics...`,
                `----------------------------------------------------`,
            ];

            const columnStats = header.map((h, i) => {
                const columnData = rows.map(r => r[i]).filter(c => c !== undefined && c !== null && c !== '');
                const numericData = columnData.map(Number).filter(n => !isNaN(n));
                
                let stats = `Column: '${h}'\n`;
                stats += `  - Non-Null Count: ${columnData.length} / ${rows.length}\n`;

                if (numericData.length > 0 && numericData.length / columnData.length > 0.8) { // Heuristic for numeric column
                    numericData.sort((a,b) => a - b);
                    const sum = numericData.reduce((a, b) => a + b, 0);
                    const mean = sum / numericData.length;
                    const std = Math.sqrt(numericData.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / numericData.length);
                    stats += `  - Type: Numeric (approximated)\n`;
                    stats += `  - Mean: ${mean.toFixed(2)}\n`;
                    stats += `  - Std Dev: ${std.toFixed(2)}\n`;
                    stats += `  - Min: ${numericData[0].toFixed(2)}\n`;
                    stats += `  - 25%: ${numericData[Math.floor(numericData.length * .25)].toFixed(2)}\n`;
                    stats += `  - 50%: ${numericData[Math.floor(numericData.length * .5)].toFixed(2)}\n`;
                    stats += `  - 75%: ${numericData[Math.floor(numericData.length * .75)].toFixed(2)}\n`;
                    stats += `  - Max: ${numericData[numericData.length - 1].toFixed(2)}`;
                } else {
                    const freqMap = columnData.reduce((acc, val) => {
                        acc[val] = (acc[val] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    // FIX: Explicitly cast values to `number` to ensure correct subtraction for sorting, as TypeScript inference can sometimes fail here.
                    const sortedUnique = Object.entries(freqMap).sort((a, b) => (b[1] as number) - (a[1] as number));
                    
                    stats += `  - Type: String/Categorical (approximated)\n`;
                    stats += `  - Unique Values: ${sortedUnique.length}\n`;
                    if(sortedUnique.length > 0) {
                        stats += `  - Top Value: '${sortedUnique[0][0]}' (occurs ${sortedUnique[0][1]} times)`;
                    }
                }
                return stats;
            });

            lines.push(...columnStats.join('\n----------------------------------------------------\n').split('\n'));
            
            // Create formatted preview table
            const colWidths = header.map((h, i) => 
                Math.max(h.length, ...rows.slice(0, 5).map(r => r[i]?.length || 0))
            );
            const formatRow = (row: string[]) => '  | ' + row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ') + ' |';
            
            lines.push(`\n[DATA PREVIEW] First 5 rows:`);
            lines.push(formatRow(header));
            lines.push('  |-' + colWidths.map(w => '-'.repeat(w)).join('-|-') + '-|');
            rows.slice(0, 5).forEach(r => lines.push(formatRow(r)));

            lines.push(`\n[SUCCESS] Analysis complete.`);

            streamOutput(lines, () => {});
        }
    };
    
     const closeExperimentRunner = () => {
        setIsRunningExperiment(false);
        if (experimentIntervalRef.current) clearInterval(experimentIntervalRef.current);
        setExperimentOutput('');
    }

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const results: {user: SyntheticUser, file: RepositoryFile}[] = [];
        const lowerCaseSearch = searchTerm.toLowerCase();

        for(const user of syntheticUsers) {
            const files = userRepositories.get(user.name) || [];
            files.forEach(file => {
                if(file.path.toLowerCase().includes(lowerCaseSearch) || file.content.toLowerCase().includes(lowerCaseSearch)){
                    results.push({user, file});
                }
            })
        }
        return results;
    }, [searchTerm, userRepositories, syntheticUsers]);
    
    if (!simulationData) {
        return <div className="p-8 text-center text-slate-400">No simulation data available.</div>;
    }
    
    const canRunAnalysis = selectedFile && (selectedFile.type === 'script' || selectedFile.type === 'dataset');
    const runButtonText = selectedFile?.type === 'script' ? 'Run Experiment' : 'Analyze Dataset';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
                 <input
                    type="search"
                    placeholder="Search all files by name or content..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>

            <div className="flex-1 grid grid-cols-12 gap-px bg-slate-700 overflow-hidden">
                {searchTerm.trim() ? (
                     <div className="col-span-12 bg-slate-800 p-4 overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Search Results for "{searchTerm}"</h2>
                        <div className="space-y-2">
                           {searchResults.length > 0 ? searchResults.map(({ user, file }) => (
                               <button key={`${user.id}-${file.path}`} onClick={() => { setSelectedUser(user); handleFileSelect(file); setSearchTerm(''); }} className="w-full text-left p-3 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg border border-slate-700">
                                   <div className="flex items-center gap-2">
                                     <FileIcon type={file.type} className="h-5 w-5 text-blue-400 flex-shrink-0"/>
                                     <span className="font-semibold text-slate-200">{file.path}</span>
                                   </div>
                                   <div className="flex items-center gap-2 mt-1 text-xs">
                                     <img src={user.avatarUrl} alt={user.name} className="w-4 h-4 rounded-full"/>
                                     <span className="text-slate-400">{user.name}</span>
                                   </div>
                               </button>
                           )) : <p className="text-slate-400">No results found.</p>}
                        </div>
                    </div>
                ) : (
                <>
                    {/* Researchers Panel */}
                    <aside className="col-span-2 bg-slate-800 p-2 overflow-y-auto">
                         <h3 className="text-sm font-bold p-2 text-slate-400">RESEARCHERS</h3>
                        {syntheticUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => { setSelectedUser(user); setSelectedFile(null); }}
                                className={`w-full flex items-center gap-2 p-2 text-left rounded-md text-sm transition-colors ${selectedUser?.id === user.id ? 'bg-blue-900/50' : 'hover:bg-slate-700/50'}`}
                            >
                                <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                <span className="font-medium text-slate-200">{user.name}</span>
                            </button>
                        ))}
                    </aside>
                    
                    {/* File Tree Panel */}
                    <div className="col-span-3 bg-slate-900/50 flex flex-col overflow-y-auto">
                        <div className="p-3 flex-shrink-0 border-b border-slate-700">
                            <h3 className="text-sm font-bold mb-3 text-slate-400">FILE TYPES</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {FILE_TYPES.map(type => (
                                    <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={activeFilters.has(type)}
                                            onChange={() => handleFilterToggle(type)}
                                            className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                        />
                                        <div className="flex items-center gap-1.5 text-slate-300">
                                          <FileIcon type={type} className="h-4 w-4" /><span className="capitalize">{type}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {activeFilters.size > 0 && (
                                <button onClick={() => setActiveFilters(new Set())}
                                    className="mt-3 w-full text-center px-2 py-1 text-xs rounded-md border border-slate-600 bg-slate-800 hover:bg-red-500/20 text-slate-300 transition-colors"
                                >Clear Filters</button>
                            )}
                        </div>
                        <div className="p-2 flex-1 overflow-y-auto">
                            {selectedUser && <FileTree node={selectedUserFileTree} onFileSelect={handleFileSelect} />}
                        </div>
                    </div>

                    {/* File Viewer Panel */}
                    <div className="col-span-7 bg-slate-800 flex flex-col overflow-hidden">
                        {selectedFile ? (
                            <div className="flex-1 flex flex-col h-full">
                                <div className="p-3 border-b border-slate-700 flex-shrink-0 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileIcon type={selectedFile.type} className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                            <h3 className="font-mono text-slate-200 truncate">{selectedFile.path}</h3>
                                        </div>
                                        {canRunAnalysis && (
                                            <button onClick={handleRunExperiment} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors flex-shrink-0">
                                            {runButtonText}
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="search"
                                        placeholder="Search within file..."
                                        value={fileContentSearchTerm}
                                        onChange={e => setFileContentSearchTerm(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-1 px-3 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <CodeBlock title="" content={selectedFile.content} language={selectedFile.path.split('.').pop()} highlightTerm={fileContentSearchTerm} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 p-4 text-center">
                                <p>Select a researcher and a file to view its content.<br/>Use your keyboard to navigate the file tree.</p>
                            </div>
                        )}
                    </div>
                </>
                )}
            </div>
            
            {isRunningExperiment && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
                    onClick={closeExperimentRunner}
                >
                    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl m-4 flex flex-col" style={{height: '70vh'}} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4 flex-shrink-0">Experiment Runner: <span className="font-mono text-emerald-400">{selectedFile?.path}</span></h2>
                        <div className="bg-slate-900 rounded flex-grow overflow-hidden">
                            <CodeBlock title="Output" content={experimentOutput} />
                        </div>
                        <div className="text-right mt-4 flex-shrink-0">
                            <button onClick={closeExperimentRunner} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResearcherDataExplorer;