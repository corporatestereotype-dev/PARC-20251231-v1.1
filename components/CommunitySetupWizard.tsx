

import React, { useState } from 'react';
import { generateCommunityProfile } from '../lib/ai';
import { MOCK_USER, AI_ASSISTANT_USER } from '../constants';
import type { Community, Settings, SyntheticUser } from '../types';

interface CommunitySetupWizardProps {
  onComplete: (community: Community) => void;
  isInitialSetup: boolean;
  onCancel?: () => void;
}

type Vibe = 'Professional & Sleek' | 'Creative & Vibrant' | 'Calm & Focused' | 'Futuristic & High-Tech';
const VIBES: Vibe[] = ['Professional & Sleek', 'Creative & Vibrant', 'Calm & Focused', 'Futuristic & High-Tech'];

type Step = 'theme' | 'vibe' | 'generating' | 'review';

const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
    const steps: { id: Step, name: string }[] = [
        { id: 'theme', name: 'Define Theme' },
        { id: 'vibe', name: 'Choose Vibe' },
        { id: 'review', name: 'Review & Launch' },
    ];
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    {stepIdx < currentIndex ? (
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-[var(--accent-primary)]" />
                        </div>
                        <span className="relative flex h-8 w-8 items-center justify-center bg-[var(--accent-primary)] rounded-full">
                         <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
                        </span>
                    </>
                    ) : stepIdx === currentIndex ? (
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-700" />
                        </div>
                        <span className="relative flex h-8 w-8 items-center justify-center bg-[var(--bg-tertiary)] rounded-full border-2 border-[var(--accent-primary)]" aria-current="step">
                        <span className="h-2.5 w-2.5 bg-[var(--accent-primary)] rounded-full" aria-hidden="true" />
                        </span>
                    </>
                    ) : (
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-700" />
                        </div>
                        <span className="relative flex h-8 w-8 items-center justify-center bg-[var(--bg-tertiary)] rounded-full border-2 border-gray-700">
                        </span>
                    </>
                    )}
                </li>
                ))}
            </ol>
        </nav>
    );
};


const CommunitySetupWizard: React.FC<CommunitySetupWizardProps> = ({ onComplete, isInitialSetup, onCancel }) => {
    const [step, setStep] = useState<Step>('theme');
    const [themeDescription, setThemeDescription] = useState('');
    const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
    const [generatedProfile, setGeneratedProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!selectedVibe || !themeDescription) return;
        setStep('generating');
        setError(null);
        try {
            // NOTE: Using a hardcoded Gemini setting here as this is a critical JSON-based generation step.
            // FIX: Added missing sandboxConfig to conform to the Settings type.
            const profile = await generateCommunityProfile(themeDescription, selectedVibe, {
                aiProvider: 'gemini',
                ollamaModel: '',
                storageProvider: 'google-drive',
                storagePath: '',
                sandboxConfig: {
                    imageName: 'us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.1.2',
                    runCommand: 'docker run -d --name ASISafeSandbox -v "~/ASISafeSandbox:/" --user nobody --workdir ~/ASISafeSandbox us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.1.2 bash -c "echo \'Sandbox ready.\'; tail -f /dev/null"'
                }
            });
            setGeneratedProfile(profile);
            setStep('review');
        } catch (err) {
            setError((err as Error).message);
            setStep('vibe'); // Go back to the previous step on error
        }
    };

    const handleComplete = () => {
        const foundingMembers: SyntheticUser[] = generatedProfile.foundingMembers.map((fm: any, i: number) => ({
            ...fm,
            id: `fm-${Date.now()}-${i}`,
            avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(fm.name)}`
        }));
        
        // This is a hack to make sure the AI user has a picture in the messages
        const welcomeMessage = {
          ...generatedProfile.globalMessages[0],
          user: {
            ...generatedProfile.globalMessages[0].user,
            picture: AI_ASSISTANT_USER.picture
          }
        };

        const newCommunity: Community = {
            id: `comm-${Date.now()}`,
            name: generatedProfile.name,
            themeDescription: generatedProfile.themeDescription,
            style: generatedProfile.style,
            projects: [],
            feedItems: [],
            globalMessages: [welcomeMessage],
            foundingMembers: foundingMembers,
        };
        onComplete(newCommunity);
    };

    const renderContent = () => {
        switch (step) {
            case 'theme':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Describe Your Community</h2>
                        <p className="text-[var(--text-secondary)] mb-6">What is the central theme or purpose? Be descriptive! The AI will use this to generate a name, welcome message, and relevant founding members.</p>
                        <textarea
                            value={themeDescription}
                            onChange={(e) => setThemeDescription(e.target.value)}
                            placeholder="e.g., A collaborative space for indie game developers to share assets, get feedback on prototypes, and form teams for game jams."
                            className="w-full h-40 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md p-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none transition-colors"
                            autoFocus
                        />
                        <button onClick={() => setStep('vibe')} disabled={!themeDescription.trim()} className="mt-6 w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Next: Choose Vibe &rarr;
                        </button>
                    </div>
                );
            case 'vibe':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Select a Visual Vibe</h2>
                        <p className="text-[var(--text-secondary)] mb-6">Choose an aesthetic that best fits your community. The AI will generate a color palette to match.</p>
                        {error && <p className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4">{error}</p>}
                        <div className="grid grid-cols-2 gap-4">
                            {VIBES.map(vibe => (
                                <button key={vibe} onClick={() => setSelectedVibe(vibe)} className={`p-6 rounded-lg text-center font-semibold border-2 transition-all ${selectedVibe === vibe ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] scale-105' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-slate-500'}`}>
                                    {vibe}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep('theme')} className="w-full bg-[var(--bg-tertiary)] hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                &larr; Back
                            </button>
                            <button onClick={handleGenerate} disabled={!selectedVibe} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                Generate Community Profile
                            </button>
                        </div>
                    </div>
                );
            case 'generating':
                return (
                    <div className="text-center py-12">
                         <svg className="animate-spin h-12 w-12 text-[var(--text-accent)] mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h2 className="text-3xl font-bold mb-4">Building Your Community...</h2>
                        <p className="text-[var(--text-secondary)]">Polymath AI is crafting the perfect environment based on your selections.</p>
                    </div>
                )
            case 'review':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Review Your New Community</h2>
                        <p className="text-[var(--text-secondary)] mb-6">Here's what the AI created. If you're happy, launch your community!</p>
                        <div className="space-y-6 bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-primary)]">
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">COMMUNITY NAME</h3>
                                <p className="text-xl font-bold text-[var(--text-primary)]">{generatedProfile.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">COLOR PALETTE</h3>
                                <div className="flex gap-2 mt-2">
                                    {Object.values(generatedProfile.style).map((color, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: color as string }}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">FOUNDING MEMBERS</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                                    {generatedProfile.foundingMembers.map((fm: any) => (
                                        <div key={fm.name} className="text-center p-2 bg-[var(--bg-tertiary)] rounded" title={fm.personaSummary}>
                                            <img src={`https://i.pravatar.cc/150?u=${encodeURIComponent(fm.name)}`} alt={fm.name} className="w-12 h-12 rounded-full mx-auto mb-2" />
                                            <p className="text-xs font-semibold truncate">{fm.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">WELCOME MESSAGE</h3>
                                <p className="text-sm text-[var(--text-primary)] italic p-3 bg-[var(--bg-tertiary)] rounded-md mt-2">"{generatedProfile.globalMessages[0].text}"</p>
                            </div>
                        </div>
                         <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep('vibe')} className="w-full bg-[var(--bg-tertiary)] hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                &larr; Re-Generate
                            </button>
                            <button onClick={handleComplete} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                                Launch Community
                            </button>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)] p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                        {isInitialSetup ? 'Welcome to PARC!' : 'Create a New Community'}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        {isInitialSetup ? 'Let\'s start by setting up your personalized research community.' : 'Define a new community to explore different themes and contexts.'}
                    </p>
                </div>

                <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl p-8">
                   <div className="mb-8 flex justify-center">
                     <StepIndicator currentStep={step} />
                   </div>
                    {renderContent()}
                </div>
                 {!isInitialSetup && onCancel && (
                    <div className="text-center mt-4">
                        <button onClick={onCancel} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunitySetupWizard;